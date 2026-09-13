"use server";

import type { AdminRole, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { requireAdminRole, auditAdminAction } from "./admin-actions";
import { roleRank } from "@/lib/admin-auth";

export type AdminActionResult = { ok: boolean; error?: string; message?: string; id?: string };

// ---------- USERS ----------
export async function setUserStatus(userId: string, status: UserStatus): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await auditAdminAction(admin, { action: "USER_STATUS", entityType: "USER", entityId: userId, description: `Set user status → ${status}` });
  return { ok: true, message: status === "ACTIVE" ? "User activated." : "User suspended." };
}

// ---------- MEMBERS ----------
export async function setMemberStatus(memberId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.member.update({ where: { id: memberId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "MEMBER_STATUS", entityType: "MEMBER", entityId: memberId, description: `Member status → ${status}` });
  return { ok: true };
}

export async function deleteMember(memberId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.member.delete({ where: { id: memberId } });
  await auditAdminAction(admin, { action: "MEMBER_DELETED", entityType: "MEMBER", entityId: memberId });
  return { ok: true, message: "Member deleted." };
}

// ---------- CONTACT MESSAGES ----------
export async function setContactStatus(messageId: string, status: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.contactMessage.update({ where: { id: messageId }, data: { status: status as never } });
  await auditAdminAction(admin, { action: "CONTACT_STATUS", entityType: "CONTACT_MESSAGE", entityId: messageId, description: `Contact → ${status}` });
  return { ok: true };
}

export async function deleteContactMessage(messageId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  await prisma.contactMessage.delete({ where: { id: messageId } });
  await auditAdminAction(admin, { action: "CONTACT_DELETED", entityType: "CONTACT_MESSAGE", entityId: messageId });
  return { ok: true, message: "Deleted." };
}

// ---------- ADMIN USERS (SUPER_ADMIN) ----------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAdminUser(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN"]);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim() || null;
  const role = String(formData.get("role") || "ADMIN") as AdminRole;
  const password = String(formData.get("password") || "");

  const rl = rateLimit("create-admin", { limit: 8, windowSec: 3600 });
  if (!rl.ok) return { ok: false, error: "Rate limit reached." };
  if (name.length < 2) return { ok: false, error: "Enter the admin's name." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  const clash = await prisma.adminUser.findUnique({ where: { email } });
  if (clash) return { ok: false, error: "An admin with this email already exists." };

  const created = await prisma.adminUser.create({
    data: {
      name,
      email,
      phone,
      role,
      passwordHash: await hashPassword(password),
      createdById: admin.id,
    },
  });
  await auditAdminAction(admin, { action: "ADMIN_CREATED", entityType: "ADMIN", entityId: created.id, description: `Created admin ${email} with role ${role}.` });
  return { ok: true, message: `Admin created (${role}).` };
}

export async function updateAdminRole(adminId: string, role: AdminRole): Promise<AdminActionResult> {
  const me = await requireAdminRole(["SUPER_ADMIN"]);
  if (adminId === me.id) return { ok: false, error: "You cannot change your own role." };
  const target = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!target) return { ok: false, error: "Admin not found." };
  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN")
    return { ok: false, error: "You cannot demote another super admin." };

  await prisma.adminUser.update({ where: { id: adminId }, data: { role } });
  await auditAdminAction(me, { action: "ADMIN_ROLE_CHANGED", entityType: "ADMIN", entityId: adminId, description: `Changed role of ${target.email} → ${role}.` });
  return { ok: true, message: "Role updated." };
}

export async function setAdminStatus(adminId: string, status: "ACTIVE" | "INACTIVE"): Promise<AdminActionResult> {
  const me = await requireAdminRole(["SUPER_ADMIN"]);
  if (adminId === me.id) return { ok: false, error: "You cannot deactivate your own account." };
  const target = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!target) return { ok: false, error: "Admin not found." };
  if (target.role === "SUPER_ADMIN" && status === "INACTIVE")
    return { ok: false, error: "Deactivate is disabled for super admins here — use role management carefully." };
  await prisma.adminUser.update({ where: { id: adminId }, data: { status } });
  await auditAdminAction(me, { action: "ADMIN_STATUS_CHANGED", entityType: "ADMIN", entityId: adminId, description: `Set ${target.email} → ${status}.` });
  return { ok: true, message: status === "ACTIVE" ? "Admin activated." : "Admin deactivated & access revoked." };
}

export async function deleteAdminUser(adminId: string): Promise<AdminActionResult> {
  const me = await requireAdminRole(["SUPER_ADMIN"]);
  if (adminId === me.id) return { ok: false, error: "You cannot delete your own account." };
  const target = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!target) return { ok: false, error: "Admin not found." };
  const superCount = await prisma.adminUser.count({ where: { role: "SUPER_ADMIN", status: "ACTIVE" } });
  if (target.role === "SUPER_ADMIN" && superCount <= 1)
    return { ok: false, error: "Cannot delete the last super admin." };
  await prisma.adminUser.delete({ where: { id: adminId } });
  await auditAdminAction(me, { action: "ADMIN_DELETED", entityType: "ADMIN", entityId: adminId, description: `Deleted admin ${target.email}.` });
  return { ok: true, message: "Admin deleted." };
}

export { roleRank };

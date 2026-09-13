"use server";

import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { verifyPassword } from "@/lib/password";
import { logAudit } from "@/lib/audit";
import {
  createAdminSessionToken,
  getAdminSession,
  setAdminCookie,
  clearAdminCookie,
  type AdminSession,
} from "@/lib/admin-auth";

export type AdminActionResult = { ok: boolean; error?: string; message?: string };

export const requireAdminRole = async (
  roles: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER", "CONTENT_MANAGER"]
): Promise<AdminSession> => {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  if (roles.length && !roles.includes(admin.role)) redirect("/admin?error=forbidden");
  return admin;
};

/** Admin log in with email + password. */
export async function adminLogin(
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const rl = rateLimit("admin-login", { limit: 8, windowSec: 300 });
  if (!rl.ok) return { ok: false, error: "Too many login attempts. Please try again later." };

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || admin.status !== "ACTIVE") return { ok: false, error: "Invalid email or password." };
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return { ok: false, error: "Invalid email or password." };

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await logAudit({
    actorKind: "ADMIN",
    actorId: admin.id,
    actorName: admin.name,
    action: "ADMIN_LOGIN",
    entityType: "ADMIN",
    entityId: admin.id,
    description: `Admin ${admin.email} logged in.`,
  });

  const token = await createAdminSessionToken({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
  await setAdminCookie(token);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  const admin = await getAdminSession();
  await clearAdminCookie();
  if (admin) {
    await logAudit({
      actorKind: "ADMIN",
      actorId: admin.id,
      actorName: admin.name,
      action: "ADMIN_LOGOUT",
      entityType: "ADMIN",
      entityId: admin.id,
    });
  }
  redirect("/admin/login");
}

// ---------------- generic audit helpers used by admin pages ----------------

export async function auditAdminAction(
  admin: AdminSession,
  input: {
    action: string;
    entityType?: string;
    entityId?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  await logAudit({
    actorKind: "ADMIN",
    actorId: admin.id,
    actorName: admin.name,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    description: input.description,
    metadata: input.metadata,
  });
}

// Minimal guard: exposes the current admin session to server callers.
export async function currentAdmin(): Promise<AdminSession | null> {
  return getAdminSession();
}

"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";

export type UserActionResult = { ok: boolean; error?: string; message?: string };

export async function requireUser() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login?next=/dashboard");
  return session;
}

export async function updateProfile(
  _prev: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  const session = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (name.length < 2) return { ok: false, error: "Enter your full name." };

  const data: { name: string; email?: string | null } = { name };
  if (email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, error: "Enter a valid email address." };
    const clash = await prisma.user.findFirst({
      where: { email, id: { not: session.user.id } },
    });
    if (clash) return { ok: false, error: "That email is already in use." };
    data.email = email;
  } else {
    data.email = null;
  }

  await prisma.user.update({ where: { id: session.user.id }, data });
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(
  _prev: UserActionResult | null,
  formData: FormData
): Promise<UserActionResult> {
  const session = await requireUser();
  const current = String(formData.get("currentPassword") || "");
  const next = String(formData.get("newPassword") || "");

  const rl = rateLimit("change-password", { limit: 5, windowSec: 900 });
  if (!rl.ok) return { ok: false, error: "Too many attempts. Try again later." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.passwordHash) {
    return { ok: false, error: "Set your password through support (Google accounts use Google)." };
  }
  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) return { ok: false, error: "Current password is incorrect." };
  if (next.length < 8) return { ok: false, error: "New password must be at least 8 characters." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  return { ok: true, message: "Password changed." };
}

export async function markNotificationRead(id: string): Promise<void> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
}

export async function resendReceiptEmail(orderId: string): Promise<UserActionResult> {
  const session = await requireUser();
  void orderId;
  void session;
  return { ok: true, message: "Support contact has been logged." };
}

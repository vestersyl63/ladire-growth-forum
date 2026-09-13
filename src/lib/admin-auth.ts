import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import type { AdminRole } from "@prisma/client";

import { prisma } from "./prisma";

export const ADMIN_COOKIE = "ladire_admin_session";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12; // 12 hours

export type AdminSession = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

function secretBytes(): Uint8Array {
  const raw = process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET;
  if (!raw) throw new Error("ADMIN_AUTH_SECRET or AUTH_SECRET is required for admin authentication.");
  const bytes = Buffer.from(raw, "utf8");
  if (bytes.length >= 32) return new Uint8Array(bytes);
  // derive a fixed 32-byte key from whatever secret is configured
  return new Uint8Array(createHash("sha256").update(raw).digest());
}

export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  return new SignJWT({
    name: session.name,
    email: session.email,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_COOKIE_MAX_AGE}s`)
    .sign(secretBytes());
}

export async function setAdminCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/**
 * Returns the active admin session (fresh DB check on role/status every
 * request so deactivated admins are locked out immediately).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretBytes());
    const id = payload.sub;
    if (!id) return null;
    const admin = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (!admin || admin.status !== "ACTIVE") return null;
    return { id: admin.id, name: admin.name, email: admin.email, role: admin.role };
  } catch {
    return null;
  }
}

/** Redirects to /admin/login when not authenticated (for pages/layouts). */
export async function requireAdmin(roles?: AdminRole[]): Promise<AdminSession> {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");
  if (roles && roles.length > 0 && !roles.includes(admin.role)) {
    redirect("/admin?error=forbidden");
  }
  return admin;
}

export function roleRank(role: AdminRole): number {
  switch (role) {
    case "SUPER_ADMIN":
      return 4;
    case "ADMIN":
      return 3;
    case "PAYMENT_VERIFIER":
      return 2;
    case "CONTENT_MANAGER":
      return 1;
  }
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  PAYMENT_VERIFIER: "Payment Verifier",
  CONTENT_MANAGER: "Content Manager",
};

/** Convenience list used by the admin UI to build role guards. */
export const ROLE_ALL: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER", "CONTENT_MANAGER"];

import type { AdminRole } from "@prisma/client";
import type { AdminSection } from "@/components/admin/admin-shell";

type Allowed = Record<AdminSection, AdminRole[]>;

const ALL: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER", "CONTENT_MANAGER"];
const SA_ADMIN: AdminRole[] = ["SUPER_ADMIN", "ADMIN"];
const SA_ADMIN_PV: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER"];
const SA_ADMIN_CM: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"];

export const SECTION_ALLOWED: Allowed = {
  overview: ALL,
  payments: SA_ADMIN_PV, // approve/reject/manage payments
  votes: SA_ADMIN_PV, // vote analytics
  users: SA_ADMIN,
  members: SA_ADMIN,
  events: SA_ADMIN_CM,
  registrations: SA_ADMIN_CM,
  bookings: SA_ADMIN_CM,
  vacation: SA_ADMIN_CM,
  awards: SA_ADMIN_CM,
  nominees: SA_ADMIN_CM,
  announcements: SA_ADMIN_CM,
  banners: SA_ADMIN_CM,
  contacts: SA_ADMIN,
  settings: SA_ADMIN,
  admins: ["SUPER_ADMIN"],
  audit: SA_ADMIN,
};

export function allowedSectionsFor(role: AdminRole): AdminSection[] {
  return (Object.keys(SECTION_ALLOWED) as AdminSection[]).filter((s) =>
    SECTION_ALLOWED[s].includes(role)
  );
}

export function hasRole(role: AdminRole, roles: AdminRole[]): boolean {
  return roles.includes(role);
}

export function canManagePayments(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "PAYMENT_VERIFIER";
}
export function canManageContent(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "CONTENT_MANAGER";
}
export function isSuperOrAdmin(role: AdminRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

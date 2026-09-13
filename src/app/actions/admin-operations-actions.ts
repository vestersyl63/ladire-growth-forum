"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { approvePayment, rejectPayment, markUnderReview } from "@/lib/payments";
import { requireAdminRole, auditAdminAction } from "./admin-actions";

export type AdminActionResult = { ok: boolean; error?: string; message?: string };

// ---------------- Settings ----------------

/** Persist site settings. Form fields named s.<key>. */
export async function saveSettings(
  group: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const defs = DEFAULT_SETTINGS.filter((d) => d.group === group);
  const changed: string[] = [];

  await prisma.$transaction(
    defs.map((d) => {
      const fieldKey = `s.${d.key}`;
      let value = formData.get(fieldKey);
      let strVal = typeof value === "string" ? value : "";
      if (d.type === "BOOLEAN") {
        strVal = value === "on" ? "true" : "false";
      }
      changed.push(d.key);
      return prisma.siteSetting.upsert({
        where: { key: d.key },
        update: { value: strVal, type: d.type, group: d.group, label: d.label, description: d.description ?? null },
        create: { key: d.key, value: strVal, type: d.type, group: d.group, label: d.label, description: d.description ?? null },
      });
    })
  );

  await auditAdminAction(admin, {
    action: "SETTINGS_CHANGED",
    entityType: "SETTING",
    description: `Updated settings in group "${group}".`,
    metadata: { group, keys: changed },
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/vote");
  revalidatePath("/contact");
  return { ok: true, message: "Settings saved." };
}

export async function resetSetting(key: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);
  const def = DEFAULT_SETTINGS.find((d) => d.key === key);
  if (!def) return { ok: false, error: "Unknown setting." };
  await prisma.siteSetting.upsert({
    where: { key },
    update: { value: def.defaultValue },
    create: { key, value: def.defaultValue, type: def.type, group: def.group, label: def.label, description: def.description ?? null },
  });
  await auditAdminAction(admin, { action: "SETTINGS_RESET", entityType: "SETTING", description: `Reset setting ${key} to default.` });
  return { ok: true, message: "Setting reset." };
}

// ---------------- Payments (verification) ----------------

export async function adminApprovePayment(paymentId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER"]);
  const res = await approvePayment({ id: admin.id, name: admin.name }, paymentId);
  revalidatePath("/admin/payments");
  revalidatePath("/admin");
  if (res.ok) return { ok: true, message: "Payment approved and votes counted." };
  return { ok: false, error: res.error };
}

export async function adminRejectPayment(
  paymentId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER"]);
  const reason = String(formData.get("reason") || "");
  const res = await rejectPayment({ id: admin.id, name: admin.name }, paymentId, reason);
  revalidatePath("/admin/payments");
  if (res.ok) return { ok: true, message: "Payment rejected. Votes were not counted." };
  return { ok: false, error: res.error };
}

export async function adminMarkUnderReview(paymentId: string): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER"]);
  const res = await markUnderReview({ id: admin.id, name: admin.name }, paymentId);
  revalidatePath("/admin/payments");
  return res.ok ? { ok: true, message: "Moved to under review." } : { ok: false, error: res.error };
}

/** Private admin note on a payment (not visible to the voter). */
export async function addPaymentNote(
  paymentId: string,
  _prev: AdminActionResult | null,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER"]);
  const body = String(formData.get("body") || "").trim();
  if (body.length < 2) return { ok: false, error: "Note is empty." };
  await prisma.paymentNote.create({
    data: { paymentId, adminId: admin.id, body },
  });
  await auditAdminAction(admin, {
    action: "PAYMENT_NOTE_ADDED",
    entityType: "PAYMENT",
    entityId: paymentId,
    description: `Added internal note to payment.`,
  });
  revalidatePath(`/admin/payments/${paymentId}`);
  return { ok: true, message: "Note added (private)." };
}

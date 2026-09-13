"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createVoteOrder } from "@/lib/awards";
import { notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { receiptSubmitSchema } from "@/lib/validations";
import { saveFile, FileValidationError } from "@/lib/storage";
import { koboToNairaString } from "@/lib/utils";
import { getSettingsMap } from "@/lib/settings";

export type VoteActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  orderId?: string;
  reference?: string;
  amountKobo?: number;
  quantity?: number;
};

/**
 * Step 1 — user chooses nominee + vote quantity. Server computes the price,
 * enforces voting rules/deadline and creates the PENDING payment.
 */
export async function startVoteOrder(
  _prev: VoteActionResult | null,
  formData: FormData
): Promise<VoteActionResult> {
  const session = await getSession();
  if (!session?.user?.id)
    return { ok: false, error: "Please sign in to vote. Create a free account first." };

  const nomineeId = String(formData.get("nomineeId") || "");
  const quantity = Number(formData.get("quantity") || 0);

  const rl = rateLimit("vote-order", { limit: 8, windowSec: 600 });
  if (!rl.ok)
    return { ok: false, error: "Too many vote attempts. Please try again in a few minutes." };

  const result = await createVoteOrder({
    userId: session.user.id,
    nomineeId,
    quantity,
  });
  if (!result.ok) return { ok: false, error: result.error };

  return {
    ok: true,
    message: "Voting order created.",
    orderId: result.orderId,
    reference: result.reference,
    amountKobo: result.amountKobo,
    quantity: result.quantity,
  };
}

/** WhatsApp prefill for the payment confirmation CTA. */
export async function buildWhatsAppPaymentMessage(orderId: string): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) return "";
  const order = await prisma.voteOrder.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });
  if (!order || order.userId !== session.user.id) return "";
  const map = await getSettingsMap();
  const nominee = order.nomineeName;
  const category = order.categoryName;
  const lines = [
    "LADIRE AWARDS 2026",
    `Payment Reference: ${order.reference}`,
    `Nominee: ${nominee}`,
    `Category: ${category}`,
    `Number of Votes: ${order.quantity}`,
    `Amount: ${koboToNairaString(order.amountKobo)}`,
    "",
    "Kindly confirm this payment. Receipt attached.",
  ];
  if (!map["contact.whatsapp"]) return "";
  return lines.join("\n");
}

/**
 * Step 2 — user uploads receipt + payment details. The payment stays
 * PENDING/UNDER_REVIEW and is ONLY counted after an admin approves it.
 */
export async function submitReceipt(
  orderId: string,
  _prev: VoteActionResult | null,
  formData: FormData
): Promise<VoteActionResult> {
  const session = await getSession();
  if (!session?.user?.id)
    return { ok: false, error: "Please sign in." };

  const order = await prisma.voteOrder.findUnique({
    where: { id: orderId },
    include: { payment: { include: { receipts: true } } },
  });
  if (!order || order.userId !== session.user.id)
    return { ok: false, error: "Vote order not found." };
  if (!order.payment)
    return { ok: false, error: "Payment record missing for this order." };
  const payment = order.payment;
  if (payment.status === "APPROVED")
    return { ok: false, error: "This payment is already approved and cannot be changed." };

  // Guard against accidental duplicate submissions (e.g. double click / refresh).
  if (
    payment.status === "UNDER_REVIEW" &&
    payment.receipts.length > 0 &&
    payment.updatedAt.getTime() > Date.now() - 90_000
  ) {
    return {
      ok: false,
      error: "This payment was just submitted and is under review. You can upload a corrected receipt shortly if needed.",
    };
  }

  const rl = rateLimit(`receipt:${session.user.id}`, { limit: 6, windowSec: 900 });
  if (!rl.ok)
    return { ok: false, error: "Too many submissions. Please try again later." };

  const parsed = receiptSubmitSchema.safeParse({
    amountPaid: pick(formData, "amountPaid"),
    bankName: pick(formData, "bankName"),
    transactionDate: pick(formData, "transactionDate"),
    note: pick(formData, "note") || null,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.message ?? "Please check your payment details." };
  }
  const d = parsed.data;

  const file = formData.get("receipt");
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Please upload your proof of payment (receipt)." };
  }

  let stored;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    stored = await saveFile({
      buffer,
      mimeType: file.type || "application/octet-stream",
      originalName: file.name,
      isPublic: false,
      folder: "receipts",
      kind: "receipt",
    });
  } catch (e) {
    if (e instanceof FileValidationError) {
      return { ok: false, error: e.message };
    }
    console.error("[vote] upload failed", e);
    return { ok: false, error: "Unable to upload receipt. Please try again." };
  }

  const amountPaidKobo = Math.round(d.amountPaid * 100);
  const txnDate = new Date(d.transactionDate);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.paymentReceipt.create({
        data: {
          paymentId: payment.id,
          storageKey: stored.key,
          url: stored.url,
          originalName: stored.originalName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          uploadedById: session.user.id,
        },
      });
      // Append (never overwrite) the voter's details; a payment that was
      // rejected becomes reviewable again once a corrected proof is uploaded.
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          amountPaidKobo,
          bankName: d.bankName,
          transactionDate: txnDate,
          paymentNote: d.note ?? null,
          ...(payment.status === "REJECTED"
            ? { status: "UNDER_REVIEW", rejectedReason: null }
            : payment.status === "PENDING"
              ? { status: "UNDER_REVIEW" }
              : {}),
        },
      });
      await tx.auditLog.create({
        data: {
          actorKind: "USER",
          actorId: session.user.id,
          actorName: session.user.name ?? undefined,
          action: "PAYMENT_RECEIPT_SUBMITTED",
          entityType: "PAYMENT",
          entityId: payment.id,
          description: `Receipt submitted for ${payment.reference} (${koboToNairaString(amountPaidKobo)}).`,
          metadata: { reference: payment.reference, fileKey: stored.key },
        },
      });
    });
  } catch (err) {
    console.error("[vote] receipt tx failed", err);
    return { ok: false, error: "Unable to submit payment details. Please try again." };
  }

  await notify(session.user.id, {
    type: "PAYMENT_SUBMITTED",
    title: "Payment submitted for verification",
    body: `Reference ${payment.reference} is now with the LADIRE team. Votes are counted only after your payment is approved.`,
    link: "/dashboard/votes",
  });

  const expected = koboToNairaString(payment.amountExpectedKobo);
  const mismatch =
    amountPaidKobo !== payment.amountExpectedKobo
      ? ` Note: you submitted ${koboToNairaString(amountPaidKobo)} but the expected amount is ${expected}.`
      : "";
  void mismatch;

  return {
    ok: true,
    message:
      amountPaidKobo === payment.amountExpectedKobo
        ? "Payment submitted successfully. Your votes will be counted after verification."
        : `Payment submitted. Our team will verify it — the expected amount was ${expected}.`,
    orderId: order.id,
  };
}

function pick(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" ? v : undefined;
}

import "server-only";

import type { PaymentStatus } from "@prisma/client";
import { prisma } from "./prisma";
import { notify } from "./notifications";
import { logAudit } from "./audit";

export type PaymentServiceResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; code?: string };

const REVIEWABLE: PaymentStatus[] = ["PENDING", "UNDER_REVIEW"];

function notifyReviewableStatus(status: string): boolean {
  return (REVIEWABLE as readonly string[]).includes(status);
}

/**
 * Approve a payment and grant its votes.
 *
 * Safety guarantees:
 *  - guarded update (status must still be PENDING/UNDER_REVIEW) — a second
 *    click finds count === 0 and aborts before touching votes;
 *  - Vote.orderId is UNIQUE in the DB — a duplicate grant is impossible;
 *  - everything (status change, Vote row, nominee increment, audit log,
 *    notification) runs in ONE transaction — any failure rolls back.
 */
export async function approvePayment(admin: { id: string; name: string }, paymentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      voteOrder: { include: { nominee: true, category: true, user: true } },
    },
  });
  if (!payment) return { ok: false as const, error: "Payment not found.", code: "NF" };
  if (payment.status === "APPROVED")
    return { ok: false as const, error: "This payment has already been approved.", code: "DUP" };
  if (payment.status === "REJECTED")
    return { ok: false as const, error: "This payment was rejected and cannot be approved.", code: "REJ" };
  if (!payment.voteOrder)
    return { ok: false as const, error: "Payment has no linked vote order.", code: "NOORD" };

  const order = payment.voteOrder;
  const nominee = order.nominee;

  try {
    await prisma.$transaction(async (tx) => {
      // Guarded transition — idempotent against double clicks.
      const updated = await tx.payment.updateMany({
        where: { id: paymentId, status: { in: REVIEWABLE } },
        data: {
          status: "APPROVED",
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) {
        throw new Error("PAYMENT_ALREADY_PROCESSED");
      }

      // Vote row — unique orderId makes double-grant impossible even if the
      // guarded update above were bypassed.
      await tx.vote.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          nomineeId: order.nomineeId,
          categoryId: order.categoryId,
          quantity: order.quantity,
          approvedById: admin.id,
        },
      });

      await tx.nominee.update({
        where: { id: nominee.id },
        data: { officialVotes: { increment: order.quantity } },
      });

      await tx.auditLog.create({
        data: {
          actorKind: "ADMIN",
          actorId: admin.id,
          actorName: admin.name,
          action: "APPROVE_PAYMENT",
          entityType: "PAYMENT",
          entityId: payment.id,
          description: `Approved payment ${payment.reference} and granted ${order.quantity} official vote(s) to ${nominee.stageName || nominee.name} (${order.categoryName}).`,
          metadata: {
            reference: payment.reference,
            amountKobo: payment.amountExpectedKobo,
            quantity: order.quantity,
            nominee: nominee.name,
            category: order.categoryName,
            voteOrderId: order.id,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "PAYMENT_APPROVED",
          title: "Payment approved — votes counted 🎉",
          body: `Your payment ${payment.reference} was approved. ${order.quantity} vote(s) have been officially added to ${nominee.stageName || nominee.name} in ${order.categoryName}.`,
          link: "/dashboard/votes",
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "PAYMENT_ALREADY_PROCESSED") {
      return { ok: false as const, error: "This payment has already been processed.", code: "DUP" };
    }
    console.error("[payments] approve error", err);
    return { ok: false as const, error: "Approval failed. No changes were made.", code: "TX" };
  }

  // Fire-and-forget outside the transaction: queueMail for the voter.
  const userEmail = order.user.email;
  if (userEmail) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { queueMail } = await import("./mail");
    void queueMail({
      to: userEmail,
      subject: "Your LADIRE votes have been counted",
      text: `Payment ${payment.reference} approved. ${order.quantity} votes added to ${nominee.name}.`,
    }).catch(() => undefined);
  }

  return { ok: true as const };
}

/**
 * Reject a payment. Votes are never counted. Requires a reason, which is
 * recorded and shown to the voter.
 */
export async function rejectPayment(
  admin: { id: string; name: string },
  paymentId: string,
  reason: string
): Promise<PaymentServiceResult> {
  const clean = (reason || "").trim();
  if (clean.length < 3)
    return { ok: false, error: "A rejection reason is required.", code: "REASON" };

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { voteOrder: { include: { nominee: true, category: true, user: true } } },
  });
  if (!payment) return { ok: false, error: "Payment not found.", code: "NF" };
  if (payment.status === "APPROVED")
    return { ok: false, error: "This payment is already approved and cannot be rejected.", code: "APPR" };
  if (payment.status === "REJECTED")
    return { ok: false, error: "This payment is already rejected.", code: "DUP" };

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { id: paymentId, status: { in: REVIEWABLE } },
        data: {
          status: "REJECTED",
          rejectedReason: clean,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new Error("PAYMENT_ALREADY_PROCESSED");

      await tx.auditLog.create({
        data: {
          actorKind: "ADMIN",
          actorId: admin.id,
          actorName: admin.name,
          action: "REJECT_PAYMENT",
          entityType: "PAYMENT",
          entityId: payment.id,
          description: `Rejected payment ${payment.reference}. Reason: ${clean}`,
          metadata: { reference: payment.reference, reason: clean },
        },
      });

      if (payment.voteOrder) {
        await tx.notification.create({
          data: {
            userId: payment.voteOrder.userId,
            type: "PAYMENT_REJECTED",
            title: "Payment rejected",
            body: `Your payment ${payment.reference} was rejected. Reason: ${clean}`,
            link: "/dashboard/votes",
          },
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "PAYMENT_ALREADY_PROCESSED") {
      return { ok: false, error: "This payment has already been processed.", code: "DUP" };
    }
    console.error("[payments] reject error", err);
    return { ok: false, error: "Rejection failed. No changes were made.", code: "TX" };
  }
  return { ok: true };
}

/** PENDING -> UNDER_REVIEW (admin begins verification). */
export async function markUnderReview(
  admin: { id: string; name: string },
  paymentId: string
): Promise<PaymentServiceResult> {
  const res = await prisma.payment.updateMany({
    where: { id: paymentId, status: { in: REVIEWABLE } },
    data: { status: "UNDER_REVIEW", reviewedById: admin.id },
  });
  if (res.count !== 1)
    return { ok: false, error: "This payment cannot be moved to under review.", code: "STATE" };
  await logAudit({
    actorKind: "ADMIN",
    actorId: admin.id,
    actorName: admin.name,
    action: "MARK_PAYMENT_UNDER_REVIEW",
    entityType: "PAYMENT",
    entityId: paymentId,
    description: `Moved payment to under review.`,
  });
  return { ok: true };
}

/** Safe status helper. */
export { notifyReviewableStatus };

/**
 * Full payment record used by dashboards (includes order + nominee + receipts).
 */
export async function getPaymentWithRelations(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      voteOrder: {
        include: { nominee: { include: { category: true } }, award: true, user: true },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
      receipts: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
      reviewedBy: { select: { id: true, name: true } },
    },
  });
}

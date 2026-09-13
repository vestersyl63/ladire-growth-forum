import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle2, Building2, Hash } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, formatNaira, timeAgoLabel } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { getPaymentWithRelations } from "@/lib/payments";
import { ConfirmApprove, RejectForm, UnderReviewButton } from "@/components/admin/verify-controls";
import { NoteForm } from "./note-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payment detail", robots: { index: false } };

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPaymentWithRelations(id);
  if (!payment) notFound();

  const order = payment.voteOrder;
  const nominee = order?.nominee;
  const mismatch =
    payment.amountPaidKobo != null && payment.amountPaidKobo !== payment.amountExpectedKobo;

  const auditRows = await prisma.auditLog.findMany({
    where: { entityType: "PAYMENT", entityId: payment.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const reviewable = payment.status === "PENDING" || payment.status === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      <Link href="/admin/payments" className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-600 hover:text-navy-950">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to verification
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">{payment.reference}</h1>
          <p className="text-sm text-navy-500">Submitted {fmtDateTime(payment.createdAt)}</p>
        </div>
        <StatusPill status={payment.status} />
      </header>

      {/* Warning for rejected / mismatch */}
      {payment.status === "REJECTED" && payment.rejectedReason ? (
        <div className="flex items-start gap-3 rounded-2xl border border-crimson-200 bg-crimson-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden="true" />
          <div>
            <p className="font-bold text-crimson-900">Rejected</p>
            <p className="text-sm text-crimson-800">{payment.rejectedReason}</p>
          </div>
        </div>
      ) : null}
      {mismatch ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="text-sm text-amber-900">
            <p className="font-bold">Amount mismatch</p>
            <p>
              Expected <b>{formatNaira(payment.amountExpectedKobo)}</b> but voter submitted{" "}
              <b>{formatNaira(payment.amountPaidKobo ?? 0)}</b>. Do not auto-approve — reconcile with
              your bank statement.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Order summary */}
          <div className="card overflow-hidden">
            <div className="border-b border-navy-100 bg-navy-50/60 px-5 py-3">
              <h2 className="font-display text-lg font-extrabold text-navy-950">Vote order</h2>
            </div>
            <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              <Item k="Nominee" v={<Link className="font-semibold text-crimson-600 hover:underline" href={`/admin/nominees/${order?.nomineeId ?? "#"}`}>{nominee?.stageName || nominee?.name || "—"}</Link>} />
              <Item k="Category" v={order?.categoryName || "—"} />
              <Item k="Vote quantity" v={<b>{order?.quantity}</b>} />
              <Item k="Award" v={order?.award.title || "—"} />
              <Item k="Price per vote" v={order ? formatNaira(order.pricePerVoteKobo) : "—"} />
              <Item k="Total (expected)" v={<b className="text-crimson-700">{formatNaira(payment.amountExpectedKobo)}</b>} />
              <Item k="Amount paid" v={payment.amountPaidKobo != null ? formatNaira(payment.amountPaidKobo) : "—"} />
              <Item k="Bank used" v={payment.bankName || "—"} />
              <Item k="Transfer date" v={payment.transactionDate ? fmtDate(payment.transactionDate) : "—"} />
              <Item k="Voter note" v={<span className="break-words">{payment.paymentNote || "—"}</span>} />
            </dl>
            <div className="border-t border-navy-100 px-5 py-3 text-sm">
              <p className="text-navy-600">Voter: <b className="text-navy-900">{payment.user?.name || "—"}</b> · {payment.user?.phone || payment.user?.email || ""}</p>
            </div>
          </div>

          {/* Receipts */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-navy-100 bg-navy-50/60 px-5 py-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
                <FileText className="h-5 w-5 text-crimson-600" aria-hidden="true" /> Proof of payment
              </h2>
              <span className="chip bg-navy-100 text-navy-700">{payment.receipts.length} file{payment.receipts.length === 1 ? "" : "s"}</span>
            </div>
            <div className="space-y-4 p-5">
              {payment.receipts.length === 0 ? (
                <p className="text-sm text-navy-500">No receipt uploaded yet.</p>
              ) : (
                payment.receipts.map((r) => {
                  const isImage = r.mimeType.startsWith("image/");
                  return (
                    <div key={r.id} className="rounded-xl border border-navy-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <p className="min-w-0 truncate font-semibold text-navy-900">{r.originalName || r.storageKey}</p>
                        <a
                          href={`/files/${encodeURIComponent(r.storageKey)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          View full file
                        </a>
                      </div>
                      <p className="mt-1 text-xs text-navy-400">
                        {(r.sizeBytes / 1024).toFixed(0)} KB · uploaded {timeAgoLabel(r.createdAt)}
                      </p>
                      {isImage ? (
                        <div className="mt-3 overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
                          {/* Receipt images load via the authorized /files route */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/files/${encodeURIComponent(r.storageKey)}`}
                            alt="Payment receipt preview"
                            className="max-h-96 w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card overflow-hidden">
            <div className="border-b border-navy-100 bg-navy-50/60 px-5 py-3">
              <h2 className="font-display text-lg font-extrabold text-navy-950">Internal notes (private)</h2>
            </div>
            <div className="space-y-3 p-5">
              {payment.notes.length ? (
                payment.notes.map((note) => (
                  <div key={note.id} className="rounded-xl bg-navy-50 p-3 text-sm">
                    <p className="whitespace-pre-wrap text-navy-800">{note.body}</p>
                    <p className="mt-1 text-xs text-navy-400">
                      {note.admin?.name || "Admin"} · {timeAgoLabel(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-navy-500">No internal notes.</p>
              )}
              <NoteForm paymentId={payment.id} />
            </div>
          </div>

          {/* Audit trail */}
          <div className="card overflow-hidden">
            <div className="border-b border-navy-100 bg-navy-50/60 px-5 py-3">
              <h2 className="font-display text-lg font-extrabold text-navy-950">Audit trail</h2>
            </div>
            <div className="p-5">
              {auditRows.length ? (
                <ul className="space-y-2">
                  {auditRows.map((a) => (
                    <li key={a.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-navy-300" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-navy-800">{a.description || a.action}</p>
                        <p className="text-xs text-navy-400">
                          {a.actorName || a.actorId || "system"} · {fmtDateTime(a.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-500">No audit entries yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Verification actions</h2>
            <div className="mt-4 space-y-3">
              {payment.status === "APPROVED" ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  <div className="text-sm text-emerald-900">
                    <p className="font-bold">Approved</p>
                    <p className="text-xs">
                      {order?.quantity} vote{order?.quantity === 1 ? "" : "s"} granted to {nominee?.stageName || nominee?.name}. Reviewer: {payment.reviewedBy?.name || "—"} · {fmtDateTime(payment.reviewedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {reviewable && order ? (
                    <ConfirmApprove
                      paymentId={payment.id}
                      amountKobo={payment.amountExpectedKobo}
                      quantity={order.quantity}
                      nomineeName={order.nomineeName}
                      reference={payment.reference}
                    />
                  ) : null}
                  {payment.status === "PENDING" && order ? <UnderReviewButton paymentId={payment.id} /> : null}
                  {reviewable ? (
                    <RejectForm paymentId={payment.id} />
                  ) : payment.status === "REJECTED" ? (
                    <p className="rounded-xl border border-navy-100 bg-navy-50 p-3 text-sm text-navy-600">
                      This payment is rejected. The voter may upload a corrected receipt, which returns
                      it to under review.
                    </p>
                  ) : null}
                </>
              )}
            </div>
            <div className="mt-4 space-y-1.5 border-t border-navy-100 pt-4 text-xs text-navy-500">
              <p className="flex items-center gap-2"><Hash className="h-3.5 w-3.5" aria-hidden="true" /> Reference: {payment.reference}</p>
              <p className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5" aria-hidden="true" /> Payment ID: {payment.id.slice(-10)}</p>
            </div>
          </div>
          <div className="card p-5">
            <h3 className="font-display font-extrabold text-navy-950">Reconciliation</h3>
            <ul className="mt-3 space-y-2 text-sm text-navy-700">
              <li className="flex justify-between"><span>Expected</span><b>{formatNaira(payment.amountExpectedKobo)}</b></li>
              <li className="flex justify-between"><span>Submitted</span><b className={mismatch ? "text-crimson-600" : ""}>{payment.amountPaidKobo != null ? formatNaira(payment.amountPaidKobo) : "—"}</b></li>
              <li className="flex justify-between"><span>Receipts</span><b>{payment.receipts.length}</b></li>
              <li className="flex justify-between"><span>Bank</span><b>{payment.bankName || "—"}</b></li>
            </ul>
            {!mismatch && payment.amountPaidKobo != null ? (
              <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                Amount matches expectation.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-bold uppercase tracking-wide text-navy-400">{k}</dt>
      <dd className="text-sm text-navy-900">{v}</dd>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Vote as VoteIcon,
  Building2,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  FileText,
} from "lucide-react";

import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings } from "@/lib/site";
import { fmtDate, fmtDateTime, formatNaira, timeAgoLabel } from "@/lib/utils";
import { ReceiptUploader } from "@/components/user/receipt-uploader";
import { WhatsAppChatLink } from "@/components/brand/icons";
import { StatusPill } from "@/components/user/status-pill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voting & payments",
  description: "Your LADIRE Awards voting history and payment statuses.",
};

export default async function VotesPage() {
  const session = await requireUser();
  const [orders, settings] = await Promise.all([
    prisma.voteOrder.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      include: {
        payment: { include: { receipts: { orderBy: { createdAt: "desc" } } } },
        nominee: true,
      },
    }),
    getPublicSiteSettings(),
  ]);

  const waText = (o: (typeof orders)[number]) =>
    [
      "LADIRE AWARDS 2026",
      `Payment Reference: ${o.reference}`,
      `Nominee: ${o.nomineeName}`,
      `Category: ${o.categoryName}`,
      `Number of Votes: ${o.quantity}`,
      `Amount: ${formatNaira(o.amountKobo)}`,
    ].join("\n");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Voting &amp; payments</h1>
          <p className="mt-1 text-sm text-navy-500">
            Every transaction below is recorded — you can’t edit completed votes.
          </p>
        </div>
        <Link href="/vote" className="btn btn-primary btn-md">
          <VoteIcon className="h-4 w-4" aria-hidden="true" /> Buy more votes
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <VoteIcon className="mx-auto h-12 w-12 text-navy-300" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-900">
            You have not submitted any votes yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
            Browse the award categories, choose a nominee and cast your first vote.
          </p>
          <Link href="/vote" className="btn btn-primary btn-md mt-6">
            Start voting
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => {
            const p = o.payment;
            return (
              <article key={o.id} className="card overflow-hidden">
                {/* header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 bg-navy-50/40 px-5 py-4">
                  <div>
                    <p className="font-display text-lg font-extrabold text-navy-950">
                      {o.nomineeName}
                      <span className="ml-2 text-sm font-semibold text-navy-500">· {o.categoryName}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-navy-500">
                      {o.quantity} vote{o.quantity === 1 ? "" : "s"} ·{" "}
                      {formatNaira(o.amountKobo)} · {fmtDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={p?.status ?? "PENDING"} />
                    <code className="hidden rounded-lg bg-navy-100 px-2.5 py-1 text-xs font-bold text-navy-800 sm:inline">
                      {o.reference}
                    </code>
                  </div>
                </div>

                {/* body by status */}
                <div className="space-y-4 p-5">
                  {/* Approved */}
                  {p?.status === "APPROVED" ? (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <div className="flex-1 text-sm">
                        <p className="font-bold text-emerald-900">
                          Approved — {o.quantity} official vote{o.quantity === 1 ? "" : "s"} counted for {o.nomineeName}.
                        </p>
                        <p className="mt-0.5 text-xs text-emerald-800">
                          Approved {fmtDateTime(p.reviewedAt)} by LADIRE. Payment ref {o.reference}.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {/* Rejected */}
                  {p?.status === "REJECTED" ? (
                    <div className="rounded-xl border border-crimson-200 bg-crimson-50 p-4">
                      <p className="flex items-center gap-2 font-bold text-crimson-900">
                        <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" /> Payment rejected — votes not counted
                      </p>
                      {p.rejectedReason ? (
                        <p className="mt-1.5 rounded-lg bg-white/70 px-3 py-2 text-sm text-crimson-900">
                          <span className="font-bold">Reason: </span>{p.rejectedReason}
                        </p>
                      ) : null}
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-bold text-crimson-700">
                          Upload a corrected receipt
                        </summary>
                        <div className="mt-3">
                          <ReceiptUploader orderId={o.id} expectedKobo={o.amountKobo} />
                        </div>
                      </details>
                    </div>
                  ) : null}

                  {/* Pending / Under review — payment status display */}
                  {p && (p.status === "PENDING" || p.status === "UNDER_REVIEW") ? (
                    <>
                      {p.receipts.length === 0 && p.status === "PENDING" ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-navy-100 bg-navy-50/60 p-4 text-sm">
                            <p className="flex items-center gap-2 font-bold text-navy-900">
                              <Wallet className="h-4 w-4 text-crimson-600" aria-hidden="true" />
                              Complete your bank transfer
                            </p>
                            <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                              <BankRow k="Bank" v={settings.bank.name} />
                              <BankRow k="Account name" v={settings.bank.accountName} />
                              <BankRow k="Account number" v={settings.bank.accountNumber} />
                            </dl>
                            <p className="mt-3 rounded-lg bg-white px-3 py-2">
                              Amount to pay: <b className="text-crimson-700">{formatNaira(o.amountKobo)}</b> ·
                              Reference: <code className="font-bold">{o.reference}</code>
                            </p>
                          </div>
                          <div>
                            <p className="mb-2 text-sm font-bold text-navy-800">Upload proof of payment</p>
                            <ReceiptUploader orderId={o.id} expectedKobo={o.amountKobo} />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                          <p className="flex items-center gap-2 font-bold text-amber-900">
                            <Clock className="h-5 w-5 shrink-0" aria-hidden="true" />
                            {p.status === "UNDER_REVIEW"
                              ? "Payment is currently under review"
                              : "Waiting for your receipt"}
                          </p>
                          <p className="mt-1 text-amber-800">
                            A LADIRE administrator will verify your bank transfer. Votes are counted
                            only after approval.
                          </p>
                          {p.status === "UNDER_REVIEW" && p.receipts.length > 0 ? (
                            <details className="mt-3">
                              <summary className="cursor-pointer font-bold text-amber-900">
                                Upload a corrected receipt (optional)
                              </summary>
                              <div className="mt-3">
                                <ReceiptUploader orderId={o.id} expectedKobo={o.amountKobo} />
                              </div>
                            </details>
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Meta / receipts / WA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 pt-4 text-xs text-navy-500">
                    <div className="flex flex-wrap items-center gap-4">
                      <span>Expected: <b className="text-navy-800">{formatNaira(o.amountKobo)}</b></span>
                      {p?.amountPaidKobo != null ? (
                        <span>Submitted: <b className="text-navy-800">{formatNaira(p.amountPaidKobo)}</b></span>
                      ) : null}
                      {p?.bankName ? <span>Bank: <b className="text-navy-800">{p.bankName}</b></span> : null}
                      {p?.transactionDate ? <span>{fmtDate(p.transactionDate)}</span> : null}
                    </div>
                    {settings.whatsapp && p && p.status !== "APPROVED" ? (
                      <WhatsAppChatLink
                        number={settings.whatsapp}
                        text={waText(o)}
                        className="font-bold text-[#128C7E] hover:underline"
                      >
                        Confirm on WhatsApp →
                      </WhatsAppChatLink>
                    ) : null}
                  </div>

                  {/* Receipts list */}
                  {p && p.receipts.length > 0 ? (
                    <div className="rounded-xl border border-navy-100 p-3">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-navy-500">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Submitted proofs ({p.receipts.length})
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {p.receipts.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                            <span className="truncate text-navy-700">
                              {r.originalName || r.storageKey}
                              <span className="ml-2 text-xs text-navy-400">{timeAgoLabel(r.createdAt)}</span>
                            </span>
                            <a
                              href={`/files/${encodeURIComponent(r.storageKey)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 font-bold text-crimson-600 hover:underline"
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BankRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-navy-400">{k}</dt>
      <dd className="font-semibold text-navy-900">{v || "—"}</dd>
    </div>
  );
}

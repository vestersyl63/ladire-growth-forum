"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import {
  X,
  Minus,
  Plus,
  Vote,
  CheckCircle2,
  AlertCircle,
  Building2,
  Hash,
  CalendarDays,
  ArrowRight,
  ArrowLeft,
  Loader2,
  UserPlus,
  LogIn,
  Copy,
} from "lucide-react";

import { cn, formatNaira } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/brand/icons";
import { startVoteOrder, submitReceipt, type VoteActionResult } from "@/app/actions/vote-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export type WizardNominee = {
  id: string;
  name: string;
  stageName: string | null;
  bio: string | null;
  imageUrl: string | null;
  officialVotes: number;
  categoryId: string;
};

export type WizardCategory = {
  id: string;
  name: string;
  open: boolean;
  reason?: string;
  pricePerVoteKobo: number | null;
  minVotes: number;
  maxVotes: number;
  count?: number;
};

export type WizardBank = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions: string;
  whatsapp: string;
};

function makeWaMessage(whatsapp: string, order: { reference: string; nominee: string; category: string; quantity: number; amountKobo: number }) {
  const lines = [
    "LADIRE AWARDS 2026",
    `Payment Reference: ${order.reference}`,
    `Nominee: ${order.nominee}`,
    `Category: ${order.category}`,
    `Number of Votes: ${order.quantity}`,
    `Amount: ${formatNaira(order.amountKobo)}`,
    "",
    "Kindly confirm this payment. Receipt attached below.",
  ];
  const clean = whatsapp.replace(/[^0-9]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(lines.join("\n"))}`;
}

// ---------------------------------------------------------------
// Nominee card
// ---------------------------------------------------------------

export function NomineeVoteCard({
  nominee,
  category,
  showCounts,
  signedIn,
  onVote,
}: {
  nominee: WizardNominee;
  category: WizardCategory;
  showCounts: boolean;
  signedIn: boolean;
  onVote: () => void;
}) {
  const displayName = nominee.stageName || nominee.name;
  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <div className="relative h-40 w-full bg-navy-100">
        {nominee.imageUrl ? (
          <Image
            src={nominee.imageUrl}
            alt={`${displayName} — nominee, ${category.name}`}
            fill
            sizes="(max-width: 640px) 100vw, 280px"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 via-navy-900 to-crimson-950">
            <span className="font-display text-6xl font-extrabold text-white/25">
              {(displayName || "N").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="chip absolute left-3 top-3 bg-white/95 text-navy-800">
          {category.name}
        </span>
        {showCounts && !category.open && nominee.officialVotes > 0 ? null : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-extrabold leading-tight text-navy-950">
          {displayName}
        </h3>
        {nominee.bio ? (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-navy-600">
            {nominee.bio}
          </p>
        ) : (
          <p className="mt-1.5 text-sm italic text-navy-400">Biography coming soon.</p>
        )}

        <div className="mt-auto pt-4">
          {category.open ? (
            showCounts ? (
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-navy-400">
                {nominee.officialVotes.toLocaleString()} verified vote
                {nominee.officialVotes === 1 ? "" : "s"}
              </p>
            ) : null
          ) : null}
          {category.open ? (
            <button
              type="button"
              onClick={onVote}
              disabled={!signedIn}
              className="btn btn-primary btn-md w-full disabled:cursor-not-allowed"
            >
              <Vote className="h-4 w-4" aria-hidden="true" />
              {signedIn ? "Vote for this nominee" : "Sign in to vote"}
            </button>
          ) : (
            <p
              role="status"
              className="rounded-lg bg-navy-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-navy-500"
            >
              {category.reason ?? "Voting closed"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------
// Modal
// ---------------------------------------------------------------

type Step = "qty" | "order" | "pay" | "upload" | "done";

export function VoteModal({
  nominee,
  category,
  bank,
  onClose,
}: {
  nominee: WizardNominee;
  category: WizardCategory;
  bank: WizardBank;
  onClose: () => void;
}) {
  const price = category.pricePerVoteKobo ?? 0;
  const [qty, setQty] = useState(Math.min(Math.max(1, category.minVotes), 10));
  const [customQty, setCustomQty] = useState<string>("");
  const [step, setStep] = useState<Step>("qty");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<{
    orderId: string;
    reference: string;
    amountKobo: number;
    quantity: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const total = price * qty;
  const displayName = nominee.stageName || nominee.name;

  const setQ = (n: number) => {
    const v = Math.min(Math.max(n, category.minVotes), category.maxVotes);
    setQty(v);
    setCustomQty("");
  };

  async function createOrder() {
    setError(null);
    setStep("order");
    const fd = new FormData();
    fd.set("nomineeId", nominee.id);
    fd.set("quantity", String(qty));
    const res: VoteActionResult = await startVoteOrder(null, fd);
    if (!res.ok) {
      setError(res.error || "Could not create your vote order.");
      setStep("qty");
      return;
    }
    setOrder({
      orderId: res.orderId!,
      reference: res.reference ?? "",
      amountKobo: res.amountKobo ?? total,
      quantity: res.quantity ?? qty,
    });
    setStep("pay");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Vote for ${displayName}`}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl animate-pop sm:rounded-3xl">
        {/* header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-navy-100 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-crimson-600">
              Vote · {category.name}
            </p>
            <h2 className="truncate font-display text-lg font-extrabold text-navy-950">{displayName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close voting dialog"
            className="icon-btn shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}

          {/* STEP: quantity */}
          {step === "qty" && (
            <div className="animate-fade-in">
              <p className="text-sm font-semibold text-navy-800">How many votes would you like to buy?</p>
              <p className="mt-1 text-xs text-navy-500">
                {formatNaira(price)} per vote · min {category.minVotes} · max {category.maxVotes}
              </p>

              <div className="mt-4 grid grid-cols-4 gap-2">
                {[1, 5, 10, 50]
                  .filter((n) => n >= category.minVotes && n <= category.maxVotes)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQ(n)}
                      aria-pressed={qty === n && customQty === ""}
                      className={cn(
                        "rounded-xl border-2 py-3 font-display text-lg font-extrabold transition-colors",
                        qty === n && customQty === ""
                          ? "border-crimson-600 bg-crimson-600 text-white"
                          : "border-navy-200 text-navy-800 hover:border-crimson-400"
                      )}
                    >
                      {n}
                    </button>
                  ))}
              </div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="icon-btn border border-navy-200"
                  aria-label="Decrease votes"
                  onClick={() => setQ(Math.max(category.minVotes, qty - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  aria-label="Number of votes"
                  inputMode="numeric"
                  className="field w-24 text-center font-display text-lg font-extrabold"
                  value={customQty === "" ? qty : customQty}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    setCustomQty(v);
                    const n = Number(v);
                    if (n >= 1) setQty(Math.min(Math.max(n, category.minVotes), category.maxVotes));
                  }}
                />
                <button
                  type="button"
                  className="icon-btn border border-navy-200"
                  aria-label="Increase votes"
                  onClick={() => setQ(Math.min(category.maxVotes, qty + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-navy-950 px-5 py-4 text-white">
                <span className="text-sm font-semibold text-white/70">Total to pay</span>
                <span className="font-display text-2xl font-extrabold text-gold-300">
                  {formatNaira(total)}
                </span>
              </div>

              <button type="button" onClick={createOrder} className="btn btn-primary btn-lg mt-4 w-full">
                Continue to payment <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-3 text-center text-xs text-navy-500">
                Votes are only counted after your payment is verified and approved.
              </p>
            </div>
          )}

          {/* STEP: order loading */}
          {step === "order" && (
            <div className="flex flex-col items-center py-10 text-center animate-fade-in">
              <Loader2 className="h-8 w-8 animate-spin text-crimson-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-navy-800">Preparing your payment details…</p>
            </div>
          )}

          {/* STEP: bank transfer instructions */}
          {step === "pay" && order && (
            <div className="animate-fade-in">
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-bold text-emerald-900">Your payment reference is ready</p>
                  <p className="mt-0.5 text-sm text-emerald-800">
                    Transfer <strong>{formatNaira(order.amountKobo)}</strong> for{" "}
                    <strong>{order.quantity}</strong> vote{order.quantity === 1 ? "" : "s"} and use the
                    reference below in your narration if possible.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border-2 border-dashed border-crimson-300 bg-crimson-50/60 p-3.5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-navy-500">
                    Your payment reference
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <code className="font-display text-lg font-extrabold tracking-wide text-crimson-700">
                      {order.reference || "…"}
                    </code>
                    <button
                      type="button"
                      aria-label="Copy reference"
                      className="icon-btn h-8 w-8"
                      onClick={() => {
                        navigator.clipboard?.writeText(order.reference).catch(() => undefined);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1600);
                      }}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-navy-100 bg-navy-50/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-navy-500">
                    <Building2 className="h-4 w-4 text-crimson-600" aria-hidden="true" /> Pay to this account
                  </p>
                  <dl className="mt-3 space-y-2.5 text-sm">
                    <Row k="Bank" v={bank.bankName} />
                    <Row k="Account name" v={bank.accountName} />
                    <Row k="Account number" v={<b className="tracking-widest">{bank.accountNumber}</b>} />
                    <Row k="Amount" v={<b className="text-crimson-700">{formatNaira(order.amountKobo)}</b>} />
                  </dl>
                </div>

                <p className="rounded-xl border border-navy-100 p-3 text-xs leading-relaxed text-navy-600">
                  {bank.instructions}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep("upload")}
                className="btn btn-navy btn-lg mt-5 w-full"
              >
                I’ve made the transfer — upload receipt <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setStep("qty")}
                className="btn btn-ghost btn-md mt-2 w-full"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Change number of votes
              </button>
            </div>
          )}

          {/* STEP: upload receipt */}
          {step === "upload" && order && (
            <ReceiptForm
              orderId={order.orderId}
              expectedKobo={order.amountKobo}
              onDone={() => setStep("done")}
            />
          )}

          {/* STEP: done */}
          {step === "done" && order && (
            <div className="py-2 text-center animate-fade-in">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
              <h3 className="mt-3 font-display text-xl font-extrabold text-navy-950">
                Payment submitted successfully
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-navy-600">
                Your votes will be counted after a LADIRE administrator verifies your payment.
                Reference: <strong>{order.reference}</strong>
              </p>

              <a
                href={makeWaMessage(bank.whatsapp, {
                  reference: order.reference,
                  nominee: displayName,
                  category: category.name,
                  quantity: order.quantity,
                  amountKobo: order.amountKobo,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-lg mt-5 w-full"
              >
                <WhatsAppIcon className="h-5 w-5" aria-hidden="true" />
                Send payment confirmation via WhatsApp
              </a>
              <Link href="/dashboard/votes" className="btn btn-ghost btn-md mt-2 w-full">
                Track it in my dashboard
              </Link>
              <p className="mt-3 text-xs text-navy-500">
                WhatsApp is optional — payments are verified by LADIRE administrators regardless.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-navy-500">{k}</dt>
      <dd className="text-right font-semibold text-navy-900">{v}</dd>
    </div>
  );
}

function ReceiptForm({
  orderId,
  expectedKobo,
  onDone,
}: {
  orderId: string;
  expectedKobo: number;
  onDone: () => void;
}) {
  const action = submitReceipt.bind(null, orderId);
  const [state, formAction] = useActionState<VoteActionResult | null, FormData>(action, null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSizeOk, setFileSizeOk] = useState(true);

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="animate-fade-in space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-navy-200 bg-navy-50 p-4">
        <Hash className="mt-0.5 h-5 w-5 shrink-0 text-crimson-600" aria-hidden="true" />
        <p className="text-sm font-semibold text-navy-800">
          Upload your proof of payment (receipt/screenshot/PDF). Your payment will not be counted
          until a LADIRE administrator approves it.
        </p>
      </div>

      {/* File upload */}
      <label
        htmlFor={`receipt-${orderId}`}
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-300 bg-white px-4 py-8 text-center transition-colors hover:border-crimson-400 hover:bg-crimson-50/30"
      >
        <input
          id={`receipt-${orderId}`}
          name="receipt"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setFileName(f.name);
            setFileSizeOk(f.size <= 8 * 1024 * 1024);
          }}
        />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-crimson-100 text-crimson-600">
          <Vote className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-3 text-sm font-bold text-navy-900">
          {fileName || "Tap to upload your receipt"}
        </p>
        <p className="mt-1 text-xs text-navy-500">JPG, PNG, WEBP, GIF or PDF · max 8 MB</p>
        {fileName && !fileSizeOk ? (
          <p className="mt-2 text-xs font-bold text-crimson-600">File is too large (max 8 MB).</p>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`amt-${orderId}`} className="lbl">Amount paid (₦) *</label>
          <input
            id={`amt-${orderId}`}
            name="amountPaid"
            type="number"
            step="0.01"
            min={1}
            required
            className="field"
            defaultValue={expectedKobo / 100}
          />
          <p className="hint">Expected: {formatNaira(expectedKobo)}</p>
        </div>
        <div>
          <label htmlFor={`bank-${orderId}`} className="lbl">Bank you used *</label>
          <input id={`bank-${orderId}`} name="bankName" required className="field" placeholder="e.g. Zenith Bank" />
        </div>
        <div>
          <label htmlFor={`date-${orderId}`} className="lbl">Transfer date *</label>
          <input id={`date-${orderId}`} name="transactionDate" type="date" required className="field" defaultValue={today} />
        </div>
      </div>
      <div>
        <label htmlFor={`note-${orderId}`} className="lbl">Note (optional)</label>
        <textarea id={`note-${orderId}`} name="note" rows={2} className="field" placeholder="Anything the verifier should know?" />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      ) : null}

      <SubmitButton className="btn-navy w-full">Submit payment details</SubmitButton>
    </form>
  );
}

// Login prompt card shown on the vote page when signed out
export function LoginPrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Sign in required">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl animate-pop sm:rounded-3xl">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-crimson-100 text-crimson-600">
            <UserPlus className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-xl font-extrabold text-navy-950">Create a free account to vote</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-600">
            You need an account so your votes can be tracked and your payments verified. It takes less than a minute.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Link href="/register?next=/vote" className="btn btn-primary btn-lg w-full">
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Create free account
            </Link>
            <Link href="/login?next=/vote" className="btn btn-outline btn-lg w-full">
              <LogIn className="h-4 w-4" aria-hidden="true" /> I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: Array<{ id: string; name: string; count: number }>;
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Award categories">
      <button
        type="button"
        role="tab"
        aria-selected={active === null}
        onClick={() => onChange(null)}
        className={cn(
          "chip border px-4 py-2 text-sm font-bold",
          active === null ? "border-navy-900 bg-navy-900 text-white" : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
        )}
      >
        All categories
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(active === cat.id ? null : cat.id)}
          className={cn(
            "chip border px-4 py-2 text-sm font-bold",
            active === cat.id
              ? "border-crimson-600 bg-crimson-600 text-white"
              : "border-navy-200 bg-white text-navy-700 hover:border-crimson-300"
          )}
        >
          {cat.name}
          <span className={cn("ml-1", active === cat.id ? "text-white/70" : "text-navy-400")}>{cat.count}</span>
        </button>
      ))}
    </div>
  );
}

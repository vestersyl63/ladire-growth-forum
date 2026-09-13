"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";
import { submitReceipt, type VoteActionResult } from "@/app/actions/vote-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function ReceiptUploader({
  orderId,
  expectedKobo,
  onSubmitted,
  compact = false,
}: {
  orderId: string;
  expectedKobo: number;
  onSubmitted?: (ok: boolean, message?: string) => void;
  compact?: boolean;
}) {
  const action = submitReceipt.bind(null, orderId);
  const [state, formAction] = useActionState<VoteActionResult | null, FormData>(action, null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state && onSubmitted) onSubmitted(state.ok, state.message);
  }, [state, onSubmitted]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className={cn("space-y-3", compact && "text-sm")}>
      <label
        htmlFor={`du-${orderId}`}
        className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-navy-300 px-4 py-3 hover:border-crimson-400 hover:bg-crimson-50/20"
      >
        <UploadCloud className="h-6 w-6 shrink-0 text-crimson-600" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-sm font-bold text-navy-900">
            {fileName || "Upload proof of payment"}
          </span>
          <span className="block text-xs text-navy-500">JPG, PNG, WEBP, GIF or PDF · max 8 MB</span>
        </span>
        <input
          ref={inputRef}
          id={`du-${orderId}`}
          name="receipt"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`da-${orderId}`} className="lbl">Amount paid (₦) *</label>
          <input
            id={`da-${orderId}`}
            name="amountPaid"
            type="number"
            step="0.01"
            min={1}
            required
            defaultValue={expectedKobo / 100}
            className="field"
          />
          <p className="hint">Expected: {formatNaira(expectedKobo)}</p>
        </div>
        <div>
          <label htmlFor={`db-${orderId}`} className="lbl">Bank used *</label>
          <input id={`db-${orderId}`} name="bankName" required className="field" placeholder="e.g. Zenith Bank" />
        </div>
        <div>
          <label htmlFor={`dd-${orderId}`} className="lbl">Transfer date *</label>
          <input id={`dd-${orderId}`} name="transactionDate" type="date" required defaultValue={today} className="field" />
        </div>
        <div>
          <label htmlFor={`dn-${orderId}`} className="lbl">Note (optional)</label>
          <input id={`dn-${orderId}`} name="note" className="field" placeholder="Anything the verifier should know?" />
        </div>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-2.5 text-sm font-medium text-crimson-900">
          {state.error}
        </p>
      ) : null}
      {state && state.ok ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-900">
          {state.message}
        </p>
      ) : null}

      <SubmitButton type="navy" pendingText="Uploading…">
        Submit payment details
      </SubmitButton>
    </form>
  );
}

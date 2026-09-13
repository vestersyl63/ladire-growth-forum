"use client";

import { useActionState } from "react";
import { addPaymentNote, type AdminActionResult } from "@/app/actions/admin-operations-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function NoteForm({ paymentId }: { paymentId: string }) {
  const action = addPaymentNote.bind(null, paymentId);
  const [state, formAction] = useActionState<AdminActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor={`note-${paymentId}`} className="lbl">Add internal note</label>
      <textarea
        id={`note-${paymentId}`}
        name="body"
        rows={2}
        className="field"
        placeholder='e.g. "Transfer confirmed on bank statement."'
      />
      {state && !state.ok ? (
        <p role="alert" className="text-sm font-medium text-crimson-700">{state.error}</p>
      ) : null}
      <SubmitButton type="navy" className="btn-sm">Add note</SubmitButton>
    </form>
  );
}

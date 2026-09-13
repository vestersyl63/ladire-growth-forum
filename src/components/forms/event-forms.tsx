"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  registerForEvent,
  bookEventOption,
  bookVacationProgramme,
  type FormResult,
} from "@/app/actions/content-actions";

export function ResultBox({ state, successMessage }: { state: FormResult | null; successMessage?: string }) {
  if (!state) return null;
  if (state.ok) {
    return (
      <p
        role="status"
        className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-900"
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>{state.message || successMessage || "Done!"}</span>
      </p>
    );
  }
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
      <span>{state.error || "Something went wrong."}</span>
    </p>
  );
}

export function SignInHint() {
  return (
    <p className="flex items-center gap-2 rounded-xl border border-navy-200 bg-navy-50 px-3.5 py-3 text-sm text-navy-700">
      <Info className="h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
      <span>
        Already a member? <Link href="/login" className="font-bold text-crimson-600 underline">Sign in</Link> to
        register faster, or{" "}
        <Link href="/register" className="font-bold text-crimson-600 underline">create a free account</Link> first.
      </span>
    </p>
  );
}

// ---------------- Event registration ----------------

export function EventRegisterForm({ eventId, prefill }: { eventId: string; prefill?: { name?: string; email?: string; phone?: string } }) {
  const action = registerForEvent.bind(null, eventId);
  const [state, formAction] = useActionState<FormResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <SignInHint />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`er-name-${eventId}`} className="lbl">Full name *</label>
          <input id={`er-name-${eventId}`} name="name" required className="field" placeholder="Your full name" defaultValue={prefill?.name} />
        </div>
        <div>
          <label htmlFor={`er-email-${eventId}`} className="lbl">Email *</label>
          <input id={`er-email-${eventId}`} name="email" type="email" className="field" placeholder="you@example.com" defaultValue={prefill?.email} />
        </div>
        <div>
          <label htmlFor={`er-phone-${eventId}`} className="lbl">Phone</label>
          <input id={`er-phone-${eventId}`} name="phone" className="field" placeholder="0700 000 0000" defaultValue={prefill?.phone} />
        </div>
        <div>
          <label htmlFor={`er-qty-${eventId}`} className="lbl">Number of people</label>
          <input id={`er-qty-${eventId}`} name="quantity" type="number" min={1} max={20} defaultValue={1} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor={`er-notes-${eventId}`} className="lbl">Notes (optional)</label>
        <textarea id={`er-notes-${eventId}`} name="notes" rows={2} className="field" placeholder="Anything we should know?" />
      </div>
      <ResultBox state={state} />
      <SubmitButton>Register my place</SubmitButton>
    </form>
  );
}

// ---------------- Event booking (table / seat / package) ----------------

export type BookOption = {
  id: string;
  title: string;
  type: string;
  priceInKobo: number | null;
  capacity: number | null;
};

export function EventBookForm({
  eventId,
  options,
  prefill,
}: {
  eventId: string;
  options: BookOption[];
  prefill?: { name?: string; email?: string; phone?: string };
}) {
  const action = bookEventOption.bind(null, eventId);
  const [state, formAction] = useActionState<FormResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <SignInHint />
      <div>
        <span className="lbl">Choose an option *</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-200 p-3.5 transition-colors has-[:checked]:border-crimson-500 has-[:checked]:bg-crimson-50/50"
            >
              <input type="radio" name="optionId" value={o.id} required className="mt-1 h-4 w-4 accent-crimson-600" />
              <span>
                <span className="block font-semibold text-navy-950">{o.title}</span>
                <span className="block text-xs text-navy-500">
                  {o.priceInKobo == null || o.priceInKobo === 0 ? "Free" : `₦${(o.priceInKobo / 100).toLocaleString("en-NG")}`}
                  {o.capacity != null ? ` • ${o.capacity} available` : ""}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`eb-name-${eventId}`} className="lbl">Your name *</label>
          <input id={`eb-name-${eventId}`} name="name" required className="field" defaultValue={prefill?.name} />
        </div>
        <div>
          <label htmlFor={`eb-phone-${eventId}`} className="lbl">Phone *</label>
          <input id={`eb-phone-${eventId}`} name="phone" required className="field" placeholder="0700 000 0000" defaultValue={prefill?.phone} />
        </div>
        <div>
          <label htmlFor={`eb-email-${eventId}`} className="lbl">Email</label>
          <input id={`eb-email-${eventId}`} name="email" type="email" className="field" defaultValue={prefill?.email} />
        </div>
        <div>
          <label htmlFor={`eb-qty-${eventId}`} className="lbl">Quantity *</label>
          <input id={`eb-qty-${eventId}`} name="quantity" type="number" min={1} max={50} defaultValue={1} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor={`eb-notes-${eventId}`} className="lbl">Notes (optional)</label>
        <textarea id={`eb-notes-${eventId}`} name="notes" rows={2} className="field" />
      </div>
      <ResultBox state={state} />
      <SubmitButton>Submit booking</SubmitButton>
    </form>
  );
}

// ---------------- Vacation programme booking ----------------

export function VacationBookForm({
  programmeId,
  prefill,
}: {
  programmeId: string;
  prefill?: { name?: string; email?: string; phone?: string };
}) {
  const action = bookVacationProgramme.bind(null, programmeId);
  const [state, formAction] = useActionState<FormResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <SignInHint />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`vb-pname`} className="lbl">Participant full name *</label>
          <input id="vb-pname" name="participantName" required className="field" placeholder="Child / young person’s name" />
        </div>
        <div>
          <label htmlFor="vb-age" className="lbl">Participant age</label>
          <input id="vb-age" name="participantAge" className="field" placeholder="e.g. 12" />
        </div>
        <div>
          <label htmlFor="vb-parent" className="lbl">Parent / guardian name *</label>
          <input id="vb-parent" name="parentName" required className="field" defaultValue={prefill?.name} />
        </div>
        <div>
          <label htmlFor="vb-pphone" className="lbl">Parent phone *</label>
          <input id="vb-pphone" name="parentPhone" required className="field" placeholder="0700 000 0000" defaultValue={prefill?.phone} />
        </div>
        <div>
          <label htmlFor="vb-pemail" className="lbl">Parent email</label>
          <input id="vb-pemail" name="parentEmail" type="email" className="field" defaultValue={prefill?.email} />
        </div>
        <div>
          <label htmlFor="vb-qty" className="lbl">Number of places *</label>
          <input id="vb-qty" name="quantity" type="number" min={1} max={20} defaultValue={1} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor="vb-notes" className="lbl">Notes (optional)</label>
        <textarea id="vb-notes" name="notes" rows={2} className="field" placeholder="Allergies, needs or anything we should know?" />
      </div>
      <ResultBox state={state} />
      <SubmitButton className={cn("btn-olive")}>Reserve a place</SubmitButton>
    </form>
  );
}

// Re-export hook for loading states if needed elsewhere.
export { useFormStatus };

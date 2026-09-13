"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  updateProfile,
  changePassword,
  type UserActionResult,
} from "@/app/actions/user-actions";

function Result({ state }: { state: UserActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
      <span>{state.message}</span>
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
      <span>{state.error}</span>
    </p>
  );
}

export function ProfileForm({
  initial,
}: {
  initial: { name: string | null; email: string | null; phone: string | null };
}) {
  const [state, formAction] = useActionState<UserActionResult | null, FormData>(updateProfile, null);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="pf-name" className="lbl">Full name</label>
        <input id="pf-name" name="name" required minLength={2} className="field" defaultValue={initial.name ?? ""} />
      </div>
      <div>
        <label htmlFor="pf-email" className="lbl">Email</label>
        <input id="pf-email" name="email" type="email" className="field" defaultValue={initial.email ?? ""} placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="pf-phone" className="lbl">Phone (sign-in ID)</label>
        <input id="pf-phone" disabled className="field bg-navy-50 text-navy-500" defaultValue={initial.phone ?? ""} />
        <p className="hint">Your phone is your sign-in ID and cannot be changed here — contact support if needed.</p>
      </div>
      <Result state={state} />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<UserActionResult | null, FormData>(changePassword, null);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="cp-current" className="lbl">Current password</label>
        <input id="cp-current" name="currentPassword" type="password" required autoComplete="current-password" className="field" />
      </div>
      <div>
        <label htmlFor="cp-new" className="lbl">New password</label>
        <input id="cp-new" name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <p className="hint">At least 8 characters.</p>
      </div>
      <Result state={state} />
      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}

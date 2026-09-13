"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { registerUser, type ActionResult } from "@/app/actions/auth-actions";

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(registerUser, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center animate-pop">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
        <h2 className="mt-3 font-display text-lg font-extrabold text-emerald-900">
          Your account is ready! 🎉
        </h2>
        <p className="mt-1 text-sm text-emerald-800">
          Welcome to LADIRE Growth Forum. Sign in to continue to your dashboard.
        </p>
        <Link href={`/login?registered=1&next=${encodeURIComponent(next)}`} className="btn btn-primary btn-md mt-4 w-full">
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="reg-name" className="lbl">Full name *</label>
        <input id="reg-name" name="fullName" required minLength={2} className="field" placeholder="e.g. Ada Obi" autoComplete="name" />
      </div>
      <div>
        <label htmlFor="reg-phone" className="lbl">Phone number *</label>
        <input id="reg-phone" name="phone" required className="field" placeholder="e.g. 0706 342 0621" inputMode="tel" autoComplete="tel" />
        <p className="hint">We do not send OTPs — you’ll set a password below.</p>
      </div>
      <div>
        <label htmlFor="reg-email" className="lbl">Email (optional)</label>
        <input id="reg-email" name="email" type="email" className="field" placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label htmlFor="reg-pass" className="lbl">Password *</label>
        <input
          id="reg-pass"
          name="password"
          type="password"
          required
          minLength={8}
          className="field"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </div>

      {state && !state.ok ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary btn-lg w-full disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating account…
          </>
        ) : (
          "Create my free account"
        )}
      </button>
      <p className="text-center text-xs text-navy-500">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold underline">terms of use</Link> and{" "}
        <Link href="/privacy" className="font-semibold underline">privacy policy</Link>.
      </p>
    </form>
  );
}

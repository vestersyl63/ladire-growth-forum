"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginUser, continueWithGoogle, type ActionResult } from "@/app/actions/auth-actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ next, hasGoogle }: { next: string; hasGoogle: boolean }) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginUser, null);

  return (
    <div className="space-y-5">
      {hasGoogle ? (
        <>
          <form action={async () => { await continueWithGoogle(); }}>
            <button type="submit" className="btn btn-google btn-md w-full">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.4H12v4.6h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.8-3.8H1.2v3.1A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.2a12 12 0 0 0 0 10.8l4.1-3.1Z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8L20 3.2A12 12 0 0 0 1.2 6.6l4.1 3.1A7.2 7.2 0 0 1 12 4.8Z" />
              </svg>
              Continue with Google
            </button>
          </form>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-navy-300">
            <span className="h-px flex-1 bg-navy-100" /> or <span className="h-px flex-1 bg-navy-100" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="login-id" className="lbl">Phone number or email</label>
          <input
            id="login-id"
            name="identifier"
            required
            autoComplete="username"
            className="field"
            placeholder="e.g. 0700 000 0000 or you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-pass" className="lbl">Password</label>
          <input
            id="login-pass"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="field"
          />
        </div>

        {state && !state.ok ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{state.error}</span>
          </p>
        ) : null}

        <SubmitButton className="w-full">Sign in</SubmitButton>
      </form>

      <p className="text-center text-xs text-navy-400">
        Forgot your password? Contact{" "}
        <Link href="/contact" className="font-semibold text-crimson-600">LADIRE support</Link> to recover
        your account.
      </p>
    </div>
  );
}

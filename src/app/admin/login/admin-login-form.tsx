"use client";

import { useActionState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { adminLogin, type AdminActionResult } from "@/app/actions/admin-actions";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(adminLogin, null);
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="adm-email" className="lbl">Admin email</label>
        <input id="adm-email" name="email" type="email" required autoComplete="username" className="field" placeholder="admin@ladire.example" />
      </div>
      <div>
        <label htmlFor="adm-pass" className="lbl">Password</label>
        <input id="adm-pass" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state && !state.ok ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-crimson-200 bg-crimson-50 px-3.5 py-3 text-sm font-medium text-crimson-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-navy btn-md w-full disabled:opacity-60">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
          </>
        ) : (
          "Sign in to admin"
        )}
      </button>
    </form>
  );
}

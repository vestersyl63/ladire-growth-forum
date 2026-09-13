"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import type { AdminActionResult } from "@/app/actions/admin-people-actions";
import { createAdminUser } from "@/app/actions/admin-people-actions";

export function AdminCreateForm() {
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(createAdminUser, null);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ad-name" className="lbl">Full name *</label>
          <input id="ad-name" name="name" required className="field" placeholder="e.g. Ada Obi" />
        </div>
        <div>
          <label htmlFor="ad-email" className="lbl">Email *</label>
          <input id="ad-email" name="email" type="email" required className="field" placeholder="admin@ladire.org" />
        </div>
        <div>
          <label htmlFor="ad-phone" className="lbl">Phone</label>
          <input id="ad-phone" name="phone" className="field" placeholder="+234…" />
        </div>
        <div>
          <label htmlFor="ad-role" className="lbl">Role *</label>
          <select id="ad-role" name="role" defaultValue="ADMIN" className="field">
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
            <option value="PAYMENT_VERIFIER">Payment verifier</option>
            <option value="CONTENT_MANAGER">Content manager</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="ad-pass" className="lbl">Temporary password * (min 8 characters)</label>
          <input id="ad-pass" name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </div>
      </div>
      {state && !state.ok ? (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-crimson-200 bg-crimson-50 px-3 py-2 text-sm font-medium text-crimson-800">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {state.message}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary btn-md">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UserPlus className="h-4 w-4" aria-hidden="true" />}
        Create admin
      </button>
    </form>
  );
}

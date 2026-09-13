"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { AdminActionResult } from "@/app/actions/admin-content-actions";
import { createAwardProgramme } from "@/app/actions/admin-content-actions";

export function AwardCreateForm() {
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(createAwardProgramme, null);

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-navy-200 bg-navy-50/50 p-4">
      <p className="text-sm font-bold text-navy-900">Create a new awards programme</p>
      <input name="title" required minLength={3} placeholder="Programme title, e.g. LADIRE Awards 2027" className="field" />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <input name="tagline" placeholder="Tagline (optional)" className="field" />
        <button type="submit" disabled={pending} className="btn btn-navy btn-md">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Create"}
        </button>
      </div>
      <input name="description" placeholder="Short description (optional)" className="field" />
      {state && !state.ok ? (
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-crimson-700">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {state.message}
        </p>
      ) : null}
    </form>
  );
}

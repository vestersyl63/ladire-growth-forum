"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { AdminActionResult } from "@/app/actions/admin-content-actions";
import { addBookingOption } from "@/app/actions/admin-content-actions";

export function BookingOptionForm({ eventId }: { eventId: string }) {
  const action = addBookingOption.bind(null, eventId);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border border-navy-200 bg-navy-50/50 p-4 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
      <div>
        <label htmlFor="bo-title" className="lbl">Option title</label>
        <input id="bo-title" name="title" required className="field" placeholder="VIP table of 5" />
      </div>
      <div>
        <label htmlFor="bo-type" className="lbl">Type</label>
        <select id="bo-type" name="type" className="field">
          <option value="SEAT">Seat</option>
          <option value="TABLE">Table</option>
          <option value="GENERAL">General</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>
      <div>
        <label htmlFor="bo-cap" className="lbl">Capacity</label>
        <input id="bo-cap" name="capacity" type="number" min={1} className="field" />
      </div>
      <div>
        <label htmlFor="bo-price" className="lbl">Price (₦)</label>
        <input id="bo-price" name="price" type="number" min={0} step="0.01" defaultValue={0} className="field" />
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn btn-navy btn-md">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Add option"}
        </button>
      </div>
      {state && !state.ok ? (
        <p role="alert" className="flex items-center gap-2 text-sm font-medium text-crimson-700 sm:col-span-5">
          <AlertCircle className="h-4 w-4" aria-hidden="true" /> {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-emerald-700 sm:col-span-5">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {state.message ?? "Option added."}
        </p>
      ) : null}
    </form>
  );
}

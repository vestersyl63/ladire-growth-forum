"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import type { AdminActionResult } from "@/app/actions/admin-operations-actions";
import { saveSettings, resetSetting } from "@/app/actions/admin-operations-actions";

export type SettingDefView = {
  key: string;
  type: "STRING" | "TEXT" | "NUMBER" | "BOOLEAN" | "JSON";
  label: string;
  description?: string;
  defaultValue: string;
};

export function SettingsGroupForm({
  group,
  defs,
  values,
}: {
  group: string;
  defs: SettingDefView[];
  values: Record<string, string>;
}) {
  const action = saveSettings.bind(null, group);
  const [state, formAction, pending] = useActionState<AdminActionResult | null, FormData>(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4">
        {defs.map((d) => {
          const fieldKey = `s.${d.key}`;
          const current = values[d.key] ?? d.defaultValue;
          return (
            <div key={d.key}>
              <div className="flex items-start justify-between gap-3">
                <label htmlFor={fieldKey} className="text-sm font-bold text-navy-800">{d.label}</label>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await resetSetting(d.key);
                    if (res.ok) window.location.reload();
                  }}
                  title="Reset to default"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-navy-400 hover:text-crimson-600"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" /> default
                </button>
              </div>
              {d.description ? <p className="mt-0.5 text-xs text-navy-400">{d.description}</p> : null}

              {d.type === "BOOLEAN" ? (
                <label className="mt-1.5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
                  <input
                    type="checkbox"
                    name={fieldKey}
                    defaultChecked={["1", "true", "yes", "on"].includes(current.toLowerCase())}
                    className="h-4 w-4 accent-crimson-600"
                  />
                  Enabled
                </label>
              ) : d.type === "TEXT" || d.type === "JSON" ? (
                <textarea
                  id={fieldKey}
                  name={fieldKey}
                  rows={d.type === "TEXT" ? 4 : 5}
                  defaultValue={current}
                  spellCheck={d.type === "TEXT"}
                  className="field mt-1.5 font-mono text-xs"
                />
              ) : (
                <input
                  id={fieldKey}
                  name={fieldKey}
                  type={d.type === "NUMBER" ? "text" : "text"}
                  inputMode={d.type === "NUMBER" ? "numeric" : undefined}
                  defaultValue={current}
                  className="field mt-1.5"
                />
              )}
            </div>
          );
        })}
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

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="btn btn-primary btn-md">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save {group} settings
        </button>
      </div>
    </form>
  );
}

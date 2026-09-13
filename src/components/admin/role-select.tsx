"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { AdminRole } from "@prisma/client";

import { updateAdminRole } from "@/app/actions/admin-people-actions";

const LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  PAYMENT_VERIFIER: "Payment verifier",
  CONTENT_MANAGER: "Content manager",
};

export function RoleSelect({ adminId, role }: { adminId: string; role: AdminRole }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const change = (next: AdminRole) => {
    if (next === role) return;
    setError(null);
    start(async () => {
      const res = await updateAdminRole(adminId, next);
      if (!res.ok) {
        setError(res.error ?? "Could not change role.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div>
      <select
        value={role}
        onChange={(e) => change(e.target.value as AdminRole)}
        disabled={pending}
        className="field w-auto text-sm"
        aria-label="Role"
      >
        {(["SUPER_ADMIN", "ADMIN", "PAYMENT_VERIFIER", "CONTENT_MANAGER"] as AdminRole[]).map((r) => (
          <option key={r} value={r}>{LABELS[r]}</option>
        ))}
      </select>
      {pending ? <Loader2 className="mt-1 h-3.5 w-3.5 animate-spin text-navy-400" aria-hidden="true" /> : null}
      {error ? <p className="mt-1 max-w-[220px] text-xs font-semibold text-crimson-600">{error}</p> : null}
    </div>
  );
}

import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, initials } from "@/lib/utils";
import { ROLE_LABELS, requireAdmin } from "@/lib/admin-auth";
import { StatusPill } from "@/components/user/status-pill";
import { RoleSelect } from "@/components/admin/role-select";
import { AdminCreateForm } from "@/components/admin/admin-create-form";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fb } from "@/lib/form-action";
import { setAdminStatus, deleteAdminUser } from "@/app/actions/admin-people-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin users", robots: { index: false } };

export default async function AdminAdminsPage() {
  const me = await requireAdmin(["SUPER_ADMIN"]);
  const admins = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { createdNotes: true, paymentsReviewed: true, auditedActions: true } },
    },
  });
  const actorNames = await prisma.adminUser.findMany({
    where: { id: { in: admins.map((a) => a.createdById).filter(Boolean) as string[] } },
    select: { id: true, name: true },
  });
  const nameById = new Map(actorNames.map((a) => [a.id, a.name]));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-extrabold text-navy-950">
            <ShieldCheck className="h-6 w-6 text-crimson-600" aria-hidden="true" /> Admin users
          </h1>
          <p className="text-sm text-navy-500">
            You are signed in as <span className="font-semibold">{me.name}</span> ({ROLE_LABELS[me.role]}). Only super admins manage staff accounts.
          </p>
        </div>
      </header>

      <div className="card max-w-2xl p-5">
        <h2 className="font-display text-lg font-extrabold text-navy-950">Invite / add a staff member</h2>
        <p className="mt-1 text-xs text-navy-400">
          The new admin will sign in with their email and the temporary password below. Change the password prompt applies on first need.
        </p>
        <div className="mt-4"><AdminCreateForm /></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[880px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Admin</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last login</th>
              <th className="text-right">Work</th>
              <th>Created by</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => {
              const isMe = a.id === me.id;
              return (
                <tr key={a.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-black text-white">
                        {initials(a.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-navy-900">
                          {a.name} {isMe ? <span className="chip ml-1 bg-gold-100 text-gold-800">You</span> : null}
                        </p>
                        <p className="text-xs text-navy-400">{a.email}{a.phone ? ` · ${a.phone}` : ""}</p>
                      </div>
                    </div>
                  </td>
                  <td><RoleSelect adminId={a.id} role={a.role} /></td>
                  <td><StatusPill status={a.status} /></td>
                  <td className="whitespace-nowrap text-xs">{a.lastLoginAt ? fmtDateTime(a.lastLoginAt) : "Never"}</td>
                  <td className="text-right text-xs text-navy-500">
                    {a._count.paymentsReviewed} reviewed · {a._count.createdNotes} notes
                  </td>
                  <td className="text-xs text-navy-500">{a.createdById ? (nameById.get(a.createdById) ?? "—") : "—"}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      {!isMe ? (
                        a.status === "ACTIVE" ? (
                          <ConfirmForm action={fb(setAdminStatus, a.id, "INACTIVE")} message={`Deactivate ${a.email}? They will be locked out of the console.`}>
                            <button type="submit" className="btn btn-ghost btn-sm text-amber-700">Deactivate</button>
                          </ConfirmForm>
                        ) : (
                          <ConfirmForm action={fb(setAdminStatus, a.id, "ACTIVE")} message={`Re-activate ${a.email}?`}>
                            <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Activate</button>
                          </ConfirmForm>
                        )
                      ) : null}
                      {!isMe ? (
                        <ConfirmForm action={fb(deleteAdminUser, a.id)} message={`Permanently remove ${a.email}? This cannot be undone.`}>
                          <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                        </ConfirmForm>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { setMemberStatus, deleteMember } from "@/app/actions/admin-people-actions";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fa } from "@/lib/form-action";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Members", robots: { index: false } };

export default async function AdminMembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Members</h1>
          <p className="text-sm text-navy-500">{members.length} membership requests (latest 200)</p>
        </div>
        <a href="/admin/export/members" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Export CSV</a>
      </header>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[980px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Interest</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td className="font-semibold text-navy-900">{m.fullName}</td>
                <td>
                  <p className="text-sm">{m.phone || "—"}</p>
                  <p className="text-xs text-navy-400">{m.email || ""}</p>
                  {m.city ? <p className="text-xs text-navy-400">{m.city}</p> : null}
                </td>
                <td>{m.areaOfInterest || "—"}</td>
                <td className="max-w-[220px]">
                  <p className="line-clamp-2 text-xs text-navy-600">{m.skills.join(", ") || "—"}</p>
                </td>
                <td><StatusPill status={m.status} /></td>
                <td className="whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    {m.status !== "ACTIVE" ? (
                      <form action={fa(setMemberStatus, m.id, "ACTIVE")}>
                        <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Approve</button>
                      </form>
                    ) : null}
                    {m.status !== "ARCHIVED" ? (
                      <form action={fa(setMemberStatus, m.id, "ARCHIVED")}>
                        <button type="submit" className="btn btn-ghost btn-sm">Archive</button>
                      </form>
                    ) : null}
                    <ConfirmForm action={deleteMember.bind(null, m.id)} message={`Delete the membership record for ${m.fullName}?`}>
                      <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                    </ConfirmForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No members yet.</p> : null}
      </div>
    </div>
  );
}

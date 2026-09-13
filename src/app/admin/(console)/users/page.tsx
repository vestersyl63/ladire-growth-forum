import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, timeAgoLabel } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { setUserStatus } from "@/app/actions/admin-people-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Users", robots: { index: false } };

const PAGE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const status = typeof sp.status === "string" && sp.status ? sp.status : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) where.OR = [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }];

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { _count: { select: { voteOrders: true, payments: true, eventRegistrations: true } } },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Users</h1>
          <p className="text-sm text-navy-500">{total} registered accounts</p>
        </div>
        <a href="/admin/export/users" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Export CSV</a>
      </header>

      <form method="get" action="/admin/users" className="flex max-w-xl gap-2">
        <input type="text" name="q" defaultValue={q} placeholder="Search name, email, phone…" className="field" />
        <button type="submit" className="btn btn-navy btn-md">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[880px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
              <th className="text-right">Vote orders</th>
              <th className="text-right">Payments</th>
              <th>Last login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <p className="font-semibold text-navy-900">{u.name || "—"}</p>
                  <p className="text-xs text-navy-400">{u.email || ""}</p>
                </td>
                <td>{u.phone || "—"}</td>
                <td><StatusPill status={u.status} /></td>
                <td className="whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                <td className="text-right">{u._count.voteOrders}</td>
                <td className="text-right">{u._count.payments}</td>
                <td className="whitespace-nowrap text-xs">{u.lastLoginAt ? timeAgoLabel(u.lastLoginAt) : "—"}</td>
                <td>
                  <ConfirmForm
                    action={setUserStatus.bind(null, u.id, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                    message={u.status === "ACTIVE" ? `Suspend ${u.name || u.email}? They will be locked out until reactivated.` : `Re-activate ${u.name || u.email}?`}
                  >
                    <button type="submit" className="btn btn-ghost btn-sm">
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </ConfirmForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No users found.</p> : null}
      </div>

      {pages > 1 ? (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/admin/users?page=${n}&q=${encodeURIComponent(q)}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-sm font-bold text-navy-700">
              {n}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

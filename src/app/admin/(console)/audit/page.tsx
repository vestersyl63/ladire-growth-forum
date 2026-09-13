import type { Metadata } from "next";

import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log", robots: { index: false } };

const PAGE = 100;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; actor?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const actor = typeof sp.actor === "string" && sp.actor ? sp.actor : null;

  const where: Record<string, unknown> = {};
  if (actor) where.actorKind = actor;
  if (q)
    where.OR = [
      { actorName: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { entityType: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE }),
  ]);

  const actors = ["ADMIN", "USER", "SYSTEM"] as const;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Audit log</h1>
          <p className="text-sm text-navy-500">
            {total.toLocaleString()} events · latest {Math.min(total, PAGE)} shown
          </p>
        </div>
        <form method="get" action="/admin/audit" className="flex flex-wrap gap-2">
          <select name="actor" defaultValue={actor ?? ""} className="field w-40">
            <option value="">All actors</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input name="q" defaultValue={q} placeholder="Search action, entity, text…" className="field w-64" />
        </form>
      </header>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[900px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="whitespace-nowrap text-xs">{fmtDateTime(r.createdAt, "d MMM yyyy, HH:mm:ss")}</td>
                <td className="whitespace-nowrap">
                  <span className="chip bg-navy-100 text-navy-700">{r.actorKind}</span>
                  <p className="mt-0.5 text-xs font-semibold text-navy-700">{r.actorName || r.actorId || "System"}</p>
                </td>
                <td><code className="whitespace-nowrap text-xs font-semibold text-crimson-700">{r.action}</code></td>
                <td className="whitespace-nowrap text-xs text-navy-500">
                  {r.entityType || "—"}
                  {r.entityId ? <span className="block max-w-[140px] truncate text-[11px] text-navy-400">{r.entityId}</span> : null}
                </td>
                <td className="min-w-[240px] text-sm text-navy-700">{r.description || "—"}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center text-sm text-navy-500">No audit events match.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, formatNaira } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { setRegistrationStatus } from "@/app/actions/admin-content-actions";
import { fa } from "@/lib/form-action";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event registrations", robots: { index: false } };

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const where: Record<string, unknown> = {};
  if (q)
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { event: { title: { contains: q, mode: "insensitive" } } },
    ];

  const regs = await prisma.eventRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { event: { select: { title: true, slug: true, priceInKobo: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Event registrations</h1>
          <p className="text-sm text-navy-500">{regs.length} (latest 300)</p>
        </div>
        <div className="flex gap-2">
          <form method="get" action="/admin/registrations">
            <input name="q" defaultValue={q} placeholder="Search…" className="field w-56" />
          </form>
          <a href="/admin/export/event-registrations" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> CSV</a>
        </div>
      </header>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[960px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Reference</th>
              <th>Registrant</th>
              <th>Event</th>
              <th className="text-right">Qty</th>
              <th>Price</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {regs.map((r) => (
              <tr key={r.id}>
                <td><code className="text-xs">{r.reference}</code></td>
                <td>
                  <p className="font-semibold text-navy-900">{r.name}</p>
                  <p className="text-xs text-navy-400">{r.email || r.phone || ""}</p>
                </td>
                <td>
                  <Link href={`/events/${r.event.slug}`} className="font-semibold text-crimson-600 hover:underline">
                    {r.event.title}
                  </Link>
                </td>
                <td className="text-right">{r.quantity}</td>
                <td>{r.event.priceInKobo ? formatNaira(r.event.priceInKobo) : "Free"}</td>
                <td className="whitespace-nowrap">{fmtDateTime(r.createdAt, "d MMM yyyy")}</td>
                <td><StatusPill status={r.status} /></td>
                <td>
                  <div className="flex gap-1">
                    {r.status !== "CONFIRMED" ? (
                      <form action={fa(setRegistrationStatus, r.id, "CONFIRMED")}>
                        <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Confirm</button>
                      </form>
                    ) : null}
                    <form action={fa(setRegistrationStatus, r.id, "CANCELLED")}>
                      <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Cancel</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {regs.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No registrations.</p> : null}
      </div>
    </div>
  );
}

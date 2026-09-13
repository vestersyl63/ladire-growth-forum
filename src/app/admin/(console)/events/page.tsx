import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, formatNaira } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { categoryLabel } from "@/components/marketing/event-card";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { deleteEvent } from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Events", robots: { index: false } };

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();
  const status = typeof sp.status === "string" && sp.status ? sp.status : null;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q)
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { venue: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
    ];

  const events = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "desc" },
    take: 200,
    include: { _count: { select: { registrations: true, bookings: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Events</h1>
          <p className="text-sm text-navy-500">{events.length} shown (latest 200)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" action="/admin/events" className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Search events…" className="field w-48" />
            <select name="status" defaultValue={status ?? ""} className="field w-44">
              <option value="">All statuses</option>
              <option>DRAFT</option>
              <option>PUBLISHED</option>
              <option>CANCELLED</option>
              <option>COMPLETED</option>
            </select>
            <button type="submit" className="btn btn-outline btn-md">Filter</button>
          </form>
          <Link href="/admin/events/new" className="btn btn-primary btn-md">
            <Plus className="h-4 w-4" aria-hidden="true" /> New event
          </Link>
        </div>
      </header>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[960px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Event</th>
              <th>Category</th>
              <th>Starts</th>
              <th>Price</th>
              <th className="text-center">Regs</th>
              <th className="text-center">Bookings</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>
                  <Link href={`/admin/events/${e.id}`} className="font-semibold text-crimson-600 hover:underline">
                    {e.title}
                  </Link>
                  <p className="text-xs text-navy-400">/{e.slug}</p>
                </td>
                <td><span className="text-xs font-semibold text-navy-600">{categoryLabel(e.category)}</span></td>
                <td className="whitespace-nowrap">{fmtDateTime(e.startsAt, "d MMM yyyy, HH:mm")}</td>
                <td>{e.priceInKobo ? formatNaira(e.priceInKobo) : "Free"}</td>
                <td className="text-center">{e._count.registrations}</td>
                <td className="text-center">{e._count.bookings}</td>
                <td><StatusPill status={e.status} /></td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Link href={`/events/${e.slug}`} className="btn btn-ghost btn-sm">View</Link>
                    <Link href={`/admin/events/${e.id}`} className="btn btn-ghost btn-sm text-navy-700">Edit</Link>
                    <ConfirmForm
                      action={deleteEvent.bind(null, e.id)}
                      message={`Delete “${e.title}”? This removes its registrations and bookings too.`}
                    >
                      <button type="submit" aria-label="Delete event" className="btn btn-ghost btn-sm text-crimson-600">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </ConfirmForm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No events yet. Create your first one.</p> : null}
      </div>
    </div>
  );
}

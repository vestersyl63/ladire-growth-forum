import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, formatNaira } from "@/lib/utils";
import { fa } from "@/lib/form-action";
import { StatusPill } from "@/components/user/status-pill";
import {
  setEventBookingStatus,
  setVacationBookingStatus,
} from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

export default async function AdminBookingsPage() {
  const [eventBookings, vacationBookings] = await Promise.all([
    prisma.eventBooking.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { event: { select: { title: true } }, option: { select: { title: true, type: true } } },
    }),
    prisma.vacationBooking.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: { programme: { select: { title: true, startsAt: true } } },
    }),
  ]);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Bookings &amp; reservations</h1>
          <p className="text-sm text-navy-500">Event bookings + vacation programme reservations.</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/export/event-bookings" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Event CSV</a>
          <a href="/admin/export/vacation-bookings" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Vacation CSV</a>
        </div>
      </header>

      <section>
        <h2 className="font-display text-lg font-extrabold text-navy-950">Event bookings (tables/seats)</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="tbl min-w-[900px]">
            <thead className="border-b border-navy-100 bg-navy-50/60">
              <tr>
                <th>Ref</th>
                <th>Booker</th>
                <th>Event</th>
                <th>Option</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Total</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventBookings.map((b) => (
                <tr key={b.id}>
                  <td><code className="text-xs">{b.reference}</code></td>
                  <td>
                    <p className="font-semibold text-navy-900">{b.name}</p>
                    <p className="text-xs text-navy-400">{b.email || b.phone || ""}</p>
                  </td>
                  <td>{b.event.title}</td>
                  <td>{b.option?.title || "—"}</td>
                  <td className="text-right">{b.quantity}</td>
                  <td className="text-right">{b.totalKobo ? formatNaira(b.totalKobo) : "Free"}</td>
                  <td className="whitespace-nowrap">{fmtDateTime(b.createdAt, "d MMM")}</td>
                  <td><StatusPill status={b.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      {b.status !== "CONFIRMED" ? (
                        <form action={fa(setEventBookingStatus, b.id, "CONFIRMED")}>
                          <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Confirm</button>
                        </form>
                      ) : null}
                      {b.status !== "CANCELLED" ? (
                        <form action={fa(setEventBookingStatus, b.id, "CANCELLED")}>
                          <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Cancel</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {eventBookings.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No event bookings yet.</p> : null}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-extrabold text-navy-950">Vacation programme reservations</h2>
        <div className="card mt-3 overflow-x-auto">
          <table className="tbl min-w-[900px]">
            <thead className="border-b border-navy-100 bg-navy-50/60">
              <tr>
                <th>Ref</th>
                <th>Participant</th>
                <th>Parent</th>
                <th>Programme</th>
                <th className="text-right">Places</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vacationBookings.map((b) => (
                <tr key={b.id}>
                  <td><code className="text-xs">{b.reference}</code></td>
                  <td>
                    <p className="font-semibold text-navy-900">{b.participantName}</p>
                    <p className="text-xs text-navy-400">{b.participantAge ? `Age ${b.participantAge}` : ""}</p>
                  </td>
                  <td>
                    <p className="text-sm">{b.parentName}</p>
                    <p className="text-xs text-navy-400">{b.parentPhone} {b.parentEmail ? `· ${b.parentEmail}` : ""}</p>
                  </td>
                  <td>{b.programme.title}</td>
                  <td className="text-right">{b.quantity}</td>
                  <td className="whitespace-nowrap">{fmtDateTime(b.createdAt, "d MMM")}</td>
                  <td><StatusPill status={b.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      {b.status !== "CONFIRMED" ? (
                        <form action={fa(setVacationBookingStatus, b.id, "CONFIRMED")}>
                          <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Confirm</button>
                        </form>
                      ) : null}
                      {b.status !== "CANCELLED" ? (
                        <form action={fa(setVacationBookingStatus, b.id, "CANCELLED")}>
                          <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Cancel</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vacationBookings.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-navy-500">No vacation reservations yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

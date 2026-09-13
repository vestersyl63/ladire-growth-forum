import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, Sun } from "lucide-react";

import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bookings & reservations",
  description: "Your event bookings and vacation programme reservations.",
};

export default async function BookingsPage() {
  const session = await requireUser();
  const [eventBookings, vacationBookings] = await Promise.all([
    prisma.eventBooking.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      include: { event: true, option: true },
    }),
    prisma.vacationBooking.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      include: { programme: true },
    }),
  ]);

  const total = eventBookings.length + vacationBookings.length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Bookings &amp; reservations</h1>
        <p className="mt-1 text-sm text-navy-500">
          Tables, seats and programme places you have reserved.
        </p>
      </header>

      {total === 0 ? (
        <div className="card p-12 text-center">
          <CalendarCheck2 className="mx-auto h-12 w-12 text-navy-300" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-900">No bookings yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
            Reserve a table or seat at an event, or book the vacation programme ahead of time.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/events" className="btn btn-primary btn-md">Browse events</Link>
            <Link href="/events/vacation-programme" className="btn btn-olive btn-md">
              <Sun className="h-4 w-4" aria-hidden="true" /> Vacation programme
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {eventBookings.length ? (
            <section>
              <h2 className="font-display text-xl font-extrabold text-navy-950">Event bookings</h2>
              <div className="mt-3 space-y-3">
                {eventBookings.map((b) => (
                  <div key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-extrabold text-navy-950">
                        {b.option?.title || b.event.title}
                        <span className="ml-2 text-sm font-semibold text-navy-500">· {b.event.title}</span>
                      </p>
                      <p className="mt-1 text-sm text-navy-500">
                        Qty {b.quantity} · {fmtDate(b.event.startsAt, "EEE, d MMM yyyy")} ·{" "}
                        {b.option?.type === "TABLE" ? "Table" : b.option?.type === "SEAT" ? "Seat" : "Reservation"}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400">
                        Booked {fmtDateTime(b.createdAt)} · Ref <code>{b.reference}</code>
                      </p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {vacationBookings.length ? (
            <section>
              <h2 className="font-display text-xl font-extrabold text-navy-950">
                Vacation programme reservations
              </h2>
              <div className="mt-3 space-y-3">
                {vacationBookings.map((b) => (
                  <div key={b.id} className="card flex flex-wrap items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-extrabold text-navy-950">{b.programme.title}</p>
                      <p className="mt-1 text-sm text-navy-500">
                        Participant: {b.participantName}
                        {b.participantAge ? ` (age ${b.participantAge})` : ""} · {b.quantity} place{b.quantity === 1 ? "" : "s"}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400">
                        {fmtDate(b.programme.startsAt, "d MMM")}
                        {b.programme.endsAt ? ` – ${fmtDate(b.programme.endsAt, "d MMM yyyy")}` : ""} · Ref{" "}
                        <code>{b.reference}</code>
                      </p>
                    </div>
                    <StatusPill status={b.status} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

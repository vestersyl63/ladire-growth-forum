import type { Metadata } from "next";
import Link from "next/link";
import { Ticket, CalendarDays, MapPin } from "lucide-react";

import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event registrations",
  description: "Events you have registered for.",
};

export default async function RegistrationsPage() {
  const session = await requireUser();
  const regs = await prisma.eventRegistration.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    include: { event: true },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Event registrations</h1>
        <p className="mt-1 text-sm text-navy-500">Every event you’ve registered to attend.</p>
      </header>

      {regs.length === 0 ? (
        <div className="card p-12 text-center">
          <Ticket className="mx-auto h-12 w-12 text-navy-300" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-900">
            You haven’t registered for any events yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
            Browse upcoming events and register to attend.
          </p>
          <Link href="/events" className="btn btn-primary btn-md mt-6">Find events</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {regs.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <Link href={`/events/${r.event.slug}`} className="font-display text-lg font-extrabold text-navy-950 hover:text-crimson-600">
                  {r.event.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" aria-hidden="true" /> {fmtDate(r.event.startsAt, "EEE, d MMM yyyy")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" aria-hidden="true" /> {r.event.venue || r.event.location || "TBA"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-navy-400">
                  Registered {fmtDateTime(r.createdAt)} · Ref <code>{r.reference}</code> · {r.quantity} person{r.quantity === 1 ? "" : "s"}
                </p>
              </div>
              <StatusPill status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

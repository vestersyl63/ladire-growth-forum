import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, formatNaira, toLocalInputValue } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { categoryLabel } from "@/components/marketing/event-card";
import { EventForm } from "@/components/admin/admin-forms";
import { BookingOptionForm } from "@/components/admin/booking-option-form";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fa, fb } from "@/lib/form-action";
import {
  deleteEvent,
  setEventStatus,
  toggleBookingOption,
  deleteBookingOption,
} from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit event", robots: { index: false } };

export default async function AdminEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, recentRegs, recentBookings] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        bookingOptions: { orderBy: { sortOrder: "asc" } },
        _count: { select: { registrations: true, bookings: true } },
      },
    }),
    prisma.eventRegistration.findMany({ where: { eventId: id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.eventBooking.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { option: { select: { title: true } } },
    }),
  ]);
  if (!event) notFound();

  const statuses = ["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"] as const;
  const capacities = event.capacity ?? null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to events
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-navy-950">{event.title}</h1>
            <StatusPill status={event.status} />
            <span className="chip bg-navy-100 text-navy-700">{categoryLabel(event.category)}</span>
          </div>
          <p className="mt-1 text-sm text-navy-500">/{event.slug}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/events/${event.slug}`} className="btn btn-outline btn-md">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> View live page
          </Link>
          {event.status !== "PUBLISHED" ? (
            <form action={fa(setEventStatus, event.id, "PUBLISHED")}>
              <button type="submit" className="btn btn-success btn-md">Publish</button>
            </form>
          ) : null}
          <ConfirmForm action={fb(deleteEvent, event.id)} message={`Delete this event permanently?`} noConfirm={false}>
            <button type="submit" className="btn btn-danger btn-md">Delete event</button>
          </ConfirmForm>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Details & times</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Starts</dt><dd className="font-semibold text-navy-800">{fmtDateTime(event.startsAt)}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Ends</dt><dd className="font-semibold text-navy-800">{event.endsAt ? fmtDateTime(event.endsAt) : "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Venue</dt><dd className="font-semibold text-navy-800">{event.venue || "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Location</dt><dd className="font-semibold text-navy-800">{event.location || "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Price</dt><dd className="font-semibold text-navy-800">{event.priceInKobo ? formatNaira(event.priceInKobo) : "Free"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Capacity</dt><dd className="font-semibold text-navy-800">{capacities ?? "Unlimited"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Participation</dt><dd className="font-semibold text-navy-800">{event.participation.replace("_", " ")}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Featured</dt><dd className="font-semibold text-navy-800">{event.isFeatured ? "Yes" : "No"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Registrations close</dt><dd className="font-semibold text-navy-800">{event.registrationDeadline ? fmtDateTime(event.registrationDeadline) : "—"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-navy-400">Booking closes</dt><dd className="font-semibold text-navy-800">{event.bookingDeadline ? fmtDateTime(event.bookingDeadline) : "—"}</dd></div>
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-400">Change status:</span>
              {statuses.map((s) =>
                s === event.status ? (
                  <span key={s} className="chip bg-navy-900 text-white">{s}</span>
                ) : (
                  <form key={s} action={fa(setEventStatus, event.id, s)}>
                    <button type="submit" className="btn btn-ghost btn-sm">{s}</button>
                  </form>
                )
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold text-navy-950">Registrations</h2>
              <Link href={`/admin/registrations?q=${encodeURIComponent(event.title)}`} className="btn btn-outline btn-sm">
                See all ({event._count.registrations})
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-navy-100 text-sm">
              {recentRegs.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-semibold text-navy-800">{r.name} <span className="font-normal text-navy-400">× {r.quantity}</span></span>
                  <span className="flex items-center gap-2"><StatusPill status={r.status} /><code className="text-xs text-navy-400">{r.reference}</code></span>
                </li>
              ))}
              {recentRegs.length === 0 ? <li className="py-2 text-navy-500">No registrations yet.</li> : null}
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-extrabold text-navy-950">Bookings</h2>
              <Link href="/admin/bookings" className="btn btn-outline btn-sm">See all ({event._count.bookings})</Link>
            </div>
            <ul className="mt-3 divide-y divide-navy-100 text-sm">
              {recentBookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-semibold text-navy-800">{b.name} <span className="font-normal text-navy-400">· {b.option?.title ?? "General"}</span></span>
                  <span className="flex items-center gap-2"><StatusPill status={b.status} /><code className="text-xs text-navy-400">{b.reference}</code></span>
                </li>
              ))}
              {recentBookings.length === 0 ? <li className="py-2 text-navy-500">No bookings yet.</li> : null}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Edit event</h2>
            <p className="mt-1 text-xs text-navy-400">Leave image empty to keep the current one.</p>
            <div className="mt-4">
              <EventForm
                initial={{
                  id: event.id,
                  title: event.title,
                  summary: event.summary ?? "",
                  description: event.description ?? "",
                  imageUrl: event.imageUrl,
                  category: event.category,
                  startsAt: event.startsAt,
                  endsAt: event.endsAt,
                  venue: event.venue,
                  location: event.location,
                  capacity: event.capacity,
                  priceInKobo: event.priceInKobo,
                  participation: event.participation,
                  registrationDeadline: event.registrationDeadline,
                  bookingType: event.bookingType,
                  bookingDeadline: event.bookingDeadline,
                  externalUrl: event.externalUrl,
                  instructions: event.instructions ?? "",
                  isFeatured: event.isFeatured,
                  status: event.status,
                }}
              />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Booking options</h2>
            <p className="mt-1 text-xs text-navy-400">Add seats / tables / packages for bookable events.</p>
            <div className="mt-4"><BookingOptionForm eventId={event.id} /></div>
            <ul className="mt-4 space-y-2">
              {event.bookingOptions.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-navy-100 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-navy-800">
                      {o.title} <span className="chip ml-1 bg-navy-100 text-navy-600">{o.type}</span>
                    </p>
                    <p className="text-xs text-navy-400">
                      {o.capacity ? `${o.capacity} available` : "No capacity limit"} · {o.priceInKobo ? formatNaira(o.priceInKobo) : "Free"} · order {o.sortOrder}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {o.isAvailable ? (
                      <form action={fa(toggleBookingOption, o.id, false)}>
                        <button type="submit" className="btn btn-ghost btn-sm text-amber-700">Suspend</button>
                      </form>
                    ) : (
                      <form action={fa(toggleBookingOption, o.id, true)}>
                        <button type="submit" className="btn btn-ghost btn-sm text-emerald-700">Enable</button>
                      </form>
                    )}
                    <ConfirmForm action={fb(deleteBookingOption, o.id)} message={`Delete booking option “${o.title}”?`}>
                      <button type="submit" aria-label={`Delete ${o.title}`} className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                    </ConfirmForm>
                  </div>
                </li>
              ))}
              {event.bookingOptions.length === 0 ? (
                <li className="rounded-lg border border-dashed border-navy-200 p-4 text-center text-xs text-navy-400">
                  <Plus className="mx-auto mb-1 h-4 w-4" aria-hidden="true" /> No booking options yet.
                </li>
              ) : null}
            </ul>
          </div>

          {event.imageUrl ? (
            <div className="card overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.imageUrl} alt="" className="h-44 w-full object-cover" />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

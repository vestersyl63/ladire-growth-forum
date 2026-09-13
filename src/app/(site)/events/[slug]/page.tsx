import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
  Users,
  Globe,
  ArrowLeft,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, formatNaira, toParagraphs } from "@/lib/utils";
import { categoryLabel } from "@/components/marketing/event-card";
import { EventRegisterForm, EventBookForm } from "@/components/forms/event-forms";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { bookingOptions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event || event.status !== "PUBLISHED") notFound();

  const session = await getSession();
  const prefill = {
    name: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    phone: session?.user?.phone ?? undefined,
  };

  const regOpen = !(
    event.registrationDeadline && event.registrationDeadline < new Date()
  );
  const bookOpen = !(event.bookingDeadline && event.bookingDeadline < new Date());
  const free = event.priceInKobo == null || event.priceInKobo === 0;
  const allowsReg = ["REGISTRATION", "BOTH"].includes(event.participation);
  const allowsBook = ["BOOKING", "BOTH"].includes(event.participation);
  const paragraphs = toParagraphs(event.description);
  const instructions = toParagraphs(event.instructions);

  return (
    <>
      <section className="border-b border-navy-100 bg-navy-950 py-8 text-white">
        <div className="container-x">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All events
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="chip bg-gold-400 text-navy-950">{categoryLabel(event.category)}</span>
            <span className={free ? "chip bg-emerald-600 text-white" : "chip bg-white/10 text-white"}>
              {free ? "Free entry" : formatNaira(event.priceInKobo)}
            </span>
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-extrabold sm:text-4xl">
            {event.title}
          </h1>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-navy-100">
              {event.imageUrl ? (
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 760px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 to-crimson-950">
                  <CalendarDays className="h-14 w-14 text-white/30" aria-hidden="true" />
                </div>
              )}
            </div>

            {/* Meta strip */}
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetaItem icon={<CalendarDays className="h-4 w-4" />} label="Date" value={fmtDate(event.startsAt, "EEE, d MMM yyyy")} />
              <MetaItem icon={<Clock className="h-4 w-4" />} label="Time" value={fmtDateTime(event.startsAt, "h:mm a")} />
              <MetaItem icon={<MapPin className="h-4 w-4" />} label="Venue" value={event.venue || "To be announced"} />
              <MetaItem
                icon={<Users className="h-4 w-4" />}
                label="Participation"
                value={
                  event.participation === "NONE"
                    ? "Open to all"
                    : event.participation === "BOTH"
                      ? "Register or book"
                      : event.participation === "BOOKING"
                        ? "Booking only"
                        : "Registration"
                }
              />
            </dl>

            {/* Description */}
            {paragraphs.length ? (
              <div className="mt-8">
                <h2 className="h-display text-xl font-extrabold">About this event</h2>
                <div className="prose-sm mt-4 text-[15px]">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {instructions.length ? (
              <div className="mt-8 rounded-2xl border border-navy-100 bg-navy-50/60 p-5">
                <h3 className="font-display text-base font-extrabold text-navy-950">
                  Registration notes
                </h3>
                <div className="prose-sm mt-3 text-sm">
                  {instructions.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ) : null}

            {event.externalUrl ? (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-semibold text-crimson-600 underline-offset-4 hover:underline"
              >
                <Globe className="h-4 w-4" aria-hidden="true" /> External link / tickets
              </a>
            ) : null}
          </div>

          {/* Sidebar action card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="border-b border-navy-100 bg-navy-50/60 px-5 py-4">
                <h2 className="font-display text-lg font-extrabold text-navy-950">
                  {allowsBook && event.bookingOptions.length
                    ? "Book your place"
                    : allowsReg
                      ? "Register to attend"
                      : "Join this event"}
                </h2>
              </div>
              <div className="p-5">
                {allowsBook && event.bookingOptions.length ? (
                  <>
                    <p className="mb-1 text-xs text-navy-500">
                      Reserve a table, seat or package for this event.
                    </p>
                    <div className="mb-5 space-y-1.5 text-sm text-navy-700">
                      {event.bookingDeadline ? (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-crimson-600" aria-hidden="true" />
                          Booking closes {fmtDateTime(event.bookingDeadline)}
                        </p>
                      ) : null}
                      {!bookOpen ? (
                        <p role="status" className="rounded-lg bg-crimson-50 px-3 py-2 font-semibold text-crimson-700">
                          Booking is currently closed.
                        </p>
                      ) : null}
                    </div>
                    {bookOpen ? (
                      <EventBookForm eventId={event.id} options={event.bookingOptions} prefill={prefill} />
                    ) : null}
                  </>
                ) : allowsReg ? (
                  <>
                    {event.registrationDeadline ? (
                      <p className="mb-4 flex items-center gap-2 text-sm text-navy-600">
                        <Clock className="h-4 w-4 text-crimson-600" aria-hidden="true" />
                        Registration closes {fmtDateTime(event.registrationDeadline)}
                      </p>
                    ) : null}
                    {regOpen ? (
                      <EventRegisterForm eventId={event.id} prefill={prefill} />
                    ) : (
                      <p role="status" className="rounded-lg bg-crimson-50 px-3 py-2 font-semibold text-crimson-700">
                        Registration for this event has closed.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-navy-600">
                    This is an open community event — no registration needed. Follow LADIRE for
                    updates.
                  </p>
                )}

                {event.capacity ? (
                  <p className="mt-4 flex items-center gap-2 border-t border-navy-100 pt-4 text-xs text-navy-500">
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    Event capacity: {event.capacity.toLocaleString()} people
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-3 shadow-sm">
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-navy-400">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-navy-900">{value}</dd>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary || undefined,
  };
}

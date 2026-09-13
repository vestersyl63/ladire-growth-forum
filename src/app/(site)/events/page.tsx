import Link from "next/link";
import { CalendarDays, Filter } from "lucide-react";
import type { Metadata } from "next";

import { SectionHead } from "@/components/marketing/head";
import { EventCard, categoryLabel } from "@/components/marketing/event-card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Events & Activities",
  description:
    "Upcoming LADIRE Growth Forum events — awards, daytime hangouts, vacation programmes, workshops and community activities in Lagos.",
};

const FILTERS: Array<{ value: string | null; label: string }> = [
  { value: null, label: "All" },
  { value: "AWARDS", label: "Awards" },
  { value: "DAYTIME_HANGOUT", label: "Daytime Hangout" },
  { value: "VACATION_PROGRAMME", label: "Vacation Programme" },
  { value: "WORKSHOP", label: "Workshops" },
  { value: "COMMUNITY", label: "Community" },
  { value: "CULTURAL", label: "Cultural" },
];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const cat = typeof sp.cat === "string" && sp.cat.length ? sp.cat : null;

  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      status: "PUBLISHED",
      ...(cat ? { category: cat as never } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { startsAt: "desc" }],
    take: 60,
  });

  const upcoming = events.filter((e) => new Date(e.startsAt) >= now).sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
  );
  const past = events.filter((e) => new Date(e.startsAt) < now);

  return (
    <>
      <section className="bg-navy-950 py-14 text-white sm:py-16">
        <div className="container-x">
          <p className="eyebrow !text-flame-300">What’s happening</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Events & Activities
          </h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Workshops, hangouts, programmes, awards nights and community moments. Pick what
            interests you and join in.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          {/* Category filter */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter events by category">
            <span className="mr-1 hidden items-center gap-1.5 text-sm font-semibold text-navy-600 sm:flex">
              <Filter className="h-4 w-4" aria-hidden="true" /> Filter:
            </span>
            {FILTERS.map((f) => (
              <Link
                key={f.label}
                href={f.value ? `/events?cat=${f.value}` : "/events"}
                aria-pressed={cat === f.value}
                className={cn(
                  "chip border px-3.5 py-1.5 text-sm",
                  cat === f.value
                    ? "border-navy-900 bg-navy-900 text-white"
                    : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>

          <h2 className="mt-10 h-display text-2xl font-extrabold sm:text-3xl">Upcoming</h2>
          {upcoming.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          ) : (
            <EmptyEvents text="No upcoming events match this filter right now." />
          )}

          {past.length ? (
            <>
              <h2 className="mt-16 h-display text-2xl font-extrabold sm:text-3xl">Past events</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((ev) => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}

function EmptyEvents({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 p-10 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
      <p className="mt-3 font-semibold text-navy-800">{text}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
        Events are announced on this page and via LADIRE&apos;s channels.
      </p>
    </div>
  );
}

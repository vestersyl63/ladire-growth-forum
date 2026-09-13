import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Sun, Music2, Gamepad2, Users, Camera, ArrowRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings } from "@/lib/site";
import { fmtDate, fmtDateTime } from "@/lib/utils";
import { SectionHead } from "@/components/marketing/head";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daytime Hangout",
  description:
    "LADIRE Daytime Hangout — a relaxed daytime community gathering with music, games and good vibes. See the next hangout and register.",
};

export default async function DaytimeHangoutPage() {
  const settings = await getPublicSiteSettings();
  const events = await prisma.event.findMany({
    where: { category: "DAYTIME_HANGOUT", status: "PUBLISHED" },
    orderBy: { startsAt: "desc" },
    take: 3,
  });
  const next = events.find((e) => new Date(e.startsAt) >= new Date()) ?? events[0];

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-flame-700 via-flame-600 to-crimson-600 text-white">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-white/80">
              <Sun className="mr-1 inline h-4 w-4" aria-hidden="true" /> LADIRE signature programme
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Daytime Hangout</h1>
            <p className="mt-4 max-w-xl text-white/85">
              {String(settings.content.daytimeHangout || "")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Live music & vibes", "Games & fun", "Community meet-up", "Great conversations"].map((t) => (
                <span key={t} className="chip bg-white/15 text-white backdrop-blur">{t}</span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src={next?.imageUrl || "/sample/daytime-hangout.jpg"}
              alt="LADIRE Daytime Hangout"
              width={720}
              height={460}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <SectionHead
              eyebrow="What to expect"
              title="Sunshine, sound and community"
              sub="The Daytime Hangout is where the LADIRE community comes together in the day to relax, connect and have a good time."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Music2, t: "Music & entertainment", d: "Great sound, live sets and a playlist built for good vibes." },
                { icon: Gamepad2, t: "Games & activities", d: "Casual games and activities to break the ice and have fun." },
                { icon: Users, t: "Real connections", d: "Meet new people, creatives, and friends in a safe daytime space." },
                { icon: Camera, t: "Photo-worthy moments", d: "Great energy and backdrops for content and memories." },
              ].map((f) => (
                <div key={f.t} className="card p-5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-flame-100 text-flame-700">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 font-display font-bold text-navy-950">{f.t}</h3>
                  <p className="mt-1 text-sm text-navy-600">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside>
            <div className="card sticky top-24 overflow-hidden">
              <div className="border-b border-navy-100 bg-navy-50/70 p-4">
                <h2 className="font-display text-lg font-extrabold text-navy-950">Next hangout</h2>
              </div>
              <div className="p-5">
                {next ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-display text-base font-bold text-navy-950">{next.title}</p>
                    <p className="flex items-center gap-2 text-navy-600">
                      <Sun className="h-4 w-4 text-flame-600" aria-hidden="true" />
                      {fmtDate(next.startsAt, "EEEE, d MMM yyyy")}
                    </p>
                    <p className="flex items-center gap-2 text-navy-600">
                      {fmtDateTime(next.startsAt, "h:mm a")}
                      {next.endsAt ? ` – ${fmtDateTime(next.endsAt, "h:mm a")}` : ""}
                    </p>
                    <p className="flex items-center gap-2 text-navy-600">{next.venue || "Venue announced soon"}</p>
                    <Link href={`/events/${next.slug}`} className="btn btn-flame btn-md mt-2 w-full">
                      Hangout details & registration
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-navy-600">
                      No daytime hangout is scheduled at the moment — the next one is being planned.
                    </p>
                    <p className="text-sm text-navy-600">
                      Follow LADIRE to be the first to know when the next hangout is announced.
                    </p>
                    <Link href="/contact" className="btn btn-flame btn-md w-full">
                      Ask about the next hangout
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-navy-100 bg-navy-50/60 py-10">
        <div className="container-x flex flex-wrap items-center justify-between gap-4">
          <p className="font-display text-lg font-extrabold text-navy-950">
            Want LADIRE to bring the hangout to your area?
          </p>
          <Link href="/contact" className="btn btn-navy">
            Talk to us <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

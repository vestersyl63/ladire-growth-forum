import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Palette, Sparkles, Users, ShieldCheck, GraduationCap, CalendarDays } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings } from "@/lib/site";
import { fmtDate } from "@/lib/utils";
import { VacationBookForm } from "@/components/forms/event-forms";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vacation / Holiday Programme",
  description:
    "LADIRE Vacation / Holiday Programme — a creative, supervised programme for young people during school holidays. View dates and reserve a place.",
};

export default async function VacationProgrammePage() {
  const settings = await getPublicSiteSettings();
  const programmes = await prisma.vacationProgramme.findMany({
    where: { isPublished: true },
    orderBy: { startsAt: "desc" },
  });
  const session = await getSession();
  const prefill = {
    name: session?.user?.name ?? undefined,
    email: session?.user?.email ?? undefined,
    phone: session?.user?.phone ?? undefined,
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-olive-800 via-olive-700 to-navy-900 text-white">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-gold-300">School holidays</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              Vacation / Holiday Programme
            </h1>
            <p className="mt-4 max-w-xl text-white/85">
              {String(settings.content.vacationProgramme || "")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Creative activities", "Skill sessions", "Supervised & safe", "Holiday fun"].map((t) => (
                <span key={t} className="chip bg-white/15 text-white backdrop-blur">{t}</span>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src="/sample/vacation-programme.jpg"
              alt="LADIRE Vacation Programme activities"
              width={720}
              height={460}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Palette, t: "Creativity", d: "Art, design, craft, music and performance." },
              { icon: GraduationCap, t: "Skills", d: "Practical sessions that build confidence." },
              { icon: ShieldCheck, t: "Supervision", d: "Run and watched over by the LADIRE team." },
              { icon: Users, t: "Community", d: "Make friends and holiday memories." },
            ].map((f) => (
              <div key={f.t} className="card p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                  <f.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 font-display font-bold text-navy-950">{f.t}</h3>
                <p className="mt-1 text-sm text-navy-600">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-navy-50/60">
        <div className="container-x">
          <h2 className="section-title text-center">Programmes & reservations</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-navy-600">
            Book a place for the coming holiday period ahead of time. Spaces are limited.
          </p>

          {programmes.length ? (
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {programmes.map((p) => (
                <article key={p.id} className="card overflow-hidden">
                  <div className="relative h-48 bg-navy-100">
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-olive-700 to-navy-900">
                        <Sparkles className="h-10 w-10 text-white/40" aria-hidden="true" />
                      </div>
                    )}
                    <span className="chip absolute left-4 top-4 bg-white/90 text-olive-800">
                      {p.startsAt ? fmtDate(p.startsAt, "d MMM") : ""}
                      {p.endsAt ? ` – ${fmtDate(p.endsAt, "d MMM")}` : ""}
                    </span>
                    {p.bookingOpen ? (
                      <span className="chip absolute right-4 top-4 bg-emerald-600 text-white">Booking open</span>
                    ) : (
                      <span className="chip absolute right-4 top-4 bg-navy-950/80 text-white">Booking closed</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-xl font-extrabold text-navy-950">{p.title}</h3>
                    {p.ageRange ? (
                      <p className="mt-1 text-sm font-semibold text-olive-700">Ages: {p.ageRange}</p>
                    ) : null}
                    <div className="mt-3 space-y-1 text-sm text-navy-600">
                      {p.venue || p.location ? <p>📍 {p.venue || p.location}</p> : null}
                      {p.capacity ? <p>👥 Capacity: {p.capacity} places</p> : null}
                    </div>
                    {p.description ? (
                      <p className="mt-3 text-sm leading-relaxed text-navy-600">{p.description}</p>
                    ) : null}
                    {p.activities.length ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {p.activities.slice(0, 6).map((a) => (
                          <li key={a} className="chip bg-navy-100 text-navy-700">{a}</li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="mt-5 border-t border-navy-100 pt-5">
                      {p.bookingOpen ? (
                        <VacationBookForm programmeId={p.id} prefill={prefill} />
                      ) : (
                        <p className="rounded-lg bg-navy-50 px-3.5 py-2.5 text-sm font-semibold text-navy-600">
                          Reservations for this programme are currently closed. Check back for the next intake.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-extrabold text-navy-900">
                No holiday programme is open for booking yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
                The next Vacation / Holiday Programme is being planned. Register as a member or
                follow LADIRE to get the dates first.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/join" className="btn btn-olive">Join the community</Link>
                <Link href="/contact" className="btn btn-outline">Ask about the programme</Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

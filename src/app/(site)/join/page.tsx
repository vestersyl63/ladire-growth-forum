import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Ticket, Star, Users2 } from "lucide-react";

import { MembershipForm } from "@/components/forms/public-forms";
import { getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join LADIRE — Membership",
  description:
    "Join LADIRE Growth Forum free — become part of a youth community for learning, culture and creativity in Lagos.",
};

export default async function JoinPage() {
  const settings = await getPublicSiteSettings();
  void settings;
  return (
    <>
      <section className="bg-navy-950 py-12 text-white sm:py-16">
        <div className="container-x max-w-5xl">
          <p className="eyebrow !text-flame-300">Membership</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Join LADIRE</h1>
          <p className="mt-4 max-w-2xl text-white/75">
            Become part of the LADIRE Growth Forum community. It’s free — you’ll hear first about
            events, programmes and the awards, and get a platform to grow and be seen.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h2 className="section-title">What members get</h2>
            <ul className="mt-6 space-y-4">
              {[
                { icon: Sparkles, t: "Early access", d: "First dibs on events, hangouts, programme places and award updates." },
                { icon: Ticket, t: "Events & programmes", d: "Simple registration and booking for LADIRE activities." },
                { icon: Star, t: "Recognition", d: "A community that celebrates your talent and creativity." },
                { icon: Users2, t: "People", d: "Real connections with young creatives and mentors around you." },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-white">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-display font-extrabold text-navy-950">{f.t}</h3>
                    <p className="mt-0.5 text-sm text-navy-600">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-navy-100 bg-navy-50/60 p-5 text-sm text-navy-700">
              Already registered for the awards or an event?{" "}
              <Link href="/login" className="font-bold text-crimson-600 underline">Sign in</Link> to
              manage everything from one dashboard.
            </div>
          </div>

          <div className="card p-6 sm:p-8">
            <h2 className="font-display text-2xl font-extrabold text-navy-950">Membership form</h2>
            <p className="mt-1 mb-6 text-sm text-navy-500">Fill this in — it takes under a minute.</p>
            <MembershipForm />
          </div>
        </div>
      </section>
    </>
  );
}

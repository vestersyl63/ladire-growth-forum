import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Target,
  Eye,
  Heart,
  Palette,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

import { getPublicSiteSettings, parseValuesArray } from "@/lib/site";
import { SectionHead } from "@/components/marketing/head";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About LADIRE Growth Forum",
  description:
    "LADIRE Growth Forum is a community and platform helping young people learn, connect, create, collaborate, grow and receive recognition.",
};

export default async function AboutPage() {
  const settings = await getPublicSiteSettings();
  const c = settings.content;
  const values = parseValuesArray(c.values);
  const pillars = parseValuesArray(c.doingPillars);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div className="container-x relative max-w-4xl">
          <p className="eyebrow !text-flame-300">About us</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Building youth. Promoting culture.
            <br />
            Celebrating creativity.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-white/80">
            LADIRE Growth Forum is a community and platform focused on helping young people{" "}
            <strong className="text-white">learn, connect, create, collaborate, grow</strong> and{" "}
            <strong className="text-white">receive recognition</strong>.
          </p>
        </div>
        <div className="mt-12 h-1.5 w-full">
          <div className="flex h-full w-full">
            <div className="flex-1 bg-crimson-600" />
            <div className="flex-1 bg-olive-600" />
            <div className="flex-1 bg-flame-500" />
            <div className="flex-1 bg-gold-400" />
            <div className="flex-1 bg-navy-600" />
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="section bg-white">
        <div className="container-x grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="section-title">A community where young people grow and are recognised.</h2>
            <div className="mt-5 space-y-4 text-navy-700">
              {String(c.aboutSummary || "").split(/\n{2,}/).map((p, i) => (
                <p key={i} className="leading-relaxed">{p}</p>
              ))}
              <p className="leading-relaxed">
                We bring talent, culture and creativity together through events, awards,
                programmes and everyday community — creating spaces where young people can be
                themselves, do their best work and be celebrated for it.
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl">
              <Image
                src="/sample/community.jpg"
                alt="The LADIRE community"
                width={760}
                height={520}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <Target className="h-7 w-7 text-crimson-600" aria-hidden="true" />
                <h3 className="mt-3 font-display font-extrabold text-navy-950">Our mission</h3>
                <p className="mt-1.5 text-sm text-navy-600">{c.mission}</p>
              </div>
              <div className="card p-5">
                <Eye className="h-7 w-7 text-olive-600" aria-hidden="true" />
                <h3 className="mt-3 font-display font-extrabold text-navy-950">Our vision</h3>
                <p className="mt-1.5 text-sm text-navy-600">{c.visionStatement}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we do */}
      {pillars.length ? (
        <section className="section bg-navy-50/60">
          <div className="container-x">
            <SectionHead
              eyebrow="What we do"
              title="Our promise to young people"
              sub="Six experiences run through everything we organise."
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map((p, i) => (
                <div key={p.title} className="card p-6">
                  <span className="font-display text-sm font-extrabold text-crimson-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-extrabold text-navy-950">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-600">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Values */}
      {values.length ? (
        <section className="section bg-white">
          <div className="container-x">
            <SectionHead
              align="center"
              eyebrow="Values"
              title="What we stand for"
            />
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div key={v.title} className="card card-hover p-6 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-crimson-600 to-flame-500 text-white">
                    <Heart className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-extrabold text-navy-950">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-navy-600">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Culture, creativity, youth development */}
      <section className="section bg-navy-950 text-white">
        <div className="container-x">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Palette className="h-8 w-8 text-flame-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl font-extrabold">Culture</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                We promote and preserve culture with pride — celebrating African identity,
                heritage and the modern expressions young people give it.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <Sparkles className="h-8 w-8 text-olive-300" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl font-extrabold">Creativity</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Music, art, design, film, fashion, content and ideas — we build platforms that
                let creativity be seen, shared and celebrated.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <TrendingUp className="h-8 w-8 text-gold-300" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl font-extrabold">Youth development</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Through learning, connection and recognition, we help young people grow in skill,
                confidence and opportunity.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-r from-crimson-800/40 to-navy-900 p-8 text-center">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Who we serve
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/80">
              Young people and young-at-heart creatives, learners, performers, makers and
              believers in culture — from Lagos and beyond — plus the parents, mentors and
              partners who support them.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/join" className="btn btn-flame btn-lg">
                Join the community <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/events" className="btn btn-outline-light btn-lg">
                See what we do
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

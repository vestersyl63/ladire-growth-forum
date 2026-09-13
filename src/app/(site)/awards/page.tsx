import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Trophy,
  CalendarDays,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

import {
  getPublicSiteSettings,
  getActiveAwardBundle,
  getVotingState,
  parseStringArray,
  parseValuesArray,
} from "@/lib/site";
import { fmtDate, fmtDateTime, formatNaira, toParagraphs } from "@/lib/utils";
import { parseJson } from "@/lib/settings";
import { SectionHead } from "@/components/marketing/head";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LADIRE Youth & Entertainment Awards 2026",
  description:
    "The LADIRE Youth & Entertainment Awards 2026 — where culture meets design. Explore categories, nominees, voting instructions, prices and deadlines.",
};

export default async function AwardsPage() {
  const [settings, bundle, voting] = await Promise.all([
    getPublicSiteSettings(),
    getActiveAwardBundle(),
    getVotingState(),
  ]);

  const award = bundle?.award ?? null;
  const categories = bundle?.categories ?? [];
  const faqs = parseJson<Array<{ q: string; a: string }>>(
    settings.awardsContent.faqs,
    []
  );
  const steps = parseStringArray(settings.awardsContent.instructions);
  const introParas = toParagraphs(settings.awardsContent.intro);
  const closed = voting.exists && voting.state === "closed";
  const notYet = voting.exists && voting.state === "not_yet_open";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div
          className="absolute -right-24 top-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle,#efaf0b,transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="container-x relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="eyebrow flex items-center gap-2 !text-gold-300">
              <Trophy className="h-4 w-4" aria-hidden="true" /> Flagship awards programme
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.04] sm:text-5xl">
              LADIRE Youth &amp; Entertainment Awards{" "}
              <span className="text-gold-300">2026</span>
            </h1>
            <p className="mt-3 font-display text-xl font-bold uppercase tracking-[0.1em] text-flame-300 sm:text-2xl">
              “Where Culture Meets Design.”
            </p>
            {introParas.length ? (
              <div className="mt-5 max-w-xl space-y-3 text-white/75">
                {introParas.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : null}

            {/* voting status banner */}
            <div className="mt-7 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
              {closed ? (
                <p className="flex items-center gap-2 font-semibold text-flame-300">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" /> Voting is currently closed.
                </p>
              ) : notYet ? (
                <p className="font-semibold text-white/90">
                  Voting opens {award?.votingOpensAt ? fmtDateTime(award.votingOpensAt) : "soon"}.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="chip bg-emerald-500 text-white">Voting is live</span>
                  <span className="text-sm font-semibold text-white/85">
                    {award?.pricePerVoteKobo
                      ? `Vote from ${formatNaira(award.pricePerVoteKobo)} per vote`
                      : "Price per vote to be announced"}
                  </span>
                  {award?.votingClosesAt ? (
                    <span className="text-sm text-white/70">Closes {fmtDateTime(award.votingClosesAt)}</span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/vote" className="btn btn-gold btn-lg">
                Vote Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#categories" className="btn btn-outline-light btn-lg">
                Browse categories & nominees
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
              <Image
                src={award?.imageUrl || "/sample/awards-hero.jpg"}
                alt="LADIRE Youth & Entertainment Awards 2026"
                width={760}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
            {award?.eventStartsAt || award?.venue ? (
              <div className="absolute inset-x-4 -bottom-6 rounded-2xl border border-white/15 bg-navy-900/95 p-4 shadow-2xl backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">The night</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-semibold text-white">
                  {award.eventStartsAt ? (
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-gold-300" aria-hidden="true" />
                      {fmtDate(award.eventStartsAt, "EEEE, d MMMM yyyy")}
                    </span>
                  ) : null}
                  {award.venue ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold-300" aria-hidden="true" />
                      {award.venue}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <div className="h-1.5 w-full">
          <div className="flex h-full w-full">
            <div className="flex-1 bg-crimson-600" />
            <div className="flex-1 bg-olive-600" />
            <div className="flex-1 bg-flame-500" />
            <div className="flex-1 bg-gold-400" />
            <div className="flex-1 bg-navy-600" />
          </div>
        </div>
      </section>

      {/* How voting works */}
      <section className="section bg-white">
        <div className="container-x">
          <SectionHead
            eyebrow="Voting guide"
            title="How voting works"
            sub="Voting at the LADIRE Awards is a paid, verified process. Read the steps — every vote counts only after approval."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={i} className="card relative p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-950 font-display text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-medium leading-relaxed text-navy-800">{s}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-400/10 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-navy-900">
              {settings.awardsContent.disclaimer ||
                "Votes are not counted until payment has been verified and approved by a LADIRE administrator. Uploading a receipt alone does not count a vote."}
            </p>
          </div>
        </div>
      </section>

      {/* Categories & nominees */}
      <section id="categories" className="section bg-navy-50/60">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="Categories & nominees"
              title="Award categories"
              sub="Nominees are published per category by the LADIRE team."
            />
            <Link href="/vote" className="btn btn-primary shrink-0">
              Go to voting <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {categories.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c, idx) => {
                const topNominee = c.nominees[0];
                return (
                  <article key={c.id} className="card card-hover flex flex-col overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-navy-100 bg-white p-5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-900 to-crimson-800 font-display text-base font-extrabold text-white">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-extrabold leading-tight text-navy-950">
                          {c.name}
                        </h3>
                        <p className="text-xs font-semibold text-navy-500">
                          {c.nomineeCount} nominee{c.nomineeCount === 1 ? "" : "s"}
                          {voting.showPublicCounts && !closed ? " • votes visible on the vote page" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 p-5">
                      {c.description ? (
                        <p className="line-clamp-3 text-sm text-navy-600">{c.description}</p>
                      ) : (
                        <p className="text-sm italic text-navy-400">Description coming soon.</p>
                      )}
                      {topNominee ? (
                        <div className="mt-4 flex items-center gap-3 rounded-xl bg-navy-50 p-3">
                          {topNominee.imageUrl ? (
                            <Image
                              src={topNominee.imageUrl}
                              alt=""
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
                            />
                          ) : (
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-extrabold text-white">
                              {topNominee.name.charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wide text-navy-400">Featured</p>
                            <p className="truncate font-semibold text-navy-900">
                              {topNominee.stageName || topNominee.name}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="border-t border-navy-100 p-4">
                      <Link
                        href={`/vote?category=${encodeURIComponent(c.id)}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-crimson-600 hover:text-crimson-800"
                      >
                        Vote in this category <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
              <Trophy className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-extrabold text-navy-900">
                No nominees have been published yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
                Nominees for the LADIRE Youth &amp; Entertainment Awards 2026 will appear here as
                soon as they are announced.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Event info / pricing / support */}
      <section className="section bg-white">
        <div className="container-x grid gap-6 lg:grid-cols-3">
          <div className="card p-6">
            <CalendarDays className="h-8 w-8 text-gold-500" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-navy-950">Important dates</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {award?.votingOpensAt ? (
                <div className="flex justify-between gap-3 border-b border-navy-100 pb-2">
                  <dt className="text-navy-500">Voting opens</dt>
                  <dd className="font-semibold text-navy-900">{fmtDateTime(award.votingOpensAt)}</dd>
                </div>
              ) : null}
              {award?.votingClosesAt ? (
                <div className="flex justify-between gap-3 border-b border-navy-100 pb-2">
                  <dt className="text-navy-500">Voting closes</dt>
                  <dd className="font-semibold text-navy-900">{fmtDateTime(award.votingClosesAt)}</dd>
                </div>
              ) : null}
              {award?.eventStartsAt ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-navy-500">Awards night</dt>
                  <dd className="font-semibold text-navy-900">{fmtDate(award.eventStartsAt, "d MMM yyyy")}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="card p-6">
            <Sparkles className="h-8 w-8 text-crimson-600" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-navy-950">Voting prices</h3>
            <p className="mt-2 text-sm text-navy-600">
              {award?.pricePerVoteKobo
                ? `1 vote = ${formatNaira(award.pricePerVoteKobo)}. Your total is calculated automatically on the voting page.`
                : "The voting price is set by the organisers and shown on the voting page."}
            </p>
            <Link href="/vote" className="btn btn-navy btn-md mt-4">
              See live prices & vote
            </Link>
          </div>

          <div className="card p-6">
            <HelpCircle className="h-8 w-8 text-olive-600" aria-hidden="true" />
            <h3 className="mt-3 font-display text-lg font-extrabold text-navy-950">Payment support</h3>
            <p className="mt-2 text-sm text-navy-600">{settings.awardsContent.supportNote}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              {settings.whatsapp ? (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip bg-[#25D366]/15 text-emerald-800"
                >
                  WhatsApp support
                </a>
              ) : null}
              {settings.emails[0] ? (
                <a href={`mailto:${settings.emails[0]}`} className="chip bg-navy-100 text-navy-800">
                  {settings.emails[0]}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {faqs.length ? (
        <section id="faqs" className="section bg-navy-50/60">
          <div className="container-x max-w-4xl">
            <SectionHead align="center" eyebrow="Good to know" title="Frequently asked questions" />
            <div className="mt-8 space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="card group open:shadow-md">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-display font-bold text-navy-950">
                    {f.q}
                    <span className="shrink-0 text-crimson-600 transition-transform group-open:rotate-45">＋</span>
                  </summary>
                  <div className="border-t border-navy-100 px-5 py-4">
                    <p className="text-sm leading-relaxed text-navy-700">{f.a}</p>
                  </div>
                </details>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-navy-500">
              More questions? Read the{" "}
              <Link href="/voting-terms" className="font-bold text-crimson-600 underline">Voting Terms</Link> or{" "}
              <Link href="/contact" className="font-bold text-crimson-600 underline">contact the team</Link>.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}

import Link from "next/link";
import Image from "next/image";
import {
  GraduationCap,
  Users,
  Lightbulb,
  Puzzle,
  TrendingUp,
  Trophy,
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
  Megaphone,
  ChevronRight,
  Music2,
  Gamepad2,
  Sun,
} from "lucide-react";
import type { Metadata } from "next";

import { SectionHead } from "@/components/marketing/head";
import { EventCard, categoryLabel } from "@/components/marketing/event-card";
import { Countdown } from "@/components/marketing/countdown";
import { LogoMark } from "@/components/brand/logo";
import {
  getPublicSiteSettings,
  getPublishedEvents,
  getPublishedAnnouncements,
  getActiveAwardBundle,
  getVotingState,
  parseValuesArray,
} from "@/lib/site";
import { getActiveHomeBanners } from "@/lib/banners";
import { fmtDate, fmtDateTime, formatNaira } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "LADIRE Growth Forum — Building Youth. Promoting Culture. Celebrating Creativity.",
  description:
    "LADIRE Growth Forum is a youth-focused community where young people learn, connect, create, collaborate, grow and are recognised. Discover events, the Daytime Hangout and the LADIRE Youth & Entertainment Awards 2026.",
};

const PILLARS = [
  { icon: GraduationCap, title: "Learn", text: "Workshops, training and mentorship that build real skills and confidence." },
  { icon: Users, title: "Connect", text: "A growing community of young creatives, professionals and enthusiasts." },
  { icon: Lightbulb, title: "Create", text: "Spaces and platforms for music, art, design, content and expression." },
  { icon: Puzzle, title: "Collaborate", text: "Work together on projects, events, campaigns and big ideas." },
  { icon: TrendingUp, title: "Grow", text: "Support that helps members develop personally and professionally." },
  { icon: Trophy, title: "Be recognised", text: "Awards, showcases and platforms that celebrate outstanding young talent." },
];

export default async function HomePage() {
  const [settings, banners, events, announcements, voting] = await Promise.all([
    getPublicSiteSettings(),
    getActiveHomeBanners(),
    getPublishedEvents({ upcomingOnly: false, limit: 6 }),
    getPublishedAnnouncements(3),
    getVotingState(),
  ]);

  const c = settings.content;
  const heroBanner = banners.find((b) => b.ctaLabel) ?? banners[0];

  const upcoming = [...events]
    .filter((e) => e.status !== "CANCELLED" && new Date(e.startsAt).getTime() >= Date.now() - 86_400_000)
    .slice(0, 6);

  const hangoutEvent = events.find((e) => e.category === "DAYTIME_HANGOUT");
  const vacationEvent = events.find((e) => e.category === "VACATION_PROGRAMME");

  const countdownTarget = voting.exists ? voting.closesAt : null;
  const showCountdown =
    voting.exists &&
    voting.state === "opened" &&
    !!countdownTarget &&
    countdownTarget.getTime() > Date.now();

  const heroTitle = heroBanner?.title || "Building Youth. Promoting Culture. Celebrating Creativity.";
  const heroSub =
    heroBanner?.subtitle ||
    c.homeIntro ||
    "Our vision is to create a community where young people can learn, connect, create, collaborate, grow — and be recognised.";
  const heroCta = heroBanner?.ctaLabel ? { label: heroBanner.ctaLabel, href: heroBanner.ctaHref || "/vote" } : null;
  const heroImage = heroBanner?.imageUrl;

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div
          className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #b70515, transparent 65%)" }}
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-44 -left-32 h-[460px] w-[460px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, #8fae1a, transparent 65%)" }}
          aria-hidden="true"
        />
        <div className="container-x relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="eyebrow flex items-center gap-2 !text-flame-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              LADIRE GROWTH FORUM
            </p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
              {heroTitle.split(".").map((part, i, arr) =>
                part.trim() ? (
                  <span key={part} className="block">
                    {i === 0 ? (
                      <span className="bg-gradient-to-r from-flame-400 via-gold-300 to-olive-300 bg-clip-text text-transparent">
                        {part.trim()}.
                      </span>
                    ) : (
                      <span className="text-white">{part.trim()}.</span>
                    )}
                  </span>
                ) : null
              )}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              {heroSub}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/vote" className="btn btn-primary btn-lg">
                Vote Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/awards" className="btn btn-outline-light btn-lg">
                Explore the Awards
              </Link>
              {heroCta ? (
                <Link href={heroCta.href} className="btn btn-gold btn-lg">
                  {heroCta.label}
                </Link>
              ) : null}
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold text-white/60">
              {["Learn", "Connect", "Create", "Collaborate", "Grow", "Be Recognised"].map((w) => (
                <span key={w} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-olive-400" aria-hidden="true" />
                  {w}
                </span>
              ))}
            </p>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up lg:max-w-none">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              {heroImage ? (
                <Image
                  src={heroImage}
                  alt=""
                  width={880}
                  height={660}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src="/sample/awards-hero.jpg"
                  alt="LADIRE Youth & Entertainment Awards 2026 — where culture meets design"
                  width={880}
                  height={660}
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-300">
                    LADIRE Youth &amp; Entertainment Awards 2026
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-white">
                    &ldquo;Where Culture Meets Design.&rdquo;
                  </p>
                  {voting.exists && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      {showCountdown && countdownTarget ? (
                        <Countdown target={countdownTarget} liveLabel="Voting ends in" />
                      ) : (
                        <p className="text-sm font-semibold text-white/85">
                          {voting.state === "closed"
                            ? "Voting is currently closed."
                            : voting.state === "not_yet_open"
                              ? "Voting opens soon."
                              : voting.pricePerVoteKobo
                                ? `Vote from ${formatNaira(voting.pricePerVoteKobo)} per vote`
                                : "Voting powered by the community."}
                        </p>
                      )}
                      <Link href="/vote" className="btn btn-gold btn-sm">
                        Vote now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Floating logo badge */}
            <div className="absolute -left-3 -top-5 animate-float sm:-left-6">
              <LogoMark className="h-20 w-20 shadow-xl ring-4 ring-navy-950/40 sm:h-24 sm:w-24" />
            </div>
          </div>
        </div>

        {/* bottom colour band */}
        <div className="h-1.5 w-full" aria-hidden="true">
          <div className="flex h-full w-full">
            <div className="flex-1 bg-crimson-600" />
            <div className="flex-1 bg-olive-600" />
            <div className="flex-1 bg-flame-500" />
            <div className="flex-1 bg-gold-400" />
            <div className="flex-1 bg-navy-600" />
          </div>
        </div>
      </section>

      {/* ================= ABOUT STRIP ================= */}
      <section className="section bg-white">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Who we are</p>
            <h2 className="section-title">A movement for young people, culture and creativity.</h2>
            <div className="prose-sm mt-5">
              {String(c.aboutSummary || "").split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/about" className="btn btn-navy">
                About LADIRE <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/join" className="btn btn-outline">
                Join the community
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-navy-100 shadow-lg">
              <Image
                src="/sample/community.jpg"
                alt="Young people in the LADIRE community"
                width={800}
                height={640}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-navy-100 sm:-right-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-600 text-white">
                  <Trophy className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <p className="font-display text-sm font-extrabold text-navy-950">Recognition</p>
                  <p className="text-xs text-navy-500">for outstanding young talent</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= OUR VISION ================= */}
      <section className="section bg-navy-50/60">
        <div className="container-x">
          <SectionHead
            align="center"
            eyebrow="Our vision"
            title="One community. Six ways to grow."
            sub="Everything LADIRE does is built around helping young people grow and be recognised."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p, i) => (
              <div
                key={p.title}
                className="card group p-6 transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-900 to-navy-700 text-white shadow-sm transition-transform group-hover:scale-110">
                  <p.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy-950">
                  {String(i + 1).padStart(2, "0")} — {p.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-600">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= UPCOMING EVENTS ================= */}
      <section className="section bg-white">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="What’s happening"
              title="Upcoming events & activities"
              sub="Workshops, hangouts, programmes and more — find your next LADIRE experience."
            />
            <Link href="/events" className="btn btn-ghost shrink-0">
              View all events <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {upcoming.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((ev) => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-navy-200 bg-navy-50/50 p-10 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-bold text-navy-900">No upcoming events at the moment</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
                New events are added regularly. Follow LADIRE on social media or check back soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= AWARDS 2026 MAJOR PROMO ================= */}
      <section id="awards" className="relative overflow-hidden bg-navy-950 py-16 text-white sm:py-20">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div className="container-x relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow !text-gold-300">Flagship awards programme</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              LADIRE Youth &amp; Entertainment Awards{" "}
              <span className="text-gold-300">2026</span>
            </h2>
            <p className="mt-2 font-display text-lg font-bold uppercase tracking-[0.12em] text-flame-300">
              “Where Culture Meets Design.”
            </p>

            <p className="mt-5 max-w-xl leading-relaxed text-white/75">
              {String(settings.awardsContent.intro || "").slice(0, 320)}
              …
            </p>

            <dl className="mt-7 space-y-3 text-sm">
              {voting.exists && voting.award.eventStartsAt ? (
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-olive-300" aria-hidden="true" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/50">Awards night</dt>
                    <dd className="font-semibold">{fmtDate(voting.award.eventStartsAt, "EEEE, d MMMM yyyy")}</dd>
                  </div>
                </div>
              ) : null}
              {voting.exists && voting.award.venue ? (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-olive-300" aria-hidden="true" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/50">Venue</dt>
                    <dd className="font-semibold">{voting.award.venue}</dd>
                  </div>
                </div>
              ) : null}
              {voting.exists && voting.closesAt ? (
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-olive-300" aria-hidden="true" />
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-white/50">Voting closes</dt>
                    <dd className="font-semibold">{fmtDateTime(voting.closesAt)}</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vote" className="btn btn-gold btn-lg">
                Vote Now
              </Link>
              <Link href="/awards" className="btn btn-outline-light btn-lg">
                View Nominees & Categories
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
              <Image
                src="/sample/awards-hero.jpg"
                alt="LADIRE Youth & Entertainment Awards 2026 artwork"
                width={760}
                height={620}
                className="h-full w-full object-cover"
              />
            </div>
            {showCountdown && countdownTarget ? (
              <div className="absolute inset-x-4 -bottom-7 rounded-2xl border border-white/15 bg-navy-900/95 p-4 shadow-2xl backdrop-blur">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Voting closes in
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Countdown target={countdownTarget} liveLabel="Don’t wait — every vote counts." />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ================= DAYTIME HANGOUT + VACATION ================= */}
      <section className="section bg-white">
        <div className="container-x">
          <SectionHead
            eyebrow="Signature programmes"
            title="Ways to show up with LADIRE"
            sub="Two of our most loved community experiences — come hang out, or keep the young ones learning all holiday."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Daytime Hangout */}
            <article className="card card-hover group overflow-hidden">
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={hangoutEvent?.imageUrl || "/sample/daytime-hangout.jpg"}
                  alt="LADIRE Daytime Hangout"
                  width={760}
                  height={420}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="chip absolute left-4 top-4 bg-flame-500 text-white">
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" /> Daytime Hangout
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-extrabold text-navy-950">LADIRE Daytime Hangout</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">
                  {String(c.daytimeHangout || "")}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-navy-500">
                  <span className="chip bg-navy-100 text-navy-700"><Music2 className="h-3.5 w-3.5" /> Music & vibes</span>
                  <span className="chip bg-navy-100 text-navy-700"><Gamepad2 className="h-3.5 w-3.5" /> Games & fun</span>
                  <span className="chip bg-navy-100 text-navy-700"><Users className="h-3.5 w-3.5" /> Community</span>
                </div>
                {hangoutEvent ? (
                  <div className="mt-4 text-sm text-navy-700">
                    <p className="flex items-center gap-2 font-semibold">
                      <CalendarDays className="h-4 w-4 text-flame-600" aria-hidden="true" />
                      {fmtDate(hangoutEvent.startsAt, "EEE, d MMM yyyy")} • {hangoutEvent.venue || "Venue TBA"}
                    </p>
                  </div>
                ) : null}
                <div className="mt-5 flex gap-3">
                  <Link href="/events/daytime-hangout" className="btn btn-flame btn-md">
                    Hangout details & registration
                  </Link>
                </div>
              </div>
            </article>

            {/* Vacation programme */}
            <article className="card card-hover group overflow-hidden">
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={vacationEvent?.imageUrl || "/sample/vacation-programme.jpg"}
                  alt="LADIRE Vacation / Holiday Programme"
                  width={760}
                  height={420}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="chip absolute left-4 top-4 bg-olive-600 text-white">
                  Vacation / Holiday Programme
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-extrabold text-navy-950">
                  Vacation / Holiday Programme
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">
                  {String(c.vacationProgramme || "")}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-navy-500">
                  <span className="chip bg-navy-100 text-navy-700"><Lightbulb className="h-3.5 w-3.5" /> Skills & creativity</span>
                  <span className="chip bg-navy-100 text-navy-700"><Sparkles className="h-3.5 w-3.5" /> Supervised fun</span>
                </div>
                <div className="mt-5 flex gap-3">
                  <Link href="/events/vacation-programme" className="btn btn-olive btn-md">
                    Programme details & booking
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ================= ANNOUNCEMENTS ================= */}
      <section className="section bg-navy-50/60">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="Newsroom"
              title="Latest announcements"
              sub="Stay in the loop — news, updates and notices from the LADIRE team."
            />
            <Link href="/news" className="btn btn-ghost shrink-0">
              All announcements <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {announcements.length > 0 ? (
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {announcements.map((a) => (
                <Link
                  key={a.id}
                  href={`/news/${a.slug}`}
                  className="card card-hover group flex flex-col p-5"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-navy-500">
                    <Megaphone className="h-3.5 w-3.5 text-crimson-600" aria-hidden="true" />
                    {fmtDate(a.publishedAt)}
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold leading-snug text-navy-950 group-hover:text-crimson-700">
                    {a.title}
                  </h3>
                  {a.excerpt ? (
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-navy-600">{a.excerpt}</p>
                  ) : null}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-crimson-600">
                    Read more <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border-2 border-dashed border-navy-200 bg-white p-10 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-navy-300" aria-hidden="true" />
              <h3 className="mt-3 font-display text-lg font-bold text-navy-900">There are no announcements currently</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-navy-600">
                Check back soon for news from LADIRE Growth Forum.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= JOIN BAND ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-crimson-700 via-crimson-600 to-flame-600 py-16 text-white">
        <div className="absolute inset-0 bg-pattern-dots opacity-60" aria-hidden="true" />
        <div className="container-x relative flex flex-col items-center text-center">
          <p className="eyebrow !text-white/85">Join the community</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-extrabold sm:text-4xl">
            Come as you are. Leave as part of something bigger.
          </h2>
          <p className="mt-4 max-w-2xl text-white/85">
            Whether you create, learn, volunteer or simply believe in young talent — there is a place
            for you in the LADIRE family.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/join" className="btn bg-white text-crimson-700 hover:bg-navy-50 btn-lg">
              Join LADIRE — it’s free
            </Link>
            <Link href="/contact" className="btn btn-outline-light btn-lg">
              Talk to the team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

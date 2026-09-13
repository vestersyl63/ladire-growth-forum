import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPublicSiteSettings } from "@/lib/site";
import { votingOpenCheck } from "@/lib/awards";
import { fmtDateTime, formatNaira } from "@/lib/utils";
import {
  CategoryTabs,
  NomineeVoteCard,
  type WizardCategory,
} from "@/components/vote/vote-wizard";
import { VoteExplorer } from "@/components/vote/vote-explorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vote — LADIRE Youth & Entertainment Awards 2026",
  description:
    "Vote for your favourite nominees in the LADIRE Youth & Entertainment Awards 2026. Paid, verified voting — votes are counted after payment approval.",
};

export default async function VotePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const preselect =
    typeof sp.category === "string" && sp.category.length ? sp.category : null;

  const [settings, session] = await Promise.all([getPublicSiteSettings(), getSession()]);

  const award = await prisma.award.findFirst({
    where: { isActive: true, isPublished: true },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.awardCategory.findMany({
    where: { isPublished: true, ...(award ? { awardId: award.id } : {}) },
    orderBy: { sortOrder: "asc" },
    include: {
      nominees: { where: { isPublished: true }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] },
    },
  });

  const nominated = categories.flatMap((c) => c.nominees).length;

  // Per-category voting availability (server-side window check).
  const catMeta = new Map<
    string,
    { open: boolean; reason?: string; pricePerVoteKobo: number | null; minVotes: number; maxVotes: number }
  >();
  if (award) {
    for (const c of categories) {
      const check = votingOpenCheck(c, award);
      catMeta.set(c.id, {
        open: check.open,
        reason: check.reason,
        pricePerVoteKobo: check.config.pricePerVoteKobo,
        minVotes: award.minVotesPerTx,
        maxVotes: award.maxVotesPerTx,
      });
    }
  }

  const wizardCategories: WizardCategory[] = categories.map((c) => {
    const m = catMeta.get(c.id);
    return {
      id: c.id,
      name: c.name,
      open: m?.open ?? false,
      reason: m?.reason,
      pricePerVoteKobo: m?.pricePerVoteKobo ?? null,
      minVotes: m?.minVotes ?? 1,
      maxVotes: m?.maxVotes ?? 500,
    };
  });

  const showCounts = award?.showPublicVoteCounts ?? false;
  const signedIn = Boolean(session?.user?.id);
  const resultsPublic =
    award && (award.resultsStatus === "LIVE" || award.resultsStatus === "FINAL");
  const resultsFinal = award?.resultsStatus === "FINAL";

  const bank = {
    bankName: settings.bank.name,
    accountName: settings.bank.accountName,
    accountNumber: settings.bank.accountNumber,
    instructions: settings.bank.instructions,
    whatsapp: settings.whatsapp,
  };

  return (
    <>
      {/* Page header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-crimson-950 py-12 text-white sm:py-14">
        <div className="absolute inset-0 bg-pattern-dots" aria-hidden="true" />
        <div className="container-x relative">
          <p className="eyebrow !text-gold-300">LADIRE Youth &amp; Entertainment Awards 2026</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">Vote</h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Pick your favourites, buy votes, pay by bank transfer and we verify.{" "}
            <strong className="text-white">Votes are counted only after payment is approved.</strong>
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Nominees listed</p>
              <p className="font-display text-xl font-extrabold text-white">{nominated}</p>
            </div>
            {award?.pricePerVoteKobo ? (
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Vote price</p>
                <p className="font-display text-xl font-extrabold text-white">
                  {formatNaira(award.pricePerVoteKobo)}
                  <span className="text-sm font-bold text-white/60"> / vote</span>
                </p>
              </div>
            ) : null}
            {award?.votingClosesAt ? (
              <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Voting closes</p>
                <p className="font-display text-base font-extrabold text-white">
                  {fmtDateTime(award.votingClosesAt)}
                </p>
              </div>
            ) : null}
          </div>
          <p className="mt-5 max-w-2xl rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-white/60">
            {settings.awardsContent.disclaimer}
          </p>
        </div>
      </section>

      <section className="section bg-navy-50/60">
        <div className="container-x">
          {award ? (
            <VoteExplorer
              categories={wizardCategories}
              nomineesMap={Object.fromEntries(
                categories.map((c) => [
                  c.id,
                  c.nominees.map((n) => ({
                    id: n.id,
                    name: n.name,
                    stageName: n.stageName,
                    bio: n.bio,
                    imageUrl: n.imageUrl,
                    officialVotes: n.officialVotes,
                    categoryId: n.categoryId,
                    isFeatured: n.isFeatured,
                  })),
                ])
              )}
              showCounts={showCounts}
              signedIn={signedIn}
              bank={bank}
              preselectCategory={preselect}
              resultsPublic={!!resultsPublic}
              resultsFinal={resultsFinal}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-navy-200 bg-white p-12 text-center">
              <SearchX className="mx-auto h-12 w-12 text-navy-300" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl font-extrabold text-navy-900">
                Voting has not been opened yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-navy-600">
                Nominees and voting will appear here as soon as the LADIRE Awards 2026 programme is
                launched.
              </p>
              <Link href="/news" className="btn btn-navy btn-md mt-6">
                Follow announcements
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Terms shortcut */}
      <section className="border-t border-navy-100 bg-white py-10">
        <div className="container-x flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-extrabold text-navy-950">Read before you vote</h2>
            <p className="mt-1 max-w-xl text-sm text-navy-600">
              See the full Voting Terms & Conditions, payment verification policy and deadline rules.
            </p>
          </div>
          <Link href="/voting-terms" className="btn btn-outline">Voting terms & conditions</Link>
        </div>
      </section>
    </>
  );
}

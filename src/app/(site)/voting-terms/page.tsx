import type { Metadata } from "next";
import Link from "next/link";

import { getPublicSiteSettings, parseStringArray } from "@/lib/site";
import { toParagraphs } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voting Terms & Conditions",
  description:
    "Voting terms and conditions for the LADIRE Youth & Entertainment Awards 2026 — rules, verification policy, deadlines and more.",
};

export default async function VotingTermsPage() {
  const settings = await getPublicSiteSettings();
  const legal = settings.legal;
  const steps = parseStringArray(settings.awardsContent.instructions);
  const paragraphs = toParagraphs(legal.votingTerms || legal.votingTerms);

  return (
    <>
      <section className="bg-navy-950 py-12 text-white">
        <div className="container-x max-w-3xl">
          <p className="eyebrow !text-gold-300">Legal & fairness</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
            Voting Terms &amp; Conditions
          </h1>
          <p className="mt-3 text-white/70">
            LADIRE Youth &amp; Entertainment Awards 2026 — paid, verified voting.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x max-w-3xl space-y-10">
          <div className="flex items-start gap-3 rounded-2xl border border-gold-300 bg-gold-400/10 p-4">
            <p className="text-sm font-semibold text-navy-900">
              {settings.awardsContent.disclaimer ||
                "Votes are not counted until payment has been verified and approved by a LADIRE administrator."}
            </p>
          </div>

          <div>
            <h2 className="h-display text-xl font-extrabold">The voting process</h2>
            <ol className="mt-4 space-y-2">
              {steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-navy-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-[11px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="prose-sm">
            <h2 className="h-display text-xl font-extrabold">Terms and conditions</h2>
            {paragraphs.length ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p className="italic text-navy-500">
                The organisation’s final voting terms will appear here. Please check back, or
                contact LADIRE for a copy.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-navy-100 bg-navy-50/60 p-5 text-sm text-navy-700">
            Questions about the voting process?{" "}
            <Link href="/contact" className="font-bold text-crimson-600 underline">Contact us</Link> or{" "}
            <Link href="/vote" className="font-bold text-crimson-600 underline">go back to voting</Link>.
          </div>
        </div>
      </section>
    </>
  );
}

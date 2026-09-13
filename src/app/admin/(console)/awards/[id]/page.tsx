import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, toLocalInputValue, formatNaira } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { AwardForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit award", robots: { index: false } };

export default async function AdminAwardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const award = await prisma.award.findUnique({
    where: { id },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { nominees: true } } },
      },
    },
  });
  if (!award) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/awards" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to awards
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl font-extrabold text-navy-950">{award.title}</h1>
            <StatusPill status={award.isPublished ? "PUBLISHED" : "DRAFT"} />
          </div>
          <p className="mt-1 text-sm text-navy-500">/{award.slug}</p>
        </div>
        <Link href={`/admin/nominees/${award.id}`} className="btn btn-primary btn-md">
          Manage categories & nominees <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr><th>Category</th><th>Nominees</th><th>Voting</th><th>Price/vote</th><th>Window</th><th>Status</th></tr>
          </thead>
          <tbody>
            {award.categories.map((c) => (
              <tr key={c.id}>
                <td className="font-semibold text-navy-900">{c.name}</td>
                <td>{c._count.nominees}</td>
                <td>{c.isVotingEnabled ? "Enabled" : "Off"}</td>
                <td>{c.pricePerVoteKobo ? formatNaira(c.pricePerVoteKobo) : (award.pricePerVoteKobo ? `${formatNaira(award.pricePerVoteKobo)} (default)` : "—")}</td>
                <td className="whitespace-nowrap text-xs">
                  {c.votingOpensAt ? fmtDateTime(c.votingOpensAt, "d MMM") : "Default"} → {c.votingClosesAt ? fmtDateTime(c.votingClosesAt, "d MMM") : "Default"}
                </td>
                <td><StatusPill status={c.isPublished ? "PUBLISHED" : "DRAFT"} /></td>
              </tr>
            ))}
            {award.categories.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-sm text-navy-500">No categories yet — add them from the Nominees area.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <div className="card max-w-4xl p-6">
        <h2 className="font-display text-lg font-extrabold text-navy-950">Voting &amp; awards-night configuration</h2>
        <p className="mt-1 text-xs text-navy-400">
          Server-enforced during voting. Editing closes or opens the window for new orders immediately.
        </p>
        <div className="mt-5">
          <AwardForm
            initial={{
              id: award.id,
              title: award.title,
              tagline: award.tagline,
              description: award.description,
              imageUrl: award.imageUrl,
              venue: award.venue,
              eventStartsAt: award.eventStartsAt,
              eventEndsAt: award.eventEndsAt,
              votingOpensAt: award.votingOpensAt,
              votingClosesAt: award.votingClosesAt,
              pricePerVoteKobo: award.pricePerVoteKobo,
              minVotesPerTx: award.minVotesPerTx,
              maxVotesPerTx: award.maxVotesPerTx,
              allowMultipleTx: award.allowMultipleTx,
              showPublicVoteCounts: award.showPublicVoteCounts,
              resultsStatus: award.resultsStatus,
              allowLateSubmissions: award.allowLateSubmissions,
              isActive: award.isActive,
              isPublished: award.isPublished,
            }}
          />
        </div>
      </div>
    </div>
  );
}

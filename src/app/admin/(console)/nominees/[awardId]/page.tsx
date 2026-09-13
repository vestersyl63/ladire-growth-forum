import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Settings2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/user/status-pill";
import { CategoryCreate, CategoryEdit } from "@/components/admin/admin-forms";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fb } from "@/lib/form-action";
import { deleteCategory } from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories & nominees", robots: { index: false } };

export default async function AdminNomineesAwardPage({ params }: { params: Promise<{ awardId: string }> }) {
  const { awardId } = await params;
  const award = await prisma.award.findUnique({
    where: { id: awardId },
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
          <Link href="/admin/nominees" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All editions
          </Link>
          <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">{award.title}</h1>
          <p className="text-sm text-navy-500">Categories &amp; nominees for this programme.</p>
        </div>
        <Link href={`/admin/awards/${award.id}`} className="btn btn-outline btn-md">
          <Settings2 className="h-4 w-4" aria-hidden="true" /> Voting settings
        </Link>
      </header>

      <div className="card max-w-3xl p-5">
        <CategoryCreate awardId={award.id} />
      </div>

      <div className="space-y-4">
        {award.categories.map((c) => (
          <section key={c.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-navy-950">{c.name}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-navy-500">
                  <StatusPill status={c.isPublished ? "PUBLISHED" : "DRAFT"} />
                  <span className="chip bg-navy-100 text-navy-600">{c.isVotingEnabled ? "Voting enabled" : "Voting off"}</span>
                  <span className="text-xs">{c._count.nominees} nominee{c._count.nominees === 1 ? "" : "s"}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/nominees/${award.id}/categories/${c.id}`} className="btn btn-primary btn-sm">
                  Manage nominees <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {c._count.nominees === 0 ? (
                  <ConfirmForm action={fb(deleteCategory, c.id)} message={`Delete category “${c.name}”?`}>
                    <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                  </ConfirmForm>
                ) : null}
              </div>
            </div>
            <details className="group mt-4">
              <summary className="cursor-pointer list-none text-sm font-bold text-crimson-600 hover:underline">
                <span className="group-open:hidden">Edit category details</span>
                <span className="hidden group-open:inline">Hide category editor</span>
              </summary>
              <div className="mt-3">
                <CategoryEdit
                  initial={{
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    isPublished: c.isPublished,
                    isVotingEnabled: c.isVotingEnabled,
                    pricePerVoteKobo: c.pricePerVoteKobo,
                    votingOpensAt: c.votingOpensAt,
                    votingClosesAt: c.votingClosesAt,
                    nomineeLimit: c.nomineeLimit,
                  }}
                />
              </div>
            </details>
          </section>
        ))}
        {award.categories.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-200 p-8 text-center text-sm text-navy-500">
            Add the first category above — e.g. “Best Emerging Artiste”.
          </p>
        ) : null}
      </div>
    </div>
  );
}

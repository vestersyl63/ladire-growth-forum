import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { AwardCreateForm } from "@/components/admin/award-create-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Awards programme", robots: { index: false } };

export default async function AdminAwardsPage() {
  const awards = await prisma.award.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { categories: { include: { _count: { select: { nominees: true } } } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Awards programme</h1>
        <p className="text-sm text-navy-500">
          Manage each awards edition — its voting rules, schedule and results visibility. Categories and nominees live under{" "}
          <Link href="/admin/nominees" className="font-semibold text-crimson-600 hover:underline">Nominees</Link>.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
              <Trophy className="h-5 w-5 text-gold-500" aria-hidden="true" /> Editions
            </h2>
            <div className="mt-3 space-y-3">
              {awards.map((a) => {
                const cats = a.categories.length;
                const nominees = a.categories.reduce((sum, c) => sum + c._count.nominees, 0);
                return (
                  <article key={a.id} className="rounded-xl border border-navy-100 p-4 transition-colors hover:border-navy-300">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-extrabold text-navy-900">
                          {a.isActive ? "★ " : ""}{a.title}
                        </p>
                        <p className="text-xs text-navy-400">
                          {a.slug} · created {fmtDate(a.createdAt)}
                        </p>
                      </div>
                      <StatusPill status={a.isPublished ? "PUBLISHED" : "DRAFT"} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold text-navy-600">
                      <span className="chip bg-navy-100 text-navy-700">{cats} categor{cats === 1 ? "y" : "ies"}</span>
                      <span className="chip bg-navy-100 text-navy-700">{nominees} nominees</span>
                      <span className="chip bg-navy-100 text-navy-700">{a.isActive ? "Active" : "Inactive"}</span>
                      <span className="chip bg-navy-100 text-navy-700">Results {a.resultsStatus}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/awards/${a.id}`} className="btn btn-ghost btn-sm">Edit settings</Link>
                      <Link href={`/admin/nominees/${a.id}`} className="btn btn-outline btn-sm">Categories & nominees <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" /></Link>
                    </div>
                  </article>
                );
              })}
              {awards.length === 0 ? (
                <p className="rounded-xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-500">
                  No awards programmes yet. Create one below.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="card h-fit p-5">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Create an edition</h2>
          <p className="mt-1 text-xs text-navy-400">
            New editions start unpublished and inactive — publish once configured.
          </p>
          <div className="mt-4"><AwardCreateForm /></div>
        </section>
      </div>
    </div>
  );
}

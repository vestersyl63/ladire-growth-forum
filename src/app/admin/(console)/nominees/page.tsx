import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FolderTree } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nominees", robots: { index: false } };

export default async function AdminNomineesIndexPage() {
  const awards = await prisma.award.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    include: { categories: { include: { _count: { select: { nominees: true } } } } },
  });

  const totalNominees = awards.reduce((sum, a) => sum + a.categories.reduce((s, c) => s + c._count.nominees, 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Nominees &amp; categories</h1>
        <p className="text-sm text-navy-500">
          Nominees belong to categories inside an awards programme. Pick an edition to manage its categories and nominees.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {awards.map((a) => {
          const cats = a.categories.length;
          const noms = a.categories.reduce((s, c) => s + c._count.nominees, 0);
          return (
            <Link
              key={a.id}
              href={`/admin/nominees/${a.id}`}
              className="card group flex flex-col gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-400">
                  <FolderTree className="h-5 w-5" aria-hidden="true" />
                </span>
                {a.isActive ? <span className="chip bg-emerald-100 text-emerald-800">Active</span> : null}
              </div>
              <div>
                <p className="font-display text-lg font-extrabold leading-tight text-navy-950 group-hover:text-crimson-600">{a.title}</p>
                <p className="mt-1 text-sm text-navy-500">{cats} categor{cats === 1 ? "y" : "ies"} · {noms} nominee{noms === 1 ? "" : "s"}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-crimson-600">
                Manage <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-navy-400">Total across all editions: {totalNominees} nominees.</p>
      {awards.length === 0 ? (
        <div className="card p-10 text-center text-sm text-navy-500">
          No awards programme yet — create one under{" "}
          <Link href="/admin/awards" className="font-semibold text-crimson-600 hover:underline">Awards programme</Link> first.
        </div>
      ) : null}
    </div>
  );
}

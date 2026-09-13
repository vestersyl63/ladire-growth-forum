import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/user/status-pill";
import { NomineeForm } from "@/components/admin/admin-forms";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fa, fb } from "@/lib/form-action";
import {
  moveNominee,
  toggleNomineeFlag,
  deleteNominee,
} from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Category nominees", robots: { index: false } };

type Socials = { instagram?: string; tiktok?: string; x?: string; facebook?: string; youtube?: string };

export default async function AdminCategoryPage({
  params,
}: {
  params: Promise<{ awardId: string; categoryId: string }>;
}) {
  const { awardId, categoryId } = await params;
  const category = await prisma.awardCategory.findUnique({
    where: { id: categoryId },
    include: {
      award: true,
      nominees: { orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] },
    },
  });
  if (!category || category.awardId !== awardId) notFound();

  const sumVotes = category.nominees.reduce((s, n) => s + n.officialVotes, 0);

  return (
    <div className="space-y-6">
      <header>
        <Link href={`/admin/nominees/${awardId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {category.award.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-navy-950">{category.name}</h1>
          <StatusPill status={category.isPublished ? "PUBLISHED" : "DRAFT"} />
        </div>
        <p className="mt-1 text-sm text-navy-500">
          {category.nominees.length} nominee{category.nominees.length === 1 ? "" : "s"} · {sumVotes.toLocaleString()} verified votes · order by list position
        </p>
      </header>

      <div className="card max-w-3xl p-5">
        <h2 className="font-display text-lg font-extrabold text-navy-950">Add nominee</h2>
        <p className="mt-1 text-xs text-navy-400">
          Only add real, verifiable individuals or groups. Profiles are public once published.
        </p>
        <div className="mt-4"><NomineeForm categoryId={category.id} /></div>
      </div>

      <div className="space-y-3">
        {category.nominees.map((n, i) => (
          <article key={n.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div className="flex shrink-0 flex-col items-center gap-1">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-navy-100 text-lg font-black text-navy-600">
                {n.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (n.stageName || n.name).slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="text-[11px] font-bold text-navy-400">#{i + 1}</span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-extrabold leading-tight text-navy-950">
                {n.stageName || n.name}
                {n.stageName ? <span className="ml-2 text-sm font-semibold text-navy-400">({n.name})</span> : null}
                {n.isFeatured ? <span className="chip ml-2 bg-gold-100 text-gold-800">Featured</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-navy-500">{n.officialVotes.toLocaleString()} verified votes</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ConfirmForm
                  action={fb(toggleNomineeFlag, n.id, "isPublished")}
                  message={n.isPublished ? `Hide ${n.stageName || n.name} from the public category?` : `Publish ${n.stageName || n.name}?`}
                >
                  <button type="submit" className="btn btn-ghost btn-sm">
                    <StatusPill status={n.isPublished ? "PUBLISHED" : "DRAFT"} />
                  </button>
                </ConfirmForm>
                <form action={fa(toggleNomineeFlag, n.id, "isFeatured")}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    {n.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                </form>
                <form action={fa(moveNominee, category.id, n.id, "up")}>
                  <button type="submit" disabled={i === 0} aria-label="Move up" className="btn btn-ghost btn-sm" title="Move up">
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
                <form action={fa(moveNominee, category.id, n.id, "down")}>
                  <button type="submit" disabled={i === category.nominees.length - 1} aria-label="Move down" className="btn btn-ghost btn-sm" title="Move down">
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
                <ConfirmForm
                  action={fb(deleteNominee, n.id)}
                  message={`Delete ${n.stageName || n.name}? Verified votes for this nominee will stay on record but the profile is removed.`}
                >
                  <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                </ConfirmForm>
              </div>
            </div>

            <details className="group w-full">
              <summary className="cursor-pointer list-none text-sm font-bold text-crimson-600 hover:underline">
                <span className="group-open:hidden">Edit profile</span>
                <span className="hidden group-open:inline">Hide editor</span>
              </summary>
              <div className="mt-3 border-t border-navy-100 pt-3">
                <NomineeForm
                  categoryId={category.id}
                  initial={{
                    id: n.id,
                    name: n.name,
                    stageName: n.stageName,
                    bio: n.bio,
                    imageUrl: n.imageUrl,
                    isPublished: n.isPublished,
                    isFeatured: n.isFeatured,
                    socials: (n.socials as Socials | null) ?? undefined,
                  }}
                />
              </div>
            </details>
          </article>
        ))}
        {category.nominees.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy-200 p-8 text-center text-sm text-navy-500">
            No nominees in this category yet. Use the form above to add the first one.
          </p>
        ) : null}
      </div>
    </div>
  );
}

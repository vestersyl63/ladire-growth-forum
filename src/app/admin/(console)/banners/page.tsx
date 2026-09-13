import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/utils";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fa, fb } from "@/lib/form-action";
import { deleteBanner, toggleBanner } from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Homepage banners", robots: { index: false } };

export default async function AdminBannersPage() {
  const banners = await prisma.homepageBanner.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "desc" }] });
  const now = Date.now();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Homepage hero banners</h1>
          <p className="text-sm text-navy-500">
            The highest-priority banner that is active and inside its window drives the homepage hero.
          </p>
        </div>
        <Link href="/admin/banners/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" aria-hidden="true" /> New banner
        </Link>
      </header>

      <div className="space-y-3">
        {banners.map((b) => {
          const live = b.isActive && (!b.startAt || b.startAt.getTime() <= now) && (!b.endAt || b.endAt.getTime() >= now);
          return (
            <article key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-[10px] font-bold uppercase tracking-wide text-navy-400">No image</span>
                )}
                <div className="min-w-0">
                  <p className="font-display text-lg font-extrabold text-navy-950">{b.title}</p>
                  <p className="line-clamp-1 text-sm text-navy-500">{b.subtitle || "No subtitle"}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                    <span className={live ? "chip bg-emerald-100 text-emerald-800" : "chip bg-navy-100 text-navy-600"}>
                      {live ? "Live now" : "Not showing"}
                    </span>
                    Priority {b.priority} · {b.startAt ? fmtDateTime(b.startAt, "d MMM") : "No start"} → {b.endAt ? fmtDateTime(b.endAt, "d MMM") : "no end"}
                  </p>
                  {b.ctaLabel && b.ctaHref ? (
                    <p className="text-xs text-navy-400">CTA: <span className="font-semibold text-navy-700">{b.ctaLabel}</span> → {b.ctaHref}</p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <form action={fa(toggleBanner, b.id)}>
                  <button type="submit" className={`btn btn-sm ${b.isActive ? "btn-ghost text-crimson-600" : "btn-success"}`}>
                    {b.isActive ? "Deactivate" : "Activate"}
                  </button>
                </form>
                <Link href={`/admin/banners/${b.id}`} className="btn btn-outline btn-sm">Edit</Link>
                <ConfirmForm action={fb(deleteBanner, b.id)} message={`Delete banner “${b.title}”?`}>
                  <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                </ConfirmForm>
              </div>
            </article>
          );
        })}
        {banners.length === 0 ? (
          <p className="card p-10 text-center text-sm text-navy-500">No banners — create your first homepage hero.</p>
        ) : null}
      </div>
    </div>
  );
}

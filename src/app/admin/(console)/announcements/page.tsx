import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fa, fb } from "@/lib/form-action";
import { deleteAnnouncement, setAnnouncementStatus } from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Announcements", robots: { index: false } };

export default async function AdminAnnouncementsPage() {
  const items = await prisma.announcement.findMany({
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">News &amp; announcements</h1>
          <p className="text-sm text-navy-500">{items.length} shown</p>
        </div>
        <Link href="/admin/announcements/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" aria-hidden="true" /> New announcement
        </Link>
      </header>

      <div className="space-y-3">
        {items.map((a) => (
          <article key={a.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-navy-950">
                {a.isPinned ? <span className="chip bg-gold-100 text-gold-800">Pinned</span> : null}
                <Link href={`/admin/announcements/${a.id}`} className="hover:text-crimson-600">{a.title}</Link>
              </p>
              <p className="mt-0.5 line-clamp-1 text-sm text-navy-500">{a.excerpt || "No excerpt."}</p>
              <p className="mt-1 text-xs text-navy-400">
                {a.authorName ? `By ${a.authorName} · ` : ""}
                {a.publishedAt ? `Published ${fmtDate(a.publishedAt)}` : "Draft"} · /{a.slug}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {a.status === "DRAFT" ? (
                <form action={fa(setAnnouncementStatus, a.id, "PUBLISHED")}>
                  <button type="submit" className="btn btn-success btn-sm">Publish</button>
                </form>
              ) : (
                <form action={fa(setAnnouncementStatus, a.id, "DRAFT")}>
                  <button type="submit" className="btn btn-ghost btn-sm">Unpublish</button>
                </form>
              )}
              <StatusPill status={a.status} />
              <Link href={`/admin/announcements/${a.id}`} className="btn btn-outline btn-sm">Edit</Link>
              <ConfirmForm action={fb(deleteAnnouncement, a.id)} message={`Delete “${a.title}”?`}>
                <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
              </ConfirmForm>
            </div>
          </article>
        ))}
        {items.length === 0 ? (
          <p className="card p-10 text-center text-sm text-navy-500">
            No announcements yet — share news with your community from the button above.
          </p>
        ) : null}
      </div>
    </div>
  );
}

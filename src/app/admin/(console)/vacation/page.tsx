import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, formatNaira } from "@/lib/utils";
import { ConfirmForm } from "@/components/admin/confirm-submit";
import { fb } from "@/lib/form-action";
import { deleteVacationProgramme } from "@/app/actions/admin-content-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vacation programme", robots: { index: false } };

export default async function AdminVacationPage() {
  const programmes = await prisma.vacationProgramme.findMany({
    orderBy: { startsAt: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Vacation / holiday programme</h1>
          <p className="text-sm text-navy-500">Holiday editions for children &amp; young people with bookings.</p>
        </div>
        <Link href="/admin/vacation/new" className="btn btn-primary btn-md">
          <Plus className="h-4 w-4" aria-hidden="true" /> New programme
        </Link>
      </header>

      <div className="space-y-3">
        {programmes.map((p) => (
          <article key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-16 w-28 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-[10px] font-bold uppercase tracking-wide text-navy-400">No image</span>
              )}
              <div className="min-w-0">
                <p className="font-display text-lg font-extrabold text-navy-950">{p.title}</p>
                <p className="line-clamp-1 text-sm text-navy-500">{p.description || "No description"}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                  <span className="font-semibold text-navy-600">{fmtDate(p.startsAt)} → {p.endsAt ? fmtDate(p.endsAt) : "open-ended"}</span>
                  · {p.ageRange || "All ages"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className={`chip ${p.bookingOpen ? "bg-emerald-100 text-emerald-800" : "bg-navy-100 text-navy-600"}`}>
                  {p.bookingOpen ? "Booking open" : "Bookings closed"}
                </span>
                <span className={`chip ${p.isPublished ? "bg-emerald-100 text-emerald-800" : "bg-navy-100 text-navy-600"}`}>
                  {p.isPublished ? "Published" : "Hidden"}
                </span>
                <span className="chip bg-navy-100 text-navy-600">{p._count.bookings} bookings</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-navy-700">{p.priceInKobo ? formatNaira(p.priceInKobo) : "Free"}{p.capacity ? ` · cap ${p.capacity}` : ""}</span>
                <Link href={`/admin/vacation/${p.id}`} className="btn btn-outline btn-sm">Edit</Link>
                <ConfirmForm action={fb(deleteVacationProgramme, p.id)} message={`Delete “${p.title}”? Bookings for it will be removed too.`}>
                  <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
                </ConfirmForm>
              </div>
            </div>
          </article>
        ))}
        {programmes.length === 0 ? (
          <p className="card p-10 text-center text-sm text-navy-500">
            No programmes yet. Add a holiday edition to start taking reservations.
          </p>
        ) : null}
      </div>
    </div>
  );
}

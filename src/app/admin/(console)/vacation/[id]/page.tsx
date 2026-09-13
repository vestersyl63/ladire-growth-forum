import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { VacationForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit vacation programme", robots: { index: false } };

export default async function AdminEditVacationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.vacationProgramme.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/vacation" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to programmes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">Edit programme</h1>
      </header>
      <div className="card max-w-4xl p-6">
        <VacationForm
          initial={{
            id: p.id,
            title: p.title,
            description: p.description,
            imageUrl: p.imageUrl,
            ageRange: p.ageRange,
            requirements: p.requirements,
            activities: p.activities,
            venue: p.venue,
            location: p.location,
            startsAt: p.startsAt,
            endsAt: p.endsAt,
            priceInKobo: p.priceInKobo,
            capacity: p.capacity,
            bookingOpen: p.bookingOpen,
            bookingDeadline: p.bookingDeadline,
            isPublished: p.isPublished,
            isFeatured: p.isFeatured,
          }}
        />
      </div>
      {p.isPublished ? (
        <Link href="/events/vacation-programme" className="text-sm font-semibold text-crimson-600 hover:underline">
          Preview on site →
        </Link>
      ) : null}
    </div>
  );
}

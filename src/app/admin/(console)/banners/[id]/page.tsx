import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { BannerForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit banner", robots: { index: false } };

export default async function AdminEditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banner = await prisma.homepageBanner.findUnique({ where: { id } });
  if (!banner) notFound();

  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/banners" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to banners
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">Edit banner</h1>
      </header>
      <div className="card max-w-3xl p-6">
        <BannerForm
          initial={{
            id: banner.id,
            title: banner.title,
            subtitle: banner.subtitle,
            imageUrl: banner.imageUrl,
            ctaLabel: banner.ctaLabel,
            ctaHref: banner.ctaHref,
            startAt: banner.startAt,
            endAt: banner.endAt,
            priority: banner.priority,
            isActive: banner.isActive,
          }}
        />
      </div>
    </div>
  );
}

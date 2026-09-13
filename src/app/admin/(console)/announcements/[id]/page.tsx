import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { StatusPill } from "@/components/user/status-pill";
import { AnnouncementForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit announcement", robots: { index: false } };

export default async function AdminEditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.announcement.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/admin/announcements" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Link>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Edit announcement</h1>
        <StatusPill status={item.status} />
      </header>
      <div className="card max-w-3xl p-6">
        <AnnouncementForm
          initial={{
            id: item.id,
            title: item.title,
            excerpt: item.excerpt,
            content: item.content,
            imageUrl: item.imageUrl,
            authorName: item.authorName,
            isPinned: item.isPinned,
            status: item.status,
          }}
        />
      </div>
      {item.slug ? (
        <Link href={`/news/${item.slug}`} className="text-sm font-semibold text-crimson-600 hover:underline">
          Preview on site →
        </Link>
      ) : null}
    </div>
  );
}

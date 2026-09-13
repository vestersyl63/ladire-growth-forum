import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BannerForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New banner", robots: { index: false } };

export default function AdminNewBannerPage() {
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/banners" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to banners
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">New hero banner</h1>
      </header>
      <div className="card max-w-3xl p-6">
        <BannerForm initial={null} />
      </div>
    </div>
  );
}

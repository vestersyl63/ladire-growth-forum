import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VacationForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New vacation programme", robots: { index: false } };

export default function AdminNewVacationPage() {
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/vacation" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to programmes
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">New vacation programme</h1>
      </header>
      <div className="card max-w-4xl p-6">
        <VacationForm initial={null} />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EventForm } from "@/components/admin/admin-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New event", robots: { index: false } };

export default async function AdminNewEventPage() {
  return (
    <div className="space-y-5">
      <header>
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to events
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy-950">Create event</h1>
        <p className="text-sm text-navy-500">
          Times are stored in {process.env.APP_TIMEZONE || "Africa/Lagos"} time.
        </p>
      </header>
      <div className="card max-w-4xl p-6">
        <EventForm initial={null} />
      </div>
    </div>
  );
}

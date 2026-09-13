import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { getPublicSiteSettings } from "@/lib/site";
import { AdminLoginForm } from "./admin-login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  const settings = await getPublicSiteSettings();
  return (
    <section className="flex min-h-screen items-center justify-center bg-navy-950 p-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-navy-900/10">
              <Image src={settings.logoUrl} alt="LADIRE logo" width={128} height={128} className="h-full w-full object-contain" />
            </span>
            <h1 className="mt-4 font-display text-xl font-extrabold text-navy-950">LADIRE Admin</h1>
            <p className="text-xs text-navy-500">Restricted area · staff only</p>
          </div>
          <div className="mt-6">
            <AdminLoginForm />
          </div>
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11px] text-navy-400">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            All admin actions are logged in the audit trail.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">
          <a href="/" className="underline hover:text-white">← Back to website</a>
        </p>
      </div>
    </section>
  );
}

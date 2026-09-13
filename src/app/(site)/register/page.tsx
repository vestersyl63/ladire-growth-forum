import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

import { RegisterForm } from "./register-form";
import { getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free LADIRE Growth Forum account — sign in with your phone number and password.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";
  const settings = await getPublicSiteSettings();

  return (
    <section className="relative min-h-[90vh] bg-navy-50/60 py-12">
      <div className="absolute inset-0 bg-pattern-dots opacity-40" aria-hidden="true" />
      <div className="container-x relative max-w-md">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-navy-100 bg-white px-6 py-5">
            <span className="block h-11 w-11 overflow-hidden rounded-xl ring-1 ring-navy-900/10">
              <Image src={settings.logoUrl || "/brand/ladire-logo.png"} alt="LADIRE logo" width={88} height={88} className="h-full w-full object-contain" />
            </span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-navy-950">Create your account</h1>
              <p className="text-xs text-navy-500">Join the LADIRE community</p>
            </div>
          </div>
          <div className="p-6">
            <RegisterForm next={next} />
            <p className="mt-5 text-center text-sm text-navy-600">
              Already have an account?{" "}
              <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-crimson-600 underline">
                Sign in
              </Link>
            </p>
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-navy-50 px-3.5 py-3 text-xs leading-relaxed text-navy-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-olive-600" aria-hidden="true" />
              Your account lets you register for events, book programme places, vote in the Awards
              and track payments — all in one dashboard.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

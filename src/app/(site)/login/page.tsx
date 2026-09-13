import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "./login-form";
import { getPublicSiteSettings } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your LADIRE Growth Forum account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/dashboard";
  const settings = await getPublicSiteSettings();
  const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

  return (
    <section className="relative min-h-[80vh] bg-navy-50/60 py-12">
      <div className="absolute inset-0 bg-pattern-dots opacity-40" aria-hidden="true" />
      <div className="container-x relative max-w-md">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-navy-100 bg-white px-6 py-5">
            <span className="block h-11 w-11 overflow-hidden rounded-xl ring-1 ring-navy-900/10">
              <Image src={settings.logoUrl || "/brand/ladire-logo.png"} alt="LADIRE logo" width={88} height={88} className="h-full w-full object-contain" />
            </span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-navy-950">Welcome back</h1>
              <p className="text-xs text-navy-500">Sign in to {settings.siteName}</p>
            </div>
          </div>

          <div className="p-6">
            {sp.registered ? (
              <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-900">
                Account created! Sign in to continue.
              </p>
            ) : null}
            <LoginForm next={next} hasGoogle={hasGoogle} />
            <p className="mt-5 text-center text-sm text-navy-600">
              New to LADIRE?{" "}
              <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-bold text-crimson-600 underline">
                Create a free account
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-navy-400">
              Secure sign-in with phone/email + password — no OTP needed. A password is always
              required to protect your account.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

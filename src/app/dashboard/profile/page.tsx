import type { Metadata } from "next";
import { CalendarDays, ShieldCheck } from "lucide-react";

import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/utils";
import { ProfileForm, PasswordForm } from "./profile-forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile", description: "Manage your LADIRE profile." };

export default async function ProfilePage() {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.user.id! } });
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">My profile</h1>
        <p className="mt-1 text-sm text-navy-500">
          {user.name} · Member since {fmtDate(user.createdAt)}
        </p>
      </header>

      <div className="card overflow-hidden">
        <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Account details</h2>
        </div>
        <div className="p-6">
          <ProfileForm
            initial={{ name: user.name, email: user.email, phone: user.phone }}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-navy-100 bg-navy-50/50 px-6 py-4">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Security</h2>
        </div>
        <div className="p-6">
          <PasswordForm />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-navy-100 bg-white p-5 text-sm text-navy-600">
        <p className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-olive-600" aria-hidden="true" />
          Signed in with {user.phone ? `phone ${user.phone}` : "email"} + password
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-olive-600" aria-hidden="true" />
          {user.status === "ACTIVE" ? "Account active" : "Account suspended"}
        </p>
      </div>
    </div>
  );
}

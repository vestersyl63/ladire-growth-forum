import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import { requireUser, markAllNotificationsRead } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./notifications-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your LADIRE notifications.",
};

export default async function NotificationsPage() {
  const session = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Notifications</h1>
        {notifications.some((n) => !n.isRead) ? (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="btn btn-ghost btn-sm">
              <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
            </button>
          </form>
        ) : null}
      </header>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-navy-300" aria-hidden="true" />
          <h2 className="mt-4 font-display text-lg font-extrabold text-navy-900">No notifications yet</h2>
          <p className="mt-1 text-sm text-navy-600">
            You’ll see payment, booking and event updates here.
          </p>
        </div>
      ) : (
        <NotificationsClient initial={notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, isRead: n.isRead, createdAt: n.createdAt.toISOString(), link: n.link }))} />
      )}

      {notifications.length > 0 && (
        <p className="text-xs text-navy-400">
          Older notifications — see your{" "}
          <Link href="/dashboard/votes" className="font-bold text-crimson-600 underline">payment history</Link> and{" "}
          <Link href="/dashboard" className="font-bold text-crimson-600 underline">dashboard</Link>.
        </p>
      )}
    </div>
  );
}

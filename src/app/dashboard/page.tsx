import type { Metadata } from "next";
import Link from "next/link";
import {
  Vote,
  Ticket,
  CalendarCheck2,
  Bell,
  ArrowRight,
  Wallet,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings, getActiveAwardBundle } from "@/lib/site";
import { fmtDate, timeAgoLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My Dashboard", description: "Your LADIRE dashboard." };

export default async function DashboardPage() {
  const session = await requireUser();
  const me = await prisma.user.findUnique({ where: { id: session.user.id! } });
  const [settings, award] = await Promise.all([getPublicSiteSettings(), getActiveAwardBundle()]);

  const [pendingPayments, approvedVotes, registrations, bookings, vacationBookings, unread, latestNotifications] =
    await Promise.all([
      prisma.payment.count({
        where: { userId: session.user.id!, status: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.vote.aggregate({
        where: { userId: session.user.id! },
        _sum: { quantity: true },
      }),
      prisma.eventRegistration.count({ where: { userId: session.user.id! } }),
      prisma.eventBooking.count({ where: { userId: session.user.id! } }),
      prisma.vacationBooking.count({ where: { userId: session.user.id! } }),
      prisma.notification.count({ where: { userId: session.user.id!, isRead: false } }),
      prisma.notification.findMany({
        where: { userId: session.user.id! },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const firstName = (me?.name || "there").split(" ")[0];

  const stats = [
    {
      icon: Vote,
      label: "Approved votes",
      value: String(approvedVotes._sum.quantity ?? 0),
      href: "/dashboard/votes",
      tone: "bg-crimson-100 text-crimson-700",
    },
    {
      icon: Wallet,
      label: "Payments in review",
      value: String(pendingPayments),
      href: "/dashboard/votes",
      tone: "bg-amber-100 text-amber-700",
    },
    {
      icon: Ticket,
      label: "Event registrations",
      value: String(registrations),
      href: "/dashboard/registrations",
      tone: "bg-navy-100 text-navy-700",
    },
    {
      icon: CalendarCheck2,
      label: "Bookings",
      value: String(bookings + vacationBookings),
      href: "/dashboard/bookings",
      tone: "bg-olive-100 text-olive-700",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950 sm:text-3xl">
          Welcome back, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-navy-500">
          Member since {fmtDate(me?.createdAt)} · {settings.siteName}
        </p>
      </header>

      {award ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-navy-950 to-navy-800 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-300">Awards 2026</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Voting is live — support your favourite nominee.</h2>
          </div>
          <Link href="/vote" className="btn btn-gold shrink-0">
            <Vote className="h-4 w-4" aria-hidden="true" /> Vote now
          </Link>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card card-hover p-4">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.tone}`}>
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 font-display text-2xl font-extrabold text-navy-950">{s.value}</p>
            <p className="text-xs font-semibold text-navy-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Recent notifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-extrabold text-navy-950">
              <Bell className="h-5 w-5 text-crimson-600" aria-hidden="true" /> Recent updates
            </h2>
            <Link href="/dashboard/notifications" className="text-sm font-bold text-crimson-600">
              View all
            </Link>
          </div>
          {latestNotifications.length ? (
            <ul className="mt-4 divide-y divide-navy-100">
              {latestNotifications.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="text-sm font-semibold text-navy-900">
                    {!n.isRead ? (
                      <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-crimson-600 align-middle" aria-label="Unread" />
                    ) : null}
                    {n.title}
                  </p>
                  {n.body ? <p className="mt-0.5 line-clamp-2 text-sm text-navy-600">{n.body}</p> : null}
                  <p className="mt-0.5 text-xs text-navy-400">{timeAgoLabel(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-navy-500">No notifications yet.</p>
          )}
        </div>

        {/* Quick actions */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Quick actions</h2>
          <div className="mt-4 space-y-2.5">
            {[
              { href: "/vote", icon: Vote, label: "Vote in the Awards" },
              { href: "/events", icon: Ticket, label: "Register for an event" },
              { href: "/join", icon: CalendarCheck2, label: "Join LADIRE as a member" },
              { href: "/contact", icon: AlertTriangle, label: "Payment support" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between rounded-xl border border-navy-100 px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-navy-300 hover:bg-navy-50"
              >
                <span className="flex items-center gap-3">
                  <a.icon className="h-4.5 w-4.5 text-crimson-600" aria-hidden="true" />
                  {a.label}
                </span>
                <ArrowRight className="h-4 w-4 text-navy-400" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-emerald-50 p-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>
                Votes are counted only after your bank-transfer payment is approved by a LADIRE
                administrator. Check <Link href="/dashboard/votes" className="font-bold underline">Voting &amp; payments</Link> for status.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

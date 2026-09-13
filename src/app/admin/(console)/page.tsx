import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Wallet,
  Star,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
} from "lucide-react";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, formatNaira, timeAgoLabel } from "@/lib/utils";
import { Kpi, VotesByCategoryChart, RevenueByDayChart } from "@/components/admin/charts";
import { StatusPill } from "@/components/user/status-pill";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

export default async function AdminOverview() {
  const admin = await requireAdmin();

  const now = new Date();
  const [userCount, memberCount, eventCount, nomineeCount, approvedCount, pendingCount, rejectedCount, revenue, votesTotal, pendingPayments, byCategory, byDay, topNominees] =
    await Promise.all([
      prisma.user.count(),
      prisma.member.count(),
      prisma.event.count({ where: { status: "PUBLISHED" } }),
      prisma.nominee.count({ where: { isPublished: true } }),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.payment.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
      prisma.payment.count({ where: { status: "REJECTED" } }),
      prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amountExpectedKobo: true } }),
      prisma.vote.aggregate({ _sum: { quantity: true } }),
      prisma.payment.findMany({
        where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
        orderBy: { createdAt: "asc" },
        take: 8,
        include: { voteOrder: true, user: { select: { name: true, phone: true } } },
      }),
      prisma.vote.groupBy({ by: ["categoryId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
      prisma.payment.findMany({
        where: { status: "APPROVED", createdAt: { gte: new Date(now.getTime() - 13 * 86400000) } },
        select: { createdAt: true, amountExpectedKobo: true },
      }),
      prisma.nominee.findMany({ orderBy: { officialVotes: "desc" }, take: 5, include: { category: true } }),
    ]);

  const catNames = await prisma.awardCategory.findMany({ where: { id: { in: byCategory.map((b) => b.categoryId) } }, select: { id: true, name: true } });
  const catMap = new Map(catNames.map((c) => [c.id, c.name]));
  const chartData = byCategory.map((b) => ({
    name: (catMap.get(b.categoryId) ?? "Category").slice(0, 14),
    votes: b._sum.quantity ?? 0,
  }));

  const dayMap = new Map<string, number>();
  for (const p of byDay) {
    const day = fmtDate(p.createdAt, "d MMM");
    dayMap.set(day, (dayMap.get(day) ?? 0) + p.amountExpectedKobo);
  }
  const revenueData = Array.from(dayMap.entries()).map(([day, kobo]) => ({ day, kobo }));

  const kpis = [
    { label: "Registered users", value: String(userCount), icon: <Users className="h-4 w-4 text-navy-400" /> },
    { label: "Members", value: String(memberCount), icon: <Users className="h-4 w-4 text-navy-400" /> },
    { label: "Published events", value: String(eventCount), icon: <Ticket className="h-4 w-4 text-navy-400" /> },
    { label: "Nominees live", value: String(nomineeCount), icon: <Star className="h-4 w-4 text-navy-400" /> },
    { label: "Approved payments", value: String(approvedCount), icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
    { label: "Pending review", value: String(pendingCount), icon: <Clock className="h-4 w-4 text-amber-500" /> },
    { label: "Rejected", value: String(rejectedCount), icon: <XCircle className="h-4 w-4 text-crimson-500" /> },
    { label: "Verified votes", value: String(votesTotal._sum.quantity ?? 0), icon: <Star className="h-4 w-4 text-gold-500" /> },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Admin overview</h1>
          <p className="text-sm text-navy-500">Signed in as {admin.name} · {admin.role}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          Revenue (approved): {formatNaira(revenue._sum.amountExpectedKobo ?? 0)}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} label={k.label} value={k.value} icon={k.icon} />
        ))}
      </div>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Votes by category</h2>
          <p className="text-xs text-navy-400">Official (approved) votes</p>
          <div className="mt-4">
            <VotesByCategoryChart data={chartData} />
          </div>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-extrabold text-navy-950">Approved revenue (last 14 days)</h2>
          <p className="text-xs text-navy-400">Sum of approved payment amounts per day</p>
          <div className="mt-4">
            <RevenueByDayChart data={revenueData} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top nominees */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Top nominees</h2>
            <Link href="/admin/nominees" className="text-sm font-bold text-crimson-600">Manage →</Link>
          </div>
          {topNominees.length ? (
            <ul className="mt-3 divide-y divide-navy-100">
              {topNominees.map((n, i) => (
                <li key={n.id} className="flex items-center gap-3 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold ${i === 0 ? "bg-gold-400 text-navy-950" : "bg-navy-100 text-navy-700"}`}>
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-navy-900">{n.stageName || n.name}</span>
                    <span className="block text-xs text-navy-400">{n.category.name}</span>
                  </span>
                  <span className="font-display text-lg font-extrabold text-crimson-600">{n.officialVotes.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-navy-500">No verified votes yet.</p>
          )}
        </div>

        {/* Queue */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-navy-950">Payment verification queue</h2>
            <Link href="/admin/payments" className="text-sm font-bold text-crimson-600">
              Verify → <ArrowRight className="inline h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {pendingPayments.length ? (
            <ul className="mt-3 divide-y divide-navy-100">
              {pendingPayments.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/payments/${p.id}`} className="flex items-center gap-3 py-2.5 hover:bg-navy-50/60 rounded-lg -mx-2 px-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-navy-900">{p.user?.name || "Voter"}</span>
                      <span className="block truncate text-xs text-navy-400">
                        {p.voteOrder?.nomineeName} · {formatNaira(p.amountExpectedKobo)} · {timeAgoLabel(p.createdAt)}
                      </span>
                    </span>
                    <StatusPill status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-navy-500">No payments waiting — queue is clear 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}

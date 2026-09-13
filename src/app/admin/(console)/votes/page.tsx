import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDate, fmtDateTime, formatNaira } from "@/lib/utils";
import { VotesByCategoryChart } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Votes & revenue", robots: { index: false } };

const PAGE = 25;

export default async function AdminVotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  const whereVotes: Record<string, unknown> = {};
  if (q) whereVotes.OR = [{ nominee: { name: { contains: q, mode: "insensitive" } } }, { category: { name: { contains: q, mode: "insensitive" } } }];

  const [total, votes, voteSum, revenueSum, byCategory, byAward] = await Promise.all([
    prisma.vote.count({ where: whereVotes }),
    prisma.vote.findMany({
      where: whereVotes,
      orderBy: { approvedAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        nominee: { include: { category: true } },
        user: { select: { name: true, email: true } },
        order: { include: { payment: true } },
      },
    }),
    prisma.vote.aggregate({ _sum: { quantity: true } }),
    prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amountExpectedKobo: true } }),
    prisma.vote.groupBy({ by: ["categoryId"], _sum: { quantity: true } }),
    prisma.award.findMany({ select: { id: true, title: true, pricePerVoteKobo: true } }),
  ]);

  const catNames = await prisma.awardCategory.findMany({ where: { id: { in: byCategory.map((x) => x.categoryId) } }, select: { id: true, name: true } });
  const catMap = new Map(catNames.map((c) => [c.id, c.name]));
  const chart = byCategory.map((x) => ({ name: (catMap.get(x.categoryId) ?? "?").slice(0, 16), votes: x._sum.quantity ?? 0 })).sort((a, b) => b.votes - a.votes).slice(0, 8);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Votes &amp; revenue</h1>
          <p className="text-sm text-navy-500">
            Official votes granted from approved payments. Immutable history.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/export/votes" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Votes CSV</a>
          <a href="/admin/export/payments?status=APPROVED" className="btn btn-outline btn-md"><Download className="h-4 w-4" aria-hidden="true" /> Payments CSV</a>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Total official votes</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy-950">{(voteSum._sum.quantity ?? 0).toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Verified revenue</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-emerald-700">{formatNaira(revenueSum._sum.amountExpectedKobo ?? 0)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy-400">Vote grants (rows)</p>
          <p className="mt-1 font-display text-3xl font-extrabold text-navy-950">{total.toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-display text-lg font-extrabold text-navy-950">Votes by category</h2>
        <div className="mt-4">
          <VotesByCategoryChart data={chart} />
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[860px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Approved</th>
              <th>Voter</th>
              <th>Nominee</th>
              <th>Category</th>
              <th className="text-right">Votes</th>
              <th className="text-right">Paid</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {votes.map((v) => (
              <tr key={v.id}>
                <td className="whitespace-nowrap">{fmtDateTime(v.approvedAt)}</td>
                <td>
                  <p className="font-semibold text-navy-900">{v.user?.name || "—"}</p>
                </td>
                <td>
                  <Link href={`/admin/nominees/${v.nomineeId}`} className="font-semibold text-crimson-600 hover:underline">
                    {v.nominee.stageName || v.nominee.name}
                  </Link>
                </td>
                <td>{v.nominee.category.name}</td>
                <td className="text-right font-display font-extrabold">{v.quantity}</td>
                <td className="text-right">{v.order?.payment ? formatNaira(v.order.payment.amountExpectedKobo) : "—"}</td>
                <td><code className="text-xs">{v.order?.reference}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
        {votes.length === 0 ? <p className="px-4 py-10 text-center text-sm text-navy-500">No votes have been granted yet.</p> : null}
      </div>

      {pages > 1 ? (
        <div className="flex gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link key={n} href={`/admin/votes?page=${n}&q=${encodeURIComponent(q)}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-200 text-sm font-bold text-navy-700">
              {n}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="text-xs text-navy-400">
        Today is {fmtDate(new Date(), "EEEE, d MMMM yyyy")}. Award base price per vote:{" "}
        {byAward.map((a) => `${a.title} (${a.pricePerVoteKobo ? formatNaira(a.pricePerVoteKobo) : "unset"})`).join(", ") || "none configured"}
      </div>
    </div>
  );
}

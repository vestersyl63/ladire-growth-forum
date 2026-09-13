import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { fmtDateTime, formatNaira } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payment verification", robots: { index: false } };

const PAGE = 20;

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status.length ? sp.status : null;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Record<string, unknown> = {};
  if (status) {
    if (status === "REVIEW") where.status = { in: ["PENDING", "UNDER_REVIEW"] };
    else where.status = status;
  }
  if (q) {
    where.OR = [
      { reference: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { phone: { contains: q, mode: "insensitive" } } },
      { voteOrder: { nomineeName: { contains: q, mode: "insensitive" } } },
      { voteOrder: { categoryName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        user: { select: { name: true, phone: true } },
        voteOrder: { select: { nomineeName: true, categoryName: true, quantity: true } },
      },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE));

  const tabs = [
    { label: "Review queue", value: "REVIEW" },
    { label: "Pending", value: "PENDING" },
    { label: "Under review", value: "UNDER_REVIEW" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "All", value: "" },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-950">Payment verification</h1>
          <p className="text-sm text-navy-500">
            {total} payment{total === 1 ? "" : "s"} · approve only after confirming the bank transfer.
          </p>
        </div>
        <a href={`/admin/export/payments?${status ? `status=${status}&` : ""}${q ? `q=${encodeURIComponent(q)}&` : ""}`} className="btn btn-outline btn-md">
          <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
        </a>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.label}
            href={`/admin/payments?status=${t.value}`}
            className={cn(
              "chip border px-3.5 py-1.5 text-sm font-bold",
              (status ?? "") === t.value
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-navy-200 bg-white text-navy-700 hover:border-navy-400"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="get" action="/admin/payments" className="flex max-w-xl gap-2">
        <input type="hidden" name="status" value={status ?? ""} />
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by reference, voter, phone, nominee or category…"
            className="field pl-10"
          />
        </div>
        <button type="submit" className="btn btn-navy btn-md">Search</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="tbl min-w-[900px]">
          <thead className="border-b border-navy-100 bg-navy-50/60">
            <tr>
              <th>Reference</th>
              <th>Voter</th>
              <th>Nominee / Category</th>
              <th className="text-right">Votes</th>
              <th className="text-right">Expected</th>
              <th className="text-right">Submitted</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => {
              const mismatch =
                p.amountPaidKobo != null && p.amountPaidKobo !== p.amountExpectedKobo;
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/payments/${p.id}`} className="font-bold text-crimson-600 hover:underline">
                      {p.reference}
                    </Link>
                  </td>
                  <td>
                    <p className="font-semibold text-navy-900">{p.user?.name || "—"}</p>
                    {p.user?.phone ? <p className="text-xs text-navy-400">{p.user.phone}</p> : null}
                  </td>
                  <td>
                    <p className="font-semibold text-navy-800">{p.voteOrder?.nomineeName ?? "—"}</p>
                    <p className="text-xs text-navy-400">{p.voteOrder?.categoryName}</p>
                  </td>
                  <td className="text-right">{p.voteOrder?.quantity ?? "—"}</td>
                  <td className="text-right font-semibold">{formatNaira(p.amountExpectedKobo)}</td>
                  <td className="text-right">
                    {p.amountPaidKobo != null ? (
                      <span className={mismatch ? "font-bold text-crimson-600" : "text-navy-800"}>
                        {formatNaira(p.amountPaidKobo)}
                        {mismatch ? " ⚠" : ""}
                      </span>
                    ) : (
                      <span className="text-navy-300">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">{fmtDateTime(p.createdAt, "d MMM, HH:mm")}</td>
                  <td>
                    <StatusPill status={p.status} />
                    {mismatch && p.status !== "APPROVED" ? (
                      <p className="mt-1 text-[10px] font-bold uppercase text-crimson-600">Amount mismatch</p>
                    ) : null}
                  </td>
                  <td>
                    <Link href={`/admin/payments/${p.id}`} className="btn btn-ghost btn-sm">
                      Review
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-navy-500">
            {q ? "No payments match your search." : "There are no pending payments."}
          </p>
        ) : null}
      </div>

      {pages > 1 ? (
        <div className="flex items-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              href={`/admin/payments?status=${status ?? ""}&q=${encodeURIComponent(q)}&page=${n}`}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold",
                n === page ? "border-navy-900 bg-navy-900 text-white" : "border-navy-200 text-navy-700"
              )}
            >
              {n}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

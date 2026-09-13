import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dataset: string }> }
) {
  await requireAdmin();
  const { dataset } = await params;
  const sp = new URL(request.url).searchParams;

  switch (dataset) {
    case "users": {
      const rows = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { _count: { select: { voteOrders: true, payments: true, eventRegistrations: true } } },
      });
      return file(
        "users",
        csv(
          ["id", "name", "email", "phone", "status", "created_at", "last_login_at", "vote_orders", "payments", "registrations"],
          rows.map((u) => [u.id, u.name, u.email, u.phone, u.status, u.createdAt.toISOString(), u.lastLoginAt?.toISOString(), u._count.voteOrders, u._count.payments, u._count.eventRegistrations])
        )
      );
    }

    case "members": {
      const rows = await prisma.member.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
      return file(
        "members",
        csv(
          ["id", "full_name", "email", "phone", "city", "area_of_interest", "skills", "status", "created_at"],
          rows.map((m) => [m.id, m.fullName, m.email, m.phone, m.city, m.areaOfInterest, m.skills.join("; "), m.status, m.createdAt.toISOString()])
        )
      );
    }

    case "payments": {
      const status = sp.get("status");
      const q = sp.get("q")?.trim() ?? "";
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (q)
        where.OR = [
          { reference: { contains: q, mode: "insensitive" } },
          { user: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } },
          { voteOrder: { nominee: { name: { contains: q, mode: "insensitive" } } } },
        ];
      const rows = await prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          voteOrder: { include: { nominee: { select: { name: true } }, category: { select: { name: true } } } },
        },
      });
      return file(
        "payments",
        csv(
          ["reference", "created_at", "user", "email", "phone", "nominee", "category", "quantity", "expected_kobo", "paid_kobo", "status", "bank", "transaction_date", "rejection_reason"],
          rows.map((p) => [
            p.reference, p.createdAt.toISOString(), p.user.name, p.user.email, p.user.phone,
            p.voteOrder?.nominee.name, p.voteOrder?.category.name, p.voteOrder?.quantity,
            p.amountExpectedKobo, p.amountPaidKobo, p.status, p.bankName, p.transactionDate?.toISOString(), p.rejectedReason,
          ])
        )
      );
    }

    case "votes": {
      const rows = await prisma.vote.findMany({
        orderBy: { approvedAt: "desc" },
        take: 5000,
        include: {
          user: { select: { name: true, email: true } },
          nominee: { select: { name: true } },
          category: { select: { name: true } },
          approvedBy: { select: { name: true } },
        },
      });
      return file(
        "votes",
        csv(
          ["id", "approved_at", "user", "email", "nominee", "category", "quantity", "approved_by", "order_id"],
          rows.map((v) => [v.id, v.approvedAt.toISOString(), v.user.name, v.user.email, v.nominee.name, v.category.name, v.quantity, v.approvedBy?.name, v.orderId])
        )
      );
    }

    case "event-registrations": {
      const rows = await prisma.eventRegistration.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { event: { select: { title: true } } },
      });
      return file(
        "event-registrations",
        csv(
          ["reference", "event", "name", "email", "phone", "quantity", "status", "created_at"],
          rows.map((r) => [r.reference, r.event.title, r.name, r.email, r.phone, r.quantity, r.status, r.createdAt.toISOString()])
        )
      );
    }

    case "event-bookings": {
      const rows = await prisma.eventBooking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { event: { select: { title: true } }, option: { select: { title: true } } },
      });
      return file(
        "event-bookings",
        csv(
          ["reference", "event", "option", "name", "email", "phone", "quantity", "total_kobo", "status", "created_at"],
          rows.map((b) => [b.reference, b.event.title, b.option?.title, b.name, b.email, b.phone, b.quantity, b.totalKobo, b.status, b.createdAt.toISOString()])
        )
      );
    }

    case "vacation-bookings": {
      const rows = await prisma.vacationBooking.findMany({
        orderBy: { createdAt: "desc" },
        take: 5000,
        include: { programme: { select: { title: true } } },
      });
      return file(
        "vacation-bookings",
        csv(
          ["reference", "programme", "participant", "age", "parent", "parent_phone", "parent_email", "quantity", "status", "created_at"],
          rows.map((b) => [b.reference, b.programme.title, b.participantName, b.participantAge, b.parentName, b.parentPhone, b.parentEmail, b.quantity, b.status, b.createdAt.toISOString()])
        )
      );
    }

    default:
      return new NextResponse("Unknown export dataset.", { status: 404 });
  }
}

function file(name: string, content: string): NextResponse {
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ladire-${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

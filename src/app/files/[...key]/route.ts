import { NextRequest, NextResponse } from "next/server";
import { mimeFromExt, readStoredFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";
import { getSession } from "@/lib/auth";

// Private files (payment receipts). Only the payment owner or an authorised
// admin may view them. Receipts are never in a public static folder.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  if (!key?.length) return new NextResponse("Not found", { status: 404 });
  if (key.some((p) => p === ".." || p === "" || p.includes("\\"))) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const storageKey = key.join("/");

  const receipt = await prisma.paymentReceipt.findUnique({ where: { storageKey } });
  if (!receipt) return new NextResponse("Not found", { status: 404 });

  // Authorization: admin (any) OR owning user
  const [admin, session] = await Promise.all([getAdminSession(), getSession()]);
  const isOwner = session?.user?.id === receipt.uploadedById || session?.user?.id === (await ownerUserId(receipt.paymentId));
  if (!admin && !isOwner) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const file = await readStoredFile(storageKey, "private");
  if (!file) return new NextResponse("Not found", { status: 404 });

  const disposition = "inline";
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": mimeFromExt(file.ext),
      "Content-Disposition": `${disposition}; filename="receipt-${receipt.paymentId.slice(-6)}.${file.ext}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

async function ownerUserId(paymentId: string): Promise<string | null> {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, select: { userId: true } });
  return p?.userId ?? null;
}

import { NextRequest, NextResponse } from "next/server";
import { mimeFromExt, readStoredFile } from "@/lib/storage";

// Public media (images etc). Files live under STORAGE_DIR/public.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path?.length) return new NextResponse("Not found", { status: 404 });
  // Guard: no traversal, no hidden files
  if (path.some((p) => p === ".." || p === "" || p.includes("\\"))) {
    return new NextResponse("Bad request", { status: 400 });
  }
  const rel = path.join("/");
  const file = await readStoredFile(rel, "public");
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": mimeFromExt(file.ext),
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}

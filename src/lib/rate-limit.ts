import { headers } from "next/headers";

// ------------------------------------------------------------
// Lightweight in-memory rate limiter.
//
// NOTE: In-memory state is per server instance. That is fine for
// a single Next.js instance and for moderate traffic. For large
// multi-instance/serverless deployments swap this for a shared
// store (Upstash Redis, Vercel KV, etc.) — the call signature
// below is the only thing that needs to change.
// ------------------------------------------------------------

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map never grows unbounded.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }, 60_000).unref?.();
}

export type RateLimitResult = { ok: boolean; retryAfterSec?: number };

/** keyFor combines an action + IP to isolate rate limit buckets. */
export function rateLimit(
  action: string,
  opts: { limit?: number; windowSec?: number; ip?: string } = {}
): RateLimitResult {
  const { limit = 10, windowSec = 60, ip } = opts;
  const key = `${action}:${ip ?? getClientIp() ?? "unknown"}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      null
    );
  } catch {
    return null;
  }
}

import { format } from "date-fns";
import { enGB } from "date-fns/locale";
import { TZDate, tzOffset } from "@date-fns/tz";

export const APP_TZ = process.env.APP_TIMEZONE || "Africa/Lagos";

export const NGN_ISO_CODE = "NGN";

/** Wrap an instant so date-fns renders its wall-clock time in APP_TZ. */
function zoned(value: Date | string | number): Date {
  const d = typeof value === "string" ? new Date(value) : new Date(value);
  return new TZDate(d, APP_TZ);
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Kobo (integer) <-> Naira display helpers. All money is stored as kobo integers. */
export function koboToNairaString(kobo: number | null | undefined): string {
  if (kobo == null) return "—";
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG", {
    minimumFractionDigits: naira % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format a naira amount plainly, e.g. 1250 -> "1,250" */
export function nairaAmount(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG");
}

export function formatNaira(kobo: number | null | undefined): string {
  return koboToNairaString(kobo);
}

/**
 * Interpret a "datetime-local" string (as chosen by an admin in the app
 * timezone) as a UTC instant.
 */
export function appTzLocalToUtc(localInput: string): Date | null {
  if (!localInput) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(localInput.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s = "0"] = m;
  const wallAsUtc = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
  if (Number.isNaN(wallAsUtc.getTime())) return null;
  // Offset (east-positive minutes) for the wall-clock instant, then correct
  // once in case a DST transition sits exactly on the boundary.
  let offset = tzOffset(APP_TZ, wallAsUtc);
  const probe = new Date(wallAsUtc.getTime() - offset * 60000);
  offset = tzOffset(APP_TZ, probe);
  const utc = new Date(wallAsUtc.getTime() - offset * 60000);
  return Number.isNaN(utc.getTime()) ? null : utc;
}

/** Format a Date for an <input type="datetime-local"> (app timezone wall clock). */
export function toLocalInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const z = new TZDate(d, APP_TZ);
  return format(z, "yyyy-MM-dd'T'HH:mm");
}

/** Format a Date in the application timezone (Africa/Lagos by default). */
export function fmtDate(
  value: Date | string | number | null | undefined,
  pattern = "d MMM yyyy"
): string {
  if (value == null) return "—";
  const d = zoned(value);
  if (Number.isNaN(d.getTime())) return "—";
  try {
    return format(d, pattern, { locale: enGB });
  } catch {
    return format(d, pattern);
  }
}

export function fmtDateTime(
  value: Date | string | number | null | undefined,
  pattern = "d MMM yyyy, h:mm a"
): string {
  return fmtDate(value, pattern);
}

export function timeAgoLabel(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "LF";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Simple plain-text -> safe paragraph renderer (no raw HTML). */
export function toParagraphs(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

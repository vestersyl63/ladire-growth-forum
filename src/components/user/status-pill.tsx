import { cn } from "@/lib/utils";

const MAP: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  PENDING: { label: "Pending", cls: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  UNDER_REVIEW: { label: "Under review", cls: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  APPROVED: { label: "Approved", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", cls: "bg-crimson-100 text-crimson-800", dot: "bg-crimson-600" },
  CONFIRMED: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  CANCELLED: { label: "Cancelled", cls: "bg-navy-100 text-navy-700", dot: "bg-navy-500" },
  DRAFT: { label: "Draft", cls: "bg-navy-100 text-navy-700", dot: "bg-navy-400" },
  PUBLISHED: { label: "Published", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  ACTIVE: { label: "Active", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  SUSPENDED: { label: "Suspended", cls: "bg-crimson-100 text-crimson-800", dot: "bg-crimson-600" },
  ARCHIVED: { label: "Archived", cls: "bg-navy-100 text-navy-700", dot: "bg-navy-400" },
  NEW: { label: "New", cls: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "In progress", cls: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  RESOLVED: { label: "Resolved", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  HIDDEN: { label: "Hidden", cls: "bg-navy-100 text-navy-700", dot: "bg-navy-400" },
  LIVE: { label: "Live", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  FINAL: { label: "Final", cls: "bg-navy-900 text-white", dot: "bg-gold-400" },
};

export function StatusPill({ status }: { status: string }) {
  const meta = MAP[status] ?? { label: status, cls: "bg-navy-100 text-navy-700", dot: "bg-navy-400" };
  return (
    <span className={cn("badge", meta.cls)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden="true" />
      <span className="sr-only">Status: </span>
      {meta.label}
    </span>
  );
}

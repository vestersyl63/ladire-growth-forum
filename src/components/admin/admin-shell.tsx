"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Users,
  Ticket,
  CalendarCheck2,
  Trophy,
  Star,
  Megaphone,
  ImageIcon,
  Settings,
  ShieldCheck,
  History,
  MailQuestion,
  Sun,
  LogOut,
  Menu,
  X,
  ExternalLink,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { adminLogout } from "@/app/actions/admin-actions";

export type AdminSection =
  | "overview"
  | "payments"
  | "votes"
  | "users"
  | "members"
  | "events"
  | "registrations"
  | "bookings"
  | "vacation"
  | "awards"
  | "nominees"
  | "announcements"
  | "banners"
  | "contacts"
  | "settings"
  | "admins"
  | "audit";

const SECTIONS: Array<{
  key: AdminSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "Overview", href: "/admin", icon: LayoutDashboard },
  { key: "payments", label: "Payment verification", href: "/admin/payments", icon: Wallet },
  { key: "votes", label: "Votes & revenue", href: "/admin/votes", icon: Star },
  { key: "users", label: "Users", href: "/admin/users", icon: Users },
  { key: "members", label: "Members", href: "/admin/members", icon: BadgeCheck },
  { key: "events", label: "Events", href: "/admin/events", icon: Ticket },
  { key: "registrations", label: "Event registrations", href: "/admin/registrations", icon: CalendarCheck2 },
  { key: "bookings", label: "Bookings", href: "/admin/bookings", icon: Sun },
  { key: "vacation", label: "Vacation programme", href: "/admin/vacation", icon: Sun },
  { key: "awards", label: "Awards programme", href: "/admin/awards", icon: Trophy },
  { key: "nominees", label: "Nominees", href: "/admin/nominees", icon: Star },
  { key: "announcements", label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { key: "banners", label: "Homepage banners", href: "/admin/banners", icon: ImageIcon },
  { key: "contacts", label: "Messages", href: "/admin/contacts", icon: MailQuestion },
  { key: "admins", label: "Admin users", href: "/admin/admins", icon: ShieldCheck },
  { key: "settings", label: "Site settings", href: "/admin/settings", icon: Settings },
  { key: "audit", label: "Audit log", href: "/admin/audit", icon: History },
];

export function AdminShell({
  children,
  allowed,
  user,
  siteName,
  logoUrl,
  pendingCount,
}: {
  children: React.ReactNode;
  allowed: AdminSection[];
  user: { name: string; role: string };
  siteName: string;
  logoUrl: string;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = SECTIONS.filter((s) => allowed.includes(s.key));

  const active = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const sidebar = (
    <>
      <div className="flex items-center gap-2.5 border-b border-white/10 p-5">
        <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white">
          <Image src={logoUrl} alt="LADIRE logo" width={80} height={80} className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-extrabold text-white">{siteName}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold-300">Admin console</p>
        </div>
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {visible.map((s) => {
          const isActive = active(s.href);
          return (
            <Link
              key={s.key}
              href={s.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors",
                isActive
                  ? "bg-white text-navy-950"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.key === "payments" && pendingCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-500 px-1.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-flame-500 text-xs font-extrabold text-navy-950">
            {(user.name || "A").charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">{user.role}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link href="/" target="_blank" className="btn btn-ghost btn-sm !text-white/80 flex-1" title="Open website">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Site
          </Link>
          <form action={adminLogout} className="flex-1">
            <button type="submit" className="btn btn-ghost btn-sm !text-white/80 w-full">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Sign out
            </button>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-navy-100/50">
      {/* mobile top */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-navy-950 px-4 py-2.5 text-white lg:hidden">
        <p className="font-display text-sm font-extrabold">LADIRE Admin</p>
        <button type="button" className="icon-btn !text-white" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-950 lg:flex">
          {sidebar}
        </aside>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-navy-950">
              <button
                type="button"
                className="absolute right-3 top-3 icon-btn !text-white"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </aside>
          </div>
        ) : null}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}


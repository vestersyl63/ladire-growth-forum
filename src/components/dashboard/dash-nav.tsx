"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserRound,
  Ticket,
  CalendarCheck2,
  Vote,
  Bell,
  Menu,
  X,
  LogOut,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/app/actions/auth-actions";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/votes", label: "Voting & payments", icon: Vote },
  { href: "/dashboard/registrations", label: "Event registrations", icon: Ticket },
  { href: "/dashboard/bookings", label: "Bookings & reservations", icon: CalendarCheck2 },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export function DashShell({
  children,
  user,
  unread,
  logoUrl,
  siteName,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  unread: number;
  logoUrl: string;
  siteName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-navy-50/50">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-100 bg-white px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="block h-9 w-9 overflow-hidden rounded-lg ring-1 ring-navy-900/10">
            <Image src={logoUrl} alt="LADIRE logo" width={72} height={72} className="h-full w-full object-contain" />
          </span>
          <span className="font-display text-sm font-extrabold text-navy-950">My LADIRE</span>
        </Link>
        <button
          type="button"
          className="icon-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-7xl">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-navy-100 bg-white lg:flex">
          <div className="border-b border-navy-100 p-5">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-navy-900/10">
                <Image src={logoUrl} alt="LADIRE logo" width={88} height={88} className="h-full w-full object-contain" />
              </span>
              <span>
                <span className="block font-display text-sm font-extrabold leading-tight text-navy-950">{siteName}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-crimson-600">Member area</span>
              </span>
            </Link>
          </div>
          <nav aria-label="Dashboard" className="flex-1 space-y-1 p-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active(n.href, n.exact)
                    ? "bg-navy-900 text-white"
                    : "text-navy-700 hover:bg-navy-100"
                )}
              >
                <n.icon className="h-4.5 w-4.5" aria-hidden="true" />
                {n.label}
              </Link>
            ))}
            <Link
              href="/dashboard/notifications"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active("/dashboard/notifications")
                  ? "bg-navy-900 text-white"
                  : "text-navy-700 hover:bg-navy-100"
              )}
            >
              <Bell className="h-4.5 w-4.5" aria-hidden="true" />
              Notifications
              {unread > 0 ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-crimson-600 px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              ) : null}
            </Link>
          </nav>
          <div className="border-t border-navy-100 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-bold text-white">
                {(user.name || "U").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-950">{user.name || "Member"}</p>
                <p className="truncate text-xs text-navy-500">{user.email || "—"}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/" className="btn btn-ghost btn-sm">
                <Home className="h-4 w-4" aria-hidden="true" /> Website
              </Link>
              <form action={signOutUser}>
                <button type="submit" className="btn btn-outline btn-sm w-full">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Mobile nav */}
        {open ? (
          <div className="fixed inset-0 z-20 lg:hidden">
            <button className="absolute inset-0 bg-navy-950/50" aria-label="Close menu" onClick={() => setOpen(false)} />
            <nav aria-label="Dashboard" className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-white p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-display text-lg font-extrabold text-navy-950">Menu</p>
                <button type="button" className="icon-btn" aria-label="Close" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-1">
                {[...NAV, { href: "/dashboard/notifications", label: "Notifications", icon: Bell }].map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                      active(n.href, (n as { exact?: boolean }).exact)
                        ? "bg-navy-900 text-white"
                        : "text-navy-700 hover:bg-navy-100"
                    )}
                  >
                    <n.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    {n.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-navy-100 pt-4">
                <Link href="/" className="btn btn-outline btn-md w-full" onClick={() => setOpen(false)}>
                  <Home className="h-4 w-4" aria-hidden="true" /> Back to website
                </Link>
                <form action={signOutUser}>
                  <button type="submit" className="btn btn-ghost btn-md w-full">
                    <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
                  </button>
                </form>
              </div>
            </nav>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

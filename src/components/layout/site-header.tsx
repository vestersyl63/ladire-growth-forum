"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutUser } from "@/app/actions/auth-actions";

export type HeaderUser = { name?: string | null; email?: string | null } | null;

const NAV_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/events/daytime-hangout", label: "Daytime Hangout" },
  { href: "/events/vacation-programme", label: "Vacation Programme" },
  { href: "/awards", label: "Awards 2026" },
  { href: "/vote", label: "Vote" },
  { href: "/news", label: "News" },
  { href: "/join", label: "Join Us" },
  { href: "/contact", label: "Contact" },
];

const DESKTOP_LINKS = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/awards", label: "Awards 2026" },
  { href: "/vote", label: "Vote" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteHeader({
  siteName,
  tagline,
  logoUrl,
  websiteNote,
  user,
}: {
  siteName: string;
  tagline: string;
  logoUrl: string;
  websiteNote?: string;
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {websiteNote ? (
        <div className="bg-navy-950 text-center text-xs font-medium text-white/90">
          <p className="container-x py-2">{websiteNote}</p>
        </div>
      ) : null}

      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b transition-all duration-200",
          scrolled
            ? "border-navy-100 bg-white/90 shadow-sm backdrop-blur-md"
            : "border-transparent bg-white/80 backdrop-blur"
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="LADIRE Growth Forum — Home">
            <span className="block h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-navy-900/10">
              <Image
                src={logoUrl || "/brand/ladire-logo.png"}
                alt=""
                width={88}
                height={88}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-navy-950">
                {siteName || "LADIRE Growth Forum"}
              </span>
              <span className="truncate text-[10.5px] font-semibold uppercase tracking-[0.08em] text-crimson-600">
                {tagline || "Building Youth. Promoting Culture."}
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {DESKTOP_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(pathname, l.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                  isActive(pathname, l.href)
                    ? "bg-crimson-50 text-crimson-700"
                    : "text-navy-700 hover:bg-navy-50 hover:text-navy-950"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn-navy btn-sm hidden sm:inline-flex">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  href="/dashboard"
                  aria-label="Go to dashboard"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white sm:hidden"
                >
                  {(user.name || "U").charAt(0).toUpperCase()}
                </Link>
                <form action={signOutUser}>
                  <button type="submit" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Sign out</span>
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/join" className="btn btn-navy btn-sm hidden md:inline-flex">
                  Join LADIRE
                </Link>
                <Link href="/vote" className="btn btn-primary btn-sm hidden sm:inline-flex">
                  Vote Now
                </Link>
              </>
            )}

            <button
              type="button"
              className="icon-btn lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open ? (
          <div id="mobile-nav" className="border-t border-navy-100 bg-white lg:hidden">
            <nav aria-label="Mobile" className="container-x max-h-[70vh] overflow-y-auto py-3">
              <ul className="flex flex-col">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={isActive(pathname, l.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-[15px] font-semibold",
                        isActive(pathname, l.href)
                          ? "bg-crimson-50 text-crimson-700"
                          : "text-navy-800 hover:bg-navy-50"
                      )}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-col gap-2 border-t border-navy-100 pt-3 pb-2">
                {user ? (
                  <>
                    <Link href="/dashboard" className="btn btn-navy btn-md w-full">
                      <LayoutDashboard className="h-4 w-4" /> My Dashboard
                    </Link>
                    <form action={signOutUser}>
                      <button type="submit" className="btn btn-ghost btn-md w-full">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/vote" className="btn btn-primary btn-md w-full">
                      Vote Now
                    </Link>
                    <Link href="/join" className="btn btn-outline btn-md w-full">
                      Join LADIRE
                    </Link>
                    <Link href="/login" className="btn btn-ghost btn-md w-full">
                      <User className="h-4 w-4" /> Sign in
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
}

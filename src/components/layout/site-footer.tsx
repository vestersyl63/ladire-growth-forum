import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/settings";
import { MailIcon, PhoneIcon, SocialLinks, WhatsAppIcon } from "@/components/brand/icons";

export function SiteFooter({ settings }: { settings: PublicSiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-navy-950 text-white">
      {/* CTA strip */}
      <div className="border-b border-white/10 bg-navy-900">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <div>
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
              Be part of the <span className="text-flame-400">movement</span>.
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Join LADIRE Growth Forum — learn, connect, create and grow.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/join" className="btn btn-flame btn-md">
              Join LADIRE
            </Link>
            <Link href="/vote" className="btn btn-outline-light btn-md">
              Vote Now
            </Link>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="block h-12 w-12 overflow-hidden rounded-xl bg-white p-0.5">
              <Image
                src={settings.logoUrl || "/brand/ladire-logo.png"}
                alt="LADIRE Growth Forum logo"
                width={96}
                height={96}
                className="h-full w-full object-contain"
              />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-extrabold">{settings.siteName}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-olive-300">
                {settings.tagline.split(".")[0]}.
              </p>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/70">
            {settings.content?.aboutSummary
              ? String(settings.content.aboutSummary).slice(0, 160)
              : "Building Youth. Promoting Culture. Celebrating Creativity."}
            …
          </p>
          <SocialLinks socials={settings.socials} dark iconClassName="h-4.5 w-4.5" />
        </div>

        {/* Explore */}
        <nav aria-label="Footer — Explore">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/about" className="text-white/80 transition-colors hover:text-flame-300">About LADIRE</Link></li>
            <li><Link href="/events" className="text-white/80 transition-colors hover:text-flame-300">Events & Activities</Link></li>
            <li><Link href="/awards" className="text-white/80 transition-colors hover:text-flame-300">LADIRE Awards 2026</Link></li>
            <li><Link href="/vote" className="text-white/80 transition-colors hover:text-flame-300">Vote</Link></li>
            <li><Link href="/news" className="text-white/80 transition-colors hover:text-flame-300">News & Announcements</Link></li>
            <li><Link href="/join" className="text-white/80 transition-colors hover:text-flame-300">Membership</Link></li>
          </ul>
        </nav>

        {/* Programmes */}
        <nav aria-label="Footer — Programmes">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Programmes</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/events/daytime-hangout" className="text-white/80 transition-colors hover:text-flame-300">Daytime Hangout</Link></li>
            <li><Link href="/events/vacation-programme" className="text-white/80 transition-colors hover:text-flame-300">Vacation / Holiday Programme</Link></li>
            <li><Link href="/events" className="text-white/80 transition-colors hover:text-flame-300">Upcoming Events</Link></li>
            <li><Link href="/awards#faqs" className="text-white/80 transition-colors hover:text-flame-300">Awards FAQs</Link></li>
            <li><Link href="/voting-terms" className="text-white/80 transition-colors hover:text-flame-300">Voting Terms</Link></li>
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/60">Contact</h3>
          <ul className="space-y-3 text-sm">
            {settings.phones.map((p) => (
              <li key={p}>
                <a
                  href={`tel:${p.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-flame-300"
                >
                  <PhoneIcon className="h-4 w-4 shrink-0 text-olive-300" /> {p}
                </a>
              </li>
            ))}
            {settings.emails.map((e) => (
              <li key={e}>
                <a
                  href={`mailto:${e}`}
                  className="inline-flex items-center gap-2 break-all text-white/80 transition-colors hover:text-flame-300"
                >
                  <MailIcon className="h-4 w-4 shrink-0 text-olive-300" /> {e}
                </a>
              </li>
            ))}
            {settings.whatsapp ? (
              <li>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 transition-colors hover:text-emerald-300"
                >
                  <WhatsAppIcon className="h-4 w-4 shrink-0 text-emerald-400" /> WhatsApp
                </a>
              </li>
            ) : null}
            {settings.address ? (
              <li className="inline-flex items-start gap-2 text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive-300" /> {settings.address}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/60 sm:flex-row">
          <p>
            © {year} {settings.siteName}. All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Use</Link>
            <Link href="/voting-terms" className="hover:text-white">Voting Terms</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="h-3.5 w-3.5 fill-crimson-600 text-crimson-600" /> for young talent
          </p>
        </div>
      </div>
    </footer>
  );
}

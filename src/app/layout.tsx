import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "LADIRE Growth Forum — Building Youth. Promoting Culture. Celebrating Creativity.",
    template: "%s | LADIRE Growth Forum",
  },
  description:
    "LADIRE Growth Forum is a youth-focused community helping young people learn, connect, create, collaborate, grow and be recognised. Explore events, the LADIRE Youth & Entertainment Awards 2026, and more.",
  keywords: [
    "LADIRE Growth Forum",
    "LADIRE Awards 2026",
    "LADIRE Youth & Entertainment Awards",
    "youth development",
    "youth entertainment",
    "culture",
    "creativity",
    "community",
    "events",
    "Nigeria",
  ],
  applicationName: "LADIRE Growth Forum",
  openGraph: {
    type: "website",
    siteName: "LADIRE Growth Forum",
    title: "LADIRE Growth Forum — Building Youth. Promoting Culture. Celebrating Creativity.",
    description:
      "A youth-focused community where young people learn, connect, create, collaborate, grow and are recognised. LADIRE Youth & Entertainment Awards 2026 voting is open.",
    images: [{ url: "/brand/og-base.png", width: 1200, height: 630, alt: "LADIRE Growth Forum" }],
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "LADIRE Growth Forum",
    description: "Building Youth. Promoting Culture. Celebrating Creativity.",
    images: ["/brand/og-base.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${sora.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

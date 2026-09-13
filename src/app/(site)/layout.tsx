import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getPublicSiteSettings } from "@/lib/site";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([getPublicSiteSettings(), getSession()]);
  const user = session?.user
    ? { name: session.user.name, email: session.user.email }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:m-3 focus:rounded-lg focus:bg-navy-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <SiteHeader
        siteName={settings.siteName}
        tagline={settings.tagline}
        logoUrl={settings.logoUrl}
        websiteNote={settings.websiteNote}
        user={user}
      />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}

import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/site";
import { toParagraphs } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for LADIRE Growth Forum.",
};

export default async function PrivacyPage() {
  const settings = await getPublicSiteSettings();
  const paragraphs = toParagraphs(settings.legal.privacyPolicy);

  return (
    <PageShell title="Privacy Policy">
      {paragraphs.length ? (
        paragraphs.map((p, i) => (
          <p key={i} className="prose-sm">
            {p}
          </p>
        ))
      ) : (
        <p className="italic text-navy-500">
          The organisation’s privacy policy will appear here.
        </p>
      )}
    </PageShell>
  );
}

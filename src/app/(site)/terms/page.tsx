import type { Metadata } from "next";
import { getPublicSiteSettings } from "@/lib/site";
import { toParagraphs } from "@/lib/utils";
import { PageShell } from "@/components/layout/page-shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Website terms of use for LADIRE Growth Forum.",
};

export default async function TermsPage() {
  const settings = await getPublicSiteSettings();
  const paragraphs = toParagraphs(settings.legal.termsOfUse);

  return (
    <PageShell title="Terms of Use">
      {paragraphs.length ? (
        paragraphs.map((p, i) => (
          <p key={i} className="prose-sm">
            {p}
          </p>
        ))
      ) : (
        <p className="italic text-navy-500">
          The organisation’s website terms of use will appear here.
        </p>
      )}
    </PageShell>
  );
}

import type { Metadata } from "next";

import { DEFAULT_SETTINGS, SETTING_GROUPS, getSettingsMap } from "@/lib/settings";
import { requireAdmin } from "@/lib/admin-auth";
import { SettingsGroupForm } from "@/components/admin/settings-group-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site settings", robots: { index: false } };

export default async function AdminSettingsPage() {
  await requireAdmin(["SUPER_ADMIN", "ADMIN"]);
  const map = await getSettingsMap();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Site settings</h1>
        <p className="text-sm text-navy-500">
          Contact details, bank transfer information, social links, SEO and site content shown across the public pages.
        </p>
      </header>

      <div className="space-y-6">
        {SETTING_GROUPS.map((g) => {
          const defs = DEFAULT_SETTINGS.filter((d) => d.group === g.key).map((d) => ({
            key: d.key,
            type: d.type,
            label: d.label,
            description: d.description,
            defaultValue: d.defaultValue,
          }));
          if (defs.length === 0) return null;
          return (
            <section key={g.key} className="card max-w-3xl p-5">
              <h2 className="font-display text-lg font-extrabold text-navy-950">{g.label}</h2>
              <div className="mt-4">
                <SettingsGroupForm group={g.key} defs={defs} values={map} />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

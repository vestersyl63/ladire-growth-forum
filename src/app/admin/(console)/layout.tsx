import { getAdminSession } from "@/lib/admin-auth";
import { allowedSectionsFor } from "@/lib/admin-permissions";
import { getPublicSiteSettings } from "@/lib/site";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin/login");

  const [settings, pending] = await Promise.all([
    getPublicSiteSettings(),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
    }),
  ]);

  return (
    <AdminShell
      allowed={allowedSectionsFor(admin.role)}
      user={{ name: admin.name, role: admin.role }}
      siteName={settings.siteName}
      logoUrl={settings.logoUrl}
      pendingCount={pending}
    >
      {children}
    </AdminShell>
  );
}

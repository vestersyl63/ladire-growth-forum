import { requireUser } from "@/app/actions/user-actions";
import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings } from "@/lib/site";
import { DashShell } from "@/components/dashboard/dash-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const [user, settings, unread] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id! } }),
    getPublicSiteSettings(),
    prisma.notification.count({ where: { userId: session.user.id!, isRead: false } }),
  ]);

  return (
    <DashShell
      user={{ name: user?.name, email: user?.email }}
      unread={unread}
      logoUrl={settings.logoUrl}
      siteName={settings.siteName}
    >
      {children}
    </DashShell>
  );
}

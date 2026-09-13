import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { fmtDateTime } from "@/lib/utils";
import { StatusPill } from "@/components/user/status-pill";
import { setContactStatus, deleteContactMessage } from "@/app/actions/admin-people-actions";
import { fa, fb } from "@/lib/form-action";
import { ConfirmForm } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contact messages", robots: { index: false } };

export default async function AdminContactsPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-navy-950">Contact messages</h1>
        <p className="text-sm text-navy-500">{messages.length} messages (latest 200)</p>
      </header>

      <div className="space-y-4">
        {messages.map((m) => (
          <article key={m.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-extrabold text-navy-950">{m.subject || "No subject"}</p>
                <p className="text-sm text-navy-500">
                  {m.name} · {m.email || m.phone || "no contact"} · {fmtDateTime(m.createdAt)}
                </p>
              </div>
              <StatusPill status={m.status} />
            </div>
            <p className="mt-3 whitespace-pre-wrap rounded-xl bg-navy-50/70 p-4 text-sm text-navy-800">
              {m.message}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {m.status !== "RESOLVED" ? (
                <form action={fa(setContactStatus, m.id, "RESOLVED")}>
                  <button type="submit" className="btn btn-success btn-sm">Mark resolved</button>
                </form>
              ) : null}
              {m.status === "NEW" ? (
                <form action={fa(setContactStatus, m.id, "IN_PROGRESS")}>
                  <button type="submit" className="btn btn-outline btn-sm">In progress</button>
                </form>
              ) : null}
              <form action={fa(setContactStatus, m.id, "NEW")}>
                <button type="submit" className="btn btn-ghost btn-sm">Reopen</button>
              </form>
              <ConfirmForm action={fb(deleteContactMessage, m.id)} message="Delete this message permanently?">
                <button type="submit" className="btn btn-ghost btn-sm text-crimson-600">Delete</button>
              </ConfirmForm>
            </div>
          </article>
        ))}
        {messages.length === 0 ? (
          <p className="card px-4 py-12 text-center text-sm text-navy-500">No messages yet.</p>
        ) : null}
      </div>
    </div>
  );
}

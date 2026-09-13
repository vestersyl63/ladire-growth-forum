"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn, timeAgoLabel } from "@/lib/utils";
import { markNotificationRead } from "@/app/actions/user-actions";

type Item = {
  id: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
  link: string | null;
};

export function NotificationsClient({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    markNotificationRead(id).catch(() => undefined);
  };

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      {unread > 0 ? <p className="text-sm font-semibold text-navy-500">{unread} unread</p> : null}
      <ul className="space-y-2">
        {items.map((n) => (
          <li
            key={n.id}
            className={cn(
              "card flex items-start gap-3 p-4",
              !n.isRead && "border-crimson-200 bg-crimson-50/40"
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                !n.isRead ? "bg-crimson-600 text-white" : "bg-navy-100 text-navy-500"
              )}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-navy-950">{n.title}</p>
                <span className="shrink-0 text-xs text-navy-400">{timeAgoLabel(n.createdAt)}</span>
              </div>
              {n.body ? <p className="mt-0.5 text-sm text-navy-600">{n.body}</p> : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {n.link ? (
                  <Link
                    href={n.link}
                    className="text-sm font-bold text-crimson-600 hover:underline"
                    onClick={() => {
                      if (!n.isRead) markRead(n.id);
                    }}
                  >
                    Open →
                  </Link>
                ) : null}
                {!n.isRead ? (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-navy-500 hover:text-navy-800"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Mark as read
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

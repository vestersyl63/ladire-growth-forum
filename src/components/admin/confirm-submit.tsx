"use client";

import type { FormEvent, ReactNode } from "react";

/**
 * Wraps a <form> that posts to a server action and asks for confirmation
 * first (native confirm dialog is used for breadth; it is accessible and
 * keyboard-friendly). When `noConfirm` is set, posts straight through.
 *
 * `action` must be a bound server action reference (e.g.
 * `deleteEvent.bind(null, id)`) — server actions are the only functions that
 * may cross the RSC boundary.
 */
export function ConfirmForm({
  action,
  message,
  children,
  className,
  noConfirm = false,
}: {
  action: (payload: FormData) => unknown;
  message: string;
  children: ReactNode;
  className?: string;
  noConfirm?: boolean;
}) {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (!noConfirm && !window.confirm(message)) e.preventDefault();
  };
  return (
    <form
      // React's DOM types only accept void-returning actions, but Next.js
      // server actions may return payloads that are simply ignored on submit.
      action={action as unknown as (payload: FormData) => void}
      onSubmit={onSubmit}
      className={className}
    >
      {children}
    </form>
  );
}

"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingText = "Please wait…",
  type = "primary",
  disabled,
}: {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  type?: "primary" | "navy" | "olive" | "outline" | "danger" | "ghost" | "gold" | "whatsapp" | "success";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const base =
    type === "primary"
      ? "btn btn-primary"
      : type === "navy"
        ? "btn btn-navy"
        : type === "olive"
          ? "btn btn-olive"
          : type === "outline"
            ? "btn btn-outline"
            : type === "danger"
              ? "btn btn-danger"
              : type === "ghost"
                ? "btn btn-ghost"
                : type === "gold"
                  ? "btn btn-gold"
                  : type === "whatsapp"
                    ? "btn btn-whatsapp"
                    : "btn btn-success";
  return (
    <button type="submit" disabled={pending || disabled} className={cn(base, "btn-md", className)}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

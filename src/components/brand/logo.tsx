import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official LADIRE logo. The source artwork sits on a white canvas, so when
 * rendered on a dark background we place it inside a white rounded card.
 */
export function LogoMark({
  className,
  imgClassName,
  onDark = false,
  sizes = "96px",
}: {
  className?: string;
  imgClassName?: string;
  onDark?: boolean;
  sizes?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-navy-900/10",
        className
      )}
    >
      <Image
        src="/brand/ladire-logo.png"
        alt="LADIRE Growth Forum logo"
        width={480}
        height={480}
        sizes={sizes}
        className={cn("h-auto w-full object-contain", imgClassName)}
        priority
      />
      {onDark ? null : null}
    </span>
  );
}

export function SiteWordmark({
  siteName,
  className,
  textClassName,
}: {
  siteName?: string | null;
  className?: string;
  textClassName?: string;
}) {
  const name = siteName || "LADIRE Growth Forum";
  // Split so "LADIRE" is emphasized, rest follows.
  return (
    <span className={cn("leading-none", className)}>
      <span className={cn("font-display font-extrabold tracking-tight", textClassName)}>{name}</span>
    </span>
  );
}

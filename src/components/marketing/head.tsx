import { cn } from "@/lib/utils";

export function SectionHead({
  eyebrow,
  title,
  sub,
  align = "left",
  light = false,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  align?: "left" | "center";
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? (
        <p className={cn("eyebrow mb-2", align === "center" && "flex items-center justify-center")}>
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "h-display text-3xl sm:text-4xl",
          light && "text-white"
        )}
      >
        {title}
      </h2>
      {sub ? (
        <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", light ? "text-white/75" : "text-navy-600")}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

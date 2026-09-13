"use client";

import { useEffect, useState } from "react";

function diffParts(target: number) {
  const now = Date.now();
  const diff = Math.max(0, target - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[64px] flex-col items-center rounded-xl border border-white/15 bg-white/10 px-2 py-2.5 backdrop-blur-sm sm:min-w-[76px] sm:py-3">
      <span className="font-display text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
        {label}
      </span>
    </div>
  );
}

export function Countdown({
  target,
  liveLabel = "Voting is live now — cast your votes!",
  closedLabel = "Voting has closed.",
  ariaLabel = "Countdown to the voting deadline",
}: {
  target: string | Date;
  liveLabel?: string;
  closedLabel?: string;
  ariaLabel?: string;
}) {
  const t = typeof target === "string" ? new Date(target).getTime() : target.getTime();
  const [parts, setParts] = useState(() => diffParts(t));

  useEffect(() => {
    const id = setInterval(() => setParts(diffParts(t)), 1000);
    return () => clearInterval(id);
  }, [t]);

  if (parts.done) {
    return (
      <p role="status" className="font-semibold text-flame-300">
        {closedLabel}
      </p>
    );
  }

  return (
    <div role="timer" aria-label={ariaLabel} className="space-y-2">
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        <Cell value={parts.days} label="Days" />
        <Cell value={parts.hours} label="Hours" />
        <Cell value={parts.minutes} label="Mins" />
        <Cell value={parts.seconds} label="Secs" />
      </div>
      <p className="text-sm font-medium text-white/80">{liveLabel}</p>
    </div>
  );
}

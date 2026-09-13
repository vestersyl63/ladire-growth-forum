import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, MapPin, Ticket, Users } from "lucide-react";
import { fmtDate, fmtDateTime, formatNaira } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type EventCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  category: string;
  startsAt: Date | string;
  endsAt: Date | string | null;
  venue: string | null;
  location: string | null;
  priceInKobo: number | null;
  participation: string;
  capacity: number | null;
  _count?: { registrations?: number; bookings?: number } | null;
  status: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  AWARDS: "bg-gold-400 text-navy-950",
  DAYTIME_HANGOUT: "bg-flame-100 text-flame-800",
  VACATION_PROGRAMME: "bg-olive-100 text-olive-800",
  WORKSHOP: "bg-navy-100 text-navy-800",
  TRAINING: "bg-navy-100 text-navy-800",
  COMMUNITY: "bg-crimson-100 text-crimson-800",
  CULTURAL: "bg-olive-100 text-olive-800",
  OTHER: "bg-navy-50 text-navy-600",
};

export function categoryLabel(cat: string) {
  const map: Record<string, string> = {
    AWARDS: "Awards",
    DAYTIME_HANGOUT: "Daytime Hangout",
    VACATION_PROGRAMME: "Vacation Programme",
    WORKSHOP: "Workshop",
    TRAINING: "Training",
    COMMUNITY: "Community",
    CULTURAL: "Cultural",
    OTHER: "Event",
  };
  return map[cat] ?? cat;
}

export function EventCard({ event, className }: { event: EventCardData; className?: string }) {
  const d = event.startsAt instanceof Date ? event.startsAt : new Date(event.startsAt);
  const free = event.priceInKobo == null || event.priceInKobo === 0;
  const cancelled = event.status === "CANCELLED";

  return (
    <Link
      href={`/events/${event.slug}`}
      className={cn(
        "card card-hover group flex flex-col overflow-hidden text-left",
        cancelled && "opacity-70",
        className
      )}
    >
      <div className="relative h-44 overflow-hidden bg-navy-100">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-800 via-navy-900 to-crimson-950">
            <CalendarDays className="h-10 w-10 text-white/30" aria-hidden="true" />
          </div>
        )}
        <span
          className={cn(
            "chip absolute left-3 top-3 backdrop-blur",
            CATEGORY_COLORS[event.category] ?? "bg-white/90 text-navy-900"
          )}
        >
          {categoryLabel(event.category)}
        </span>
        {cancelled ? (
          <span className="chip absolute right-3 top-3 bg-white/95 text-crimson-700">Cancelled</span>
        ) : null}
        <span
          className={cn(
            "chip absolute bottom-3 right-3",
            free ? "bg-emerald-600 text-white" : "bg-navy-950/85 text-white"
          )}
        >
          {free ? "Free" : formatNaira(event.priceInKobo)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-lg font-bold text-navy-950 group-hover:text-crimson-700">
          {event.title}
        </h3>
        <div className="mt-2 space-y-1.5 text-sm text-navy-600">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
            {fmtDate(event.startsAt, "EEE, d MMM yyyy")}
            <span className="text-navy-400">•</span>
            <Clock className="h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
            {fmtDateTime(event.startsAt, "h:mm a")}
          </p>
          {event.venue || event.location ? (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-crimson-600" aria-hidden="true" />
              <span className="truncate">{event.venue || event.location}</span>
            </p>
          ) : null}
        </div>
        {event.summary ? (
          <p className="mt-3 line-clamp-2 text-sm text-navy-600">{event.summary}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-navy-500">
            <Ticket className="h-4 w-4" aria-hidden="true" />
            {event.participation === "NONE"
              ? "Open event"
              : event.participation === "BOTH"
                ? "Register or book"
                : event.participation === "BOOKING"
                  ? "Bookings open"
                  : "Register to attend"}
          </span>
          <span className="text-sm font-bold text-crimson-600 transition-transform group-hover:translate-x-0.5">
            Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EventCardData } from "@/features/events/types";

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="size-8 text-muted-foreground" />
          </div>
        )}
        {event.category ? (
          <Badge className="absolute top-3 left-3 bg-background/90 backdrop-blur">
            {event.category.name}
          </Badge>
        ) : null}
        {event.isSoldOut ? (
          <Badge variant="destructive" className="absolute top-3 right-3">
            Sold out
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 leading-snug font-semibold transition-colors group-hover:text-primary">
          {event.title}
        </h3>

        <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="size-4 shrink-0" />
            {formatDate(event.startAt, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {event.isOnline ? "Online event" : (event.city ?? "Venue TBA")}
            </span>
          </p>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="font-semibold">
              {event.priceFrom === 0 ? "Free" : formatMoney(event.priceFrom)}
            </p>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            {event.seatsLeft} left
          </p>
        </div>
      </div>
    </Link>
  );
}

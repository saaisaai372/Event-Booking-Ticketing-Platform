import type { Prisma } from "@prisma/client";

export const eventCardInclude = {
  category: true,
  organizer: { select: { id: true, name: true, avatarUrl: true } },
  ticketTypes: { where: { isActive: true }, orderBy: { price: "asc" } },
} satisfies Prisma.EventInclude;

export type EventWithCardRelations = Prisma.EventGetPayload<{
  include: typeof eventCardInclude;
}>;

/** Serialisable shape handed to client components. */
export interface EventCardData {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bannerUrl: string | null;
  city: string | null;
  isOnline: boolean;
  startAt: string;
  endAt: string;
  status: string;
  category: { name: string; slug: string } | null;
  organizer: { id: string; name: string; avatarUrl: string | null };
  priceFrom: number;
  seatsLeft: number;
  isSoldOut: boolean;
}

export function toEventCard(event: EventWithCardRelations): EventCardData {
  const ticketTypes = event.ticketTypes;
  const priceFrom = ticketTypes.length
    ? Math.min(...ticketTypes.map((type) => type.price))
    : 0;
  const seatsLeft = ticketTypes.reduce(
    (total, type) => total + Math.max(0, type.quantity - type.sold),
    0,
  );

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    bannerUrl: event.bannerUrl,
    city: event.city,
    isOnline: event.isOnline,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    status: event.status,
    category: event.category
      ? { name: event.category.name, slug: event.category.slug }
      : null,
    organizer: {
      id: event.organizer.id,
      name: event.organizer.name,
      avatarUrl: event.organizer.avatarUrl,
    },
    priceFrom,
    seatsLeft,
    isSoldOut: ticketTypes.length > 0 && seatsLeft === 0,
  };
}

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  eventCardInclude,
  toEventCard,
  type EventCardData,
} from "@/features/events/types";

export interface EventFilters {
  search?: string;
  category?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "date_asc" | "date_desc" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
  includePast?: boolean;
}

function buildWhere(filters: EventFilters): Prisma.EventWhereInput {
  const now = new Date();
  const and: Prisma.EventWhereInput[] = [{ status: "APPROVED" }];

  if (!filters.includePast) {
    and.push({ endAt: { gte: now } });
  }
  if (filters.search) {
    and.push({
      OR: [
        { title: { contains: filters.search } },
        { summary: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    });
  }
  if (filters.category) {
    and.push({ category: { slug: filters.category } });
  }
  if (filters.city) {
    and.push({ city: filters.city });
  }
  if (filters.dateFrom || filters.dateTo) {
    and.push({
      startAt: {
        ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      },
    });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    and.push({
      ticketTypes: {
        some: {
          isActive: true,
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
          },
        },
      },
    });
  }

  return { AND: and };
}

function buildOrderBy(sort: EventFilters["sort"]): Prisma.EventOrderByWithRelationInput {
  switch (sort) {
    case "date_desc":
      return { startAt: "desc" };
    case "price_asc":
      return { ticketTypes: { _count: "asc" } };
    case "price_desc":
      return { ticketTypes: { _count: "desc" } };
    default:
      return { startAt: "asc" };
  }
}

/** Browse approved events with search, filters, sorting and pagination. */
export async function listEvents(filters: EventFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, filters.pageSize ?? DEFAULT_PAGE_SIZE);

  let events = await prisma.event.findMany({
    where: buildWhere(filters),
    include: eventCardInclude,
    orderBy: buildOrderBy(filters.sort),
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // Price sorting is applied in memory because it depends on the cheapest
  // active ticket type, which Prisma cannot order by directly.
  if (filters.sort === "price_asc" || filters.sort === "price_desc") {
    const direction = filters.sort === "price_asc" ? 1 : -1;
    events = events.sort(
      (a, b) =>
        direction * ((a.ticketTypes[0]?.price ?? 0) - (b.ticketTypes[0]?.price ?? 0)),
    );
  }

  return events.map(toEventCard);
}

export async function countEvents(filters: EventFilters = {}) {
  return prisma.event.count({ where: buildWhere(filters) });
}

export async function listFeaturedEvents(limit = 6): Promise<EventCardData[]> {
  const events = await prisma.event.findMany({
    where: { status: "APPROVED", startAt: { gte: new Date() } },
    include: eventCardInclude,
    orderBy: { startAt: "asc" },
    take: limit,
  });
  return events.map(toEventCard);
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      organizer: { select: { id: true, name: true, avatarUrl: true } },
      ticketTypes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

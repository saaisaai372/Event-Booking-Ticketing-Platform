import { platformStats, revenueTrend } from "@/features/admin/admin.service";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export interface AttendeeDashboard {
  upcomingBookings: number;
  ticketsHeld: number;
  totalSpent: number;
  nextEvent: { title: string; slug: string; startAt: string } | null;
  recentBookings: {
    id: string;
    code: string;
    status: string;
    total: number;
    eventTitle: string;
  }[];
}

export interface OrganizerDashboard {
  events: number;
  publishedEvents: number;
  pendingEvents: number;
  ticketsSold: number;
  revenue: number;
  checkedIn: number;
  trend: { month: string; revenue: number }[];
}

export async function getAttendeeDashboard(userId: string): Promise<AttendeeDashboard> {
  const [upcomingBookings, ticketsHeld, spend, nextBooking, recent] = await Promise.all([
    prisma.booking.count({
      where: { userId, status: "CONFIRMED", event: { endAt: { gte: new Date() } } },
    }),
    prisma.ticket.count({ where: { userId, status: "VALID" } }),
    prisma.booking.aggregate({
      where: { userId, status: "CONFIRMED" },
      _sum: { total: true },
    }),
    prisma.booking.findFirst({
      where: { userId, status: "CONFIRMED", event: { startAt: { gte: new Date() } } },
      orderBy: { event: { startAt: "asc" } },
      include: { event: { select: { title: true, slug: true, startAt: true } } },
    }),
    prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { event: { select: { title: true } } },
    }),
  ]);

  return {
    upcomingBookings,
    ticketsHeld,
    totalSpent: spend._sum.total ?? 0,
    nextEvent: nextBooking
      ? {
          title: nextBooking.event.title,
          slug: nextBooking.event.slug,
          startAt: nextBooking.event.startAt.toISOString(),
        }
      : null,
    recentBookings: recent.map((booking) => ({
      id: booking.id,
      code: booking.code,
      status: booking.status,
      total: booking.total,
      eventTitle: booking.event.title,
    })),
  };
}

export async function getOrganizerDashboard(userId: string): Promise<OrganizerDashboard> {
  const [events, publishedEvents, pendingEvents, revenue, ticketsSold, checkedIn, trend] =
    await Promise.all([
      prisma.event.count({ where: { organizerId: userId } }),
      prisma.event.count({ where: { organizerId: userId, status: "APPROVED" } }),
      prisma.event.count({ where: { organizerId: userId, status: "PENDING" } }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED", event: { organizerId: userId } },
        _sum: { total: true },
      }),
      prisma.ticket.count({
        where: { event: { organizerId: userId }, status: { in: ["VALID", "USED"] } },
      }),
      prisma.ticket.count({ where: { event: { organizerId: userId }, status: "USED" } }),
      revenueTrend(userId),
    ]);

  return {
    events,
    publishedEvents,
    pendingEvents,
    ticketsSold,
    revenue: revenue._sum.total ?? 0,
    checkedIn,
    trend,
  };
}

export async function getDashboard(user: { id: string; role: Role }) {
  if (user.role === "ADMIN") {
    return { role: "ADMIN" as const, stats: await platformStats() };
  }
  if (user.role === "ORGANIZER") {
    return { role: "ORGANIZER" as const, ...(await getOrganizerDashboard(user.id)) };
  }
  return { role: "ATTENDEE" as const, ...(await getAttendeeDashboard(user.id)) };
}

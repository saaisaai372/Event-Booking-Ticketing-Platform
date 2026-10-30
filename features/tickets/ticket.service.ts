import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export type TicketScope = "upcoming" | "past" | "all";

const ticketInclude = {
  event: {
    select: {
      id: true,
      title: true,
      slug: true,
      startAt: true,
      endAt: true,
      bannerUrl: true,
      city: true,
      isOnline: true,
      venueName: true,
      venueAddress: true,
      onlineUrl: true,
    },
  },
  ticketType: { select: { name: true, price: true } },
  booking: { select: { code: true, status: true } },
} as const;

export async function listMyTickets(userId: string, scope: TicketScope = "all") {
  const now = new Date();
  const where =
    scope === "upcoming"
      ? { userId, status: { in: ["VALID", "USED"] }, event: { endAt: { gte: now } } }
      : scope === "past"
        ? { userId, event: { endAt: { lt: now } } }
        : { userId };

  return prisma.ticket.findMany({
    where,
    include: ticketInclude,
    orderBy: { event: { startAt: scope === "past" ? "desc" : "asc" } },
  });
}

export async function getTicketForUser(
  userId: string,
  ticketId: string,
  isAdmin = false,
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: ticketInclude,
  });
  if (!ticket) throw Errors.notFound("Ticket not found.");
  if (!isAdmin && ticket.userId !== userId) throw Errors.forbidden();
  return ticket;
}

/** Resolve a scanned QR token or printed ticket code to its ticket. */
export async function findTicketByScan(value: string) {
  const trimmed = value.trim();
  return prisma.ticket.findFirst({
    where: { OR: [{ qrToken: trimmed }, { code: trimmed }] },
    include: {
      event: { select: { id: true, title: true, organizerId: true } },
      ticketType: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

/**
 * Check a ticket in. A ticket can only be used once — the conditional update
 * makes concurrent scans of the same ticket fail safely.
 */
export async function checkInTicket(
  scannerId: string,
  scanValue: string,
  isAdmin = false,
) {
  const ticket = await findTicketByScan(scanValue);
  if (!ticket) throw Errors.notFound("No ticket matches that code.");

  if (!isAdmin && ticket.event.organizerId !== scannerId) {
    throw Errors.forbidden("You can only check in tickets for your own events.");
  }
  if (ticket.status === "CANCELLED") {
    throw Errors.badRequest("This ticket was cancelled.");
  }
  if (ticket.status === "USED") {
    throw Errors.conflict(
      `Already checked in at ${ticket.checkedInAt?.toISOString() ?? "an earlier time"}.`,
    );
  }

  const updated = await prisma.ticket.updateMany({
    where: { id: ticket.id, status: "VALID" },
    data: { status: "USED", checkedInAt: new Date(), checkedInBy: scannerId },
  });
  if (updated.count === 0) {
    throw Errors.conflict("This ticket has already been checked in.");
  }

  return {
    ticketId: ticket.id,
    code: ticket.code,
    ticketType: ticket.ticketType.name,
    attendee: ticket.user.name,
    event: ticket.event.title,
  };
}

export async function listEventAttendees(
  eventId: string,
  organizerId: string,
  isAdmin = false,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });
  if (!event) throw Errors.notFound("Event not found.");
  if (!isAdmin && event.organizerId !== organizerId) throw Errors.forbidden();

  return prisma.ticket.findMany({
    where: { eventId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      ticketType: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Sales aggregates for the organizer dashboard. */
export async function getEventStats(eventId: string) {
  const [revenue, ticketsSold, checkedIn, bookings] = await Promise.all([
    prisma.booking.aggregate({
      where: { eventId, status: "CONFIRMED" },
      _sum: { total: true },
    }),
    prisma.ticket.count({ where: { eventId, status: { in: ["VALID", "USED"] } } }),
    prisma.ticket.count({ where: { eventId, status: "USED" } }),
    prisma.booking.count({ where: { eventId, status: "CONFIRMED" } }),
  ]);

  return {
    revenue: revenue._sum.total ?? 0,
    ticketsSold,
    checkedIn,
    bookings,
  };
}

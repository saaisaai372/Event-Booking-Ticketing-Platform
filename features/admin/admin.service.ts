import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export async function listEventsForReview(status: string) {
  return prisma.event.findMany({
    where: { status },
    include: {
      organizer: { select: { id: true, name: true, email: true, avatarUrl: true } },
      category: { select: { name: true, slug: true } },
      ticketTypes: { select: { id: true, price: true, quantity: true, sold: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function approveEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Errors.notFound("Event not found.");
  if (event.status === "APPROVED") return event;

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "APPROVED", publishedAt: new Date(), rejectionReason: null },
  });

  await prisma.notification.create({
    data: {
      userId: event.organizerId,
      type: "EVENT_APPROVED",
      title: "Event approved",
      message: `${event.title} is now live and open for bookings.`,
      link: `/events/${event.slug}`,
    },
  });

  return updated;
}

export async function rejectEvent(eventId: string, reason: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Errors.notFound("Event not found.");

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "REJECTED", rejectionReason: reason },
  });

  await prisma.notification.create({
    data: {
      userId: event.organizerId,
      type: "EVENT_REJECTED",
      title: "Event needs changes",
      message: `${event.title} was not approved: ${reason}`,
      link: `/organizer/events`,
    },
  });

  return updated;
}

export async function listUsers(search?: string) {
  return prisma.user.findMany({
    where: search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizerStatus: true,
      emailVerified: true,
      isActive: true,
      createdAt: true,
      _count: { select: { events: true, bookings: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateUser(
  userId: string,
  input: { role?: Role; isActive?: boolean; organizerStatus?: string },
  actingAdminId: string,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.notFound("User not found.");

  if (user.id === actingAdminId && input.role && input.role !== "ADMIN") {
    throw Errors.badRequest("You cannot remove your own admin access.");
  }
  if (user.id === actingAdminId && input.isActive === false) {
    throw Errors.badRequest("You cannot deactivate your own account.");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.role ? { role: input.role } : {}),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
      ...(input.organizerStatus ? { organizerStatus: input.organizerStatus } : {}),
    },
  });

  if (input.organizerStatus === "APPROVED") {
    await prisma.notification.create({
      data: {
        userId,
        type: "ORGANIZER_APPROVED",
        title: "Organizer access approved",
        message: "You can now create and publish events.",
        link: "/organizer/events/new",
      },
    });
  } else if (input.organizerStatus === "REJECTED") {
    await prisma.notification.create({
      data: {
        userId,
        type: "ORGANIZER_REJECTED",
        title: "Organizer request declined",
        message: "Your request for organizer access was declined.",
        link: "/profile",
      },
    });
  }

  return updated;
}

export async function platformStats() {
  const [
    users,
    organizers,
    events,
    approvedEvents,
    pendingEvents,
    bookings,
    confirmedBookings,
    revenue,
    tickets,
    checkedIn,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ORGANIZER" } }),
    prisma.event.count(),
    prisma.event.count({ where: { status: "APPROVED" } }),
    prisma.event.count({ where: { status: "PENDING" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.aggregate({ where: { status: "CONFIRMED" }, _sum: { total: true } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: "USED" } }),
  ]);

  const byCategory = await prisma.category.findMany({
    select: {
      name: true,
      _count: { select: { events: true } },
    },
    orderBy: { name: "asc" },
  });

  return {
    users,
    organizers,
    events,
    approvedEvents,
    pendingEvents,
    bookings,
    confirmedBookings,
    revenue: revenue._sum.total ?? 0,
    tickets,
    checkedIn,
    byCategory: byCategory.map((row) => ({
      name: row.name,
      events: row._count.events,
    })),
  };
}

/** Monthly confirmed-booking revenue for the last 6 months (for charts). */
export async function revenueTrend(organizerId?: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      confirmedAt: { gte: since },
      ...(organizerId ? { event: { organizerId } } : {}),
    },
    select: { confirmedAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let index = 0; index < 6; index += 1) {
    const date = new Date(since);
    date.setMonth(since.getMonth() + index);
    buckets.set(date.toLocaleString("en-IN", { month: "short" }), 0);
  }

  for (const booking of bookings) {
    if (!booking.confirmedAt) continue;
    const key = booking.confirmedAt.toLocaleString("en-IN", { month: "short" });
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + booking.total);
  }

  return [...buckets.entries()].map(([month, revenue]) => ({ month, revenue }));
}

import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { HOLD_TTL_MINUTES } from "@/lib/constants";
import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { BookingStatus, NotificationType } from "@/types";

function bookingCode() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `EVT-${stamp}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

/**
 * Atomically reserve `quantity` seats for a ticket type.
 * The conditional UPDATE is the guard against overselling: it only succeeds when
 * `sold + quantity <= quantity` still holds, so concurrent checkouts cannot
 * push sales past capacity.
 */
async function reserveSeats(
  tx: Prisma.TransactionClient,
  ticketTypeId: string,
  quantity: number,
) {
  const affected = await tx.$executeRaw`
    UPDATE "TicketType"
    SET "sold" = "sold" + ${quantity}
    WHERE "id" = ${ticketTypeId} AND "sold" + ${quantity} <= "quantity"
  `;
  if (affected === 0) {
    throw Errors.conflict("Those tickets just sold out. Please pick another type.");
  }
}

async function releaseSeats(
  tx: Prisma.TransactionClient,
  ticketTypeId: string,
  quantity: number,
) {
  await tx.$executeRaw`
    UPDATE "TicketType"
    SET "sold" = MAX(0, "sold" - ${quantity})
    WHERE "id" = ${ticketTypeId}
  `;
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  await prisma.notification.create({ data: input });
}

/**
 * Release seat holds whose 10-minute window elapsed without payment.
 * Called lazily before operations that read availability, so a background job
 * is not required for correctness.
 */
export async function releaseExpiredHolds() {
  const expired = await prisma.seatHold.findMany({
    where: { status: "HELD", expiresAt: { lt: new Date() } },
    select: { id: true, ticketTypeId: true, quantity: true, bookingId: true },
    take: 200,
  });
  if (expired.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const hold of expired) {
      await releaseSeats(tx, hold.ticketTypeId, hold.quantity);
      await tx.seatHold.update({
        where: { id: hold.id },
        data: { status: "EXPIRED" },
      });
      if (hold.bookingId) {
        await tx.booking.updateMany({
          where: { id: hold.bookingId, status: "PENDING" },
          data: { status: "EXPIRED" },
        });
      }
    }
  });

  return expired.length;
}

export interface HoldRequest {
  items: { ticketTypeId: string; quantity: number }[];
  couponCode?: string;
}

/** Validate a requested basket against availability, windows and coupons. */
async function priceBasket(
  tx: Prisma.TransactionClient,
  eventId: string,
  items: HoldRequest["items"],
  couponCode?: string,
) {
  const now = new Date();
  const types = await tx.ticketType.findMany({
    where: { id: { in: items.map((item) => item.ticketTypeId) }, eventId },
  });

  if (types.length !== items.length) {
    throw Errors.badRequest("One or more ticket types are invalid for this event.");
  }

  let subtotal = 0;
  const priced: { ticketTypeId: string; quantity: number; unitPrice: number }[] = [];

  for (const item of items) {
    const type = types.find((candidate) => candidate.id === item.ticketTypeId)!;
    if (!type.isActive) throw Errors.badRequest(`${type.name} is not on sale.`);
    if (type.saleStartAt && type.saleStartAt > now) {
      throw Errors.badRequest(`${type.name} is not on sale yet.`);
    }
    if (type.saleEndAt && type.saleEndAt < now) {
      throw Errors.badRequest(`Sales for ${type.name} have closed.`);
    }
    if (type.sold + item.quantity > type.quantity) {
      throw Errors.conflict(`Only ${type.quantity - type.sold} ${type.name} left.`);
    }
    subtotal += type.price * item.quantity;
    priced.push({
      ticketTypeId: item.ticketTypeId,
      quantity: item.quantity,
      unitPrice: type.price,
    });
  }

  let discount = 0;
  let appliedCoupon: string | undefined;

  if (couponCode) {
    const coupon = await tx.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });
    const usable =
      coupon &&
      coupon.isActive &&
      (coupon.eventId === null || coupon.eventId === eventId) &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
      (!coupon.expiresAt || coupon.expiresAt > now);

    if (!usable) throw Errors.badRequest("That coupon code is not valid for this event.");

    discount =
      coupon.discountType === "PERCENT"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : Math.min(coupon.discountValue, subtotal);
    appliedCoupon = coupon.code;
  }

  return {
    priced,
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    appliedCoupon,
  };
}

/**
 * Create a seat hold plus a PENDING booking. Seats are reserved immediately so
 * inventory is never oversold; the hold is released after 10 minutes if the
 * mock payment is not completed.
 */
export async function createHold(userId: string, eventId: string, request: HoldRequest) {
  if (request.items.length === 0) throw Errors.badRequest("Select at least one ticket.");
  for (const item of request.items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw Errors.badRequest("Choose between 1 and 10 tickets per type.");
    }
  }

  await releaseExpiredHolds();

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) throw Errors.notFound("Event not found.");
  if (event.status !== "APPROVED") {
    throw Errors.badRequest("Tickets for this event are not on sale.");
  }
  if (event.endAt < new Date()) {
    throw Errors.badRequest("This event has already taken place.");
  }

  const booking = await prisma.$transaction(async (tx) => {
    const basket = await priceBasket(tx, eventId, request.items, request.couponCode);

    for (const item of basket.priced) {
      await reserveSeats(tx, item.ticketTypeId, item.quantity);
    }

    const expiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60_000);

    const created = await tx.booking.create({
      data: {
        code: bookingCode(),
        userId,
        eventId,
        status: "PENDING",
        subtotal: basket.subtotal,
        discount: basket.discount,
        total: basket.total,
        couponCode: basket.appliedCoupon ?? null,
        expiresAt,
        items: {
          create: basket.priced.map((item) => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
        },
      },
    });

    const hold = await tx.seatHold.create({
      data: {
        userId,
        eventId,
        ticketTypeId: basket.priced[0].ticketTypeId,
        quantity: basket.priced.reduce((sum, item) => sum + item.quantity, 0),
        status: "HELD",
        expiresAt,
        bookingId: created.id,
      },
    });

    return { created, hold };
  });

  return booking;
}

export interface CheckoutRequest {
  method: "CARD" | "UPI";
  /** Simulation controls the outcome so both happy and failure paths are testable. */
  simulate?: "success" | "failure";
}

/**
 * Mock payment + booking confirmation. No card/UPI data is accepted or stored —
 * the request carries only the payment method.
 */
export async function checkout(
  userId: string,
  bookingId: string,
  request: CheckoutRequest,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: true, payment: true },
  });

  if (!booking) throw Errors.notFound("Booking not found.");
  if (booking.userId !== userId) throw Errors.forbidden();
  if (booking.status === "CONFIRMED") return { status: "CONFIRMED" as const };
  if (booking.status !== "PENDING") {
    throw Errors.badRequest("This booking can no longer be paid for.");
  }
  if (booking.expiresAt && booking.expiresAt < new Date()) {
    await releaseExpiredHolds();
    throw Errors.badRequest("Your seat hold expired. Please choose tickets again.");
  }

  const reference = `pay_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  if (request.simulate === "failure") {
    await prisma.$transaction(async (tx) => {
      for (const item of booking.items) {
        await releaseSeats(tx, item.ticketTypeId, item.quantity);
      }
      await tx.payment.upsert({
        where: { bookingId },
        create: {
          bookingId,
          method: request.method,
          status: "FAILED",
          amount: booking.total,
          reference,
        },
        update: { status: "FAILED", reference, method: request.method },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.seatHold.updateMany({
        where: { bookingId },
        data: { status: "RELEASED" },
      });
    });
    return { status: "FAILED" as const, reference };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        method: request.method,
        status: "SUCCESS",
        amount: booking.total,
        reference,
      },
      update: { status: "SUCCESS", reference, method: request.method },
    });

    const confirmed = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    // One ticket per seat, each with its own QR token.
    let seatIndex = 0;
    for (const item of booking.items) {
      for (let i = 0; i < item.quantity; i += 1) {
        seatIndex += 1;
        await tx.ticket.create({
          data: {
            code: `${confirmed.code}-${String(seatIndex).padStart(2, "0")}`,
            bookingId: confirmed.id,
            eventId: confirmed.eventId,
            ticketTypeId: item.ticketTypeId,
            userId,
            qrToken: randomUUID(),
            status: "VALID",
          },
        });
      }
    }

    await tx.seatHold.updateMany({
      where: { bookingId },
      data: { status: "CONVERTED" },
    });

    if (confirmed.couponCode) {
      await tx.coupon.updateMany({
        where: { code: confirmed.couponCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    return confirmed;
  });

  const event = await prisma.event.findUnique({
    where: { id: result.eventId },
    select: { title: true },
  });
  await createNotification({
    userId,
    type: "BOOKING_CONFIRMED",
    title: "Booking confirmed",
    message: `Your tickets for ${event?.title ?? "the event"} are ready.`,
    link: `/bookings/${result.id}`,
  });

  return { status: "CONFIRMED" as const, reference, bookingId: result.id };
}

/** Cancel a booking (attendee-initiated). Releases seats and voids tickets. */
export async function cancelBooking(userId: string, bookingId: string, isAdmin = false) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: true, event: { select: { title: true } } },
  });

  if (!booking) throw Errors.notFound("Booking not found.");
  if (!isAdmin && booking.userId !== userId) throw Errors.forbidden();
  if (booking.status === "CANCELLED") return { cancelled: true };
  if (booking.status === "EXPIRED") {
    throw Errors.badRequest("This booking already expired.");
  }

  await prisma.$transaction(async (tx) => {
    if (booking.status === "CONFIRMED") {
      for (const item of booking.items) {
        await releaseSeats(tx, item.ticketTypeId, item.quantity);
      }
    }
    await tx.ticket.updateMany({
      where: { bookingId, status: "VALID" },
      data: { status: "CANCELLED" },
    });
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.seatHold.updateMany({
      where: { bookingId, status: "HELD" },
      data: { status: "RELEASED" },
    });
  });

  await createNotification({
    userId: booking.userId,
    type: "BOOKING_CANCELLED",
    title: "Booking cancelled",
    message: `Your booking for ${booking.event.title} was cancelled.`,
    link: `/bookings/${booking.id}`,
  });

  return { cancelled: true };
}

export async function listMyBookings(userId: string, status?: BookingStatus) {
  return prisma.booking.findMany({
    where: { userId, ...(status ? { status } : {}) },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          slug: true,
          startAt: true,
          bannerUrl: true,
          city: true,
          isOnline: true,
        },
      },
      items: { include: { ticketType: { select: { name: true } } } },
      tickets: { select: { id: true } },
      payment: { select: { status: true, method: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBookingForUser(
  userId: string,
  bookingId: string,
  isAdmin = false,
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
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
        },
      },
      items: { include: { ticketType: { select: { name: true } } } },
      tickets: true,
      payment: true,
    },
  });

  if (!booking) throw Errors.notFound("Booking not found.");
  if (!isAdmin && booking.userId !== userId) throw Errors.forbidden();
  return booking;
}

/** Cancel an entire event, releasing seats and notifying every attendee. */
export async function cancelEventAsOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { bookings: { where: { status: "CONFIRMED" }, select: { userId: true } } },
  });
  if (!event) throw Errors.notFound("Event not found.");
  if (event.organizerId !== organizerId) throw Errors.forbidden();

  const attendees = [...new Set(event.bookings.map((booking) => booking.userId))];

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.ticket.updateMany({
      where: { eventId, status: "VALID" },
      data: { status: "CANCELLED" },
    });
    await tx.booking.updateMany({
      where: { eventId, status: { in: ["CONFIRMED", "PENDING"] } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.seatHold.updateMany({
      where: { eventId, status: "HELD" },
      data: { status: "RELEASED" },
    });
    if (attendees.length > 0) {
      await tx.notification.createMany({
        data: attendees.map((userId) => ({
          userId,
          type: "EVENT_CANCELLED",
          title: "Event cancelled",
          message: `${event.title} has been cancelled by the organizer.`,
          link: `/events/${event.slug}`,
        })),
      });
    }
  });

  return { cancelled: true, notified: attendees.length };
}

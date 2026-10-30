import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import type { EventFormInput } from "@/features/events/event-form.schema";

function toMinor(amount: number) {
  return Math.round(amount * 100);
}

async function uniqueSlug(title: string, ignoreId?: string) {
  const base = slugify(title) || "event";
  let candidate = base;
  let suffix = 2;

  // Slugs are permanent (used in URLs), so only de-duplicate when creating.
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === ignoreId) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function listOrganizerEvents(organizerId: string) {
  return prisma.event.findMany({
    where: { organizerId },
    include: {
      category: true,
      ticketTypes: true,
      _count: { select: { bookings: true, tickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrganizerEvent(
  eventId: string,
  organizerId: string,
  isAdmin = false,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { category: true, ticketTypes: { orderBy: { sortOrder: "asc" } } },
  });
  if (!event) throw Errors.notFound("Event not found.");
  if (!isAdmin && event.organizerId !== organizerId) throw Errors.forbidden();
  return event;
}

export async function createOrganizerEvent(organizerId: string, input: EventFormInput) {
  const slug = await uniqueSlug(input.title);
  const status = input.submitForReview ? "PENDING" : "DRAFT";

  const event = await prisma.event.create({
    data: {
      organizerId,
      title: input.title,
      slug,
      summary: input.summary || null,
      description: input.description,
      categoryId: input.categoryId || null,
      bannerUrl: input.bannerUrl || null,
      isOnline: input.isOnline,
      onlineUrl: input.onlineUrl || null,
      venueName: input.venueName || null,
      venueAddress: input.venueAddress || null,
      city: input.isOnline ? input.city || "Online" : input.city || null,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      status,
      ticketTypes: {
        create: input.ticketTypes.map((type, index) => ({
          name: type.name,
          description: type.description || null,
          price: toMinor(type.price),
          quantity: type.quantity,
          sortOrder: index,
          saleStartAt: type.saleStartAt ? new Date(type.saleStartAt) : null,
          saleEndAt: type.saleEndAt ? new Date(type.saleEndAt) : null,
        })),
      },
    },
    include: { ticketTypes: true },
  });

  if (status === "PENDING") await notifyAdminsOfSubmission(event.title);
  return event;
}

export async function updateOrganizerEvent(
  eventId: string,
  organizerId: string,
  input: EventFormInput,
  isAdmin = false,
) {
  const existing = await getOrganizerEvent(eventId, organizerId, isAdmin);

  // Ticket types that already have sales must not be deleted out from under buyers.
  const typeIdsInPayload = new Set(
    (input as EventFormInput & { ticketTypeIds?: string[] }).ticketTypeIds ?? [],
  );

  const withSales = existing.ticketTypes.filter((type) => type.sold > 0);
  for (const type of withSales) {
    if (!typeIdsInPayload.has(type.id) && typeIdsInPayload.size > 0) {
      throw Errors.conflict(
        `"${type.name}" already has sales and cannot be removed. You can change its quantity instead.`,
      );
    }
  }

  const event = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id: eventId },
      data: {
        title: input.title,
        summary: input.summary || null,
        description: input.description,
        categoryId: input.categoryId || null,
        bannerUrl: input.bannerUrl || null,
        isOnline: input.isOnline,
        onlineUrl: input.onlineUrl || null,
        venueName: input.venueName || null,
        venueAddress: input.venueAddress || null,
        city: input.isOnline ? input.city || "Online" : input.city || null,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
      },
    });

    // Replace the ticket-type set, preserving rows that already have sales.
    for (const type of existing.ticketTypes) {
      const kept = input.ticketTypes.find((candidate) => candidate.name === type.name);
      if (type.sold > 0 && kept) {
        await tx.ticketType.update({
          where: { id: type.id },
          data: {
            quantity: Math.max(kept.quantity, type.sold),
            price: toMinor(kept.price),
          },
        });
      } else if (type.sold === 0) {
        await tx.ticketType.delete({ where: { id: type.id } });
      }
    }

    const remaining = input.ticketTypes.filter(
      (candidate) =>
        !existing.ticketTypes.some(
          (type) => type.name === candidate.name && type.sold > 0,
        ),
    );
    if (remaining.length > 0) {
      await tx.ticketType.createMany({
        data: remaining.map((type, index) => ({
          eventId,
          name: type.name,
          description: type.description || null,
          price: toMinor(type.price),
          quantity: type.quantity,
          sortOrder: existing.ticketTypes.length + index,
          saleStartAt: type.saleStartAt ? new Date(type.saleStartAt) : null,
          saleEndAt: type.saleEndAt ? new Date(type.saleEndAt) : null,
        })),
      });
    }

    return updated;
  });

  return event;
}

export async function submitEventForReview(
  eventId: string,
  organizerId: string,
  isAdmin = false,
) {
  const event = await getOrganizerEvent(eventId, organizerId, isAdmin);
  if (event.status === "APPROVED")
    throw Errors.conflict("This event is already published.");
  if (event.status === "CANCELLED")
    throw Errors.conflict("Cancelled events cannot be published.");

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: "PENDING", rejectionReason: null },
  });
  await notifyAdminsOfSubmission(updated.title);
  return updated;
}

async function notifyAdminsOfSubmission(title: string) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      userId: admin.id,
      type: "EVENT_SUBMITTED",
      title: "Event awaiting approval",
      message: `${title} was submitted for review.`,
      link: "/admin/events",
    })),
  });
}

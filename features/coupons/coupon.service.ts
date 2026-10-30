import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { CreateCouponInput } from "./coupon.schema";

function toMinor(amount: number) {
  return Math.round(amount * 100);
}

function normaliseCode(code: string) {
  return code.trim().toUpperCase();
}

async function assertEventOwnership(
  eventId: string,
  organizerId: string,
  isAdmin: boolean,
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, title: true },
  });
  if (!event) throw Errors.notFound("Event not found.");
  if (!isAdmin && event.organizerId !== organizerId) throw Errors.forbidden();
  return event;
}

export async function listEventCoupons(
  eventId: string,
  organizerId: string,
  isAdmin = false,
) {
  await assertEventOwnership(eventId, organizerId, isAdmin);

  return prisma.coupon.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createEventCoupon(
  eventId: string,
  organizerId: string,
  input: CreateCouponInput,
  isAdmin = false,
) {
  await assertEventOwnership(eventId, organizerId, isAdmin);

  const code = normaliseCode(input.code);
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    throw Errors.conflict(`The code "${code}" is already in use. Pick another.`);
  }

  if (input.expiresAt && new Date(input.expiresAt) <= new Date()) {
    throw Errors.badRequest("The expiry date must be in the future.");
  }

  return prisma.coupon.create({
    data: {
      code,
      eventId,
      createdById: organizerId,
      discountType: input.discountType,
      discountValue:
        input.discountType === "FIXED"
          ? toMinor(input.discountValue)
          : input.discountValue,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      isActive: input.isActive,
    },
  });
}

async function assertCouponOwnership(
  couponId: string,
  organizerId: string,
  isAdmin: boolean,
) {
  const coupon = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: { event: { select: { organizerId: true } } },
  });
  if (!coupon) throw Errors.notFound("Coupon not found.");
  const ownerId = coupon.event?.organizerId ?? coupon.createdById;
  if (!isAdmin && ownerId !== organizerId) throw Errors.forbidden();
  return coupon;
}

export async function setCouponActive(
  couponId: string,
  organizerId: string,
  isActive: boolean,
  isAdmin = false,
) {
  await assertCouponOwnership(couponId, organizerId, isAdmin);
  return prisma.coupon.update({ where: { id: couponId }, data: { isActive } });
}

export async function deleteCoupon(
  couponId: string,
  organizerId: string,
  isAdmin = false,
) {
  await assertCouponOwnership(couponId, organizerId, isAdmin);
  await prisma.coupon.delete({ where: { id: couponId } });
  return { deleted: true };
}

/**
 * Checkout-time validation used by the booking widget before reserving seats.
 * The authoritative discount is still recalculated inside the hold transaction.
 */
export async function previewCoupon(code: string, eventId: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: normaliseCode(code) } });
  const now = new Date();

  const valid =
    coupon &&
    coupon.isActive &&
    (coupon.eventId === null || coupon.eventId === eventId) &&
    (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
    (!coupon.expiresAt || coupon.expiresAt > now);

  if (!valid) return { valid: false as const };

  return {
    valid: true as const,
    code: coupon.code,
    discountType: coupon.discountType as "PERCENT" | "FIXED",
    discountValue: coupon.discountValue,
    description:
      coupon.discountType === "PERCENT"
        ? `${coupon.discountValue}% off`
        : `${(coupon.discountValue / 100).toFixed(0)} off`,
  };
}

export function describeCoupon(coupon: { discountType: string; discountValue: number }) {
  return coupon.discountType === "PERCENT"
    ? `${coupon.discountValue}% off`
    : `₹${(coupon.discountValue / 100).toLocaleString("en-IN")} off`;
}

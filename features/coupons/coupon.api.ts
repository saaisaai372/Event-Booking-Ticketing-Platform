import { apiFetch } from "@/lib/api-client";
import type { CreateCouponInput } from "./coupon.schema";

export interface CouponView {
  id: string;
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CouponPreview {
  valid: boolean;
  code?: string;
  discountType?: "PERCENT" | "FIXED";
  discountValue?: number;
  description?: string;
}

export const couponApi = {
  listForEvent: (eventId: string) =>
    apiFetch<{ coupons: CouponView[] }>(`/api/organizer/events/${eventId}/coupons`),

  create: (eventId: string, input: CreateCouponInput) =>
    apiFetch<{ coupon: CouponView }>(`/api/organizer/events/${eventId}/coupons`, {
      method: "POST",
      body: input,
    }),

  setActive: (couponId: string, isActive: boolean) =>
    apiFetch<{ coupon: CouponView }>(`/api/organizer/coupons/${couponId}`, {
      method: "PATCH",
      body: { isActive },
    }),

  remove: (couponId: string) =>
    apiFetch<{ deleted: boolean }>(`/api/organizer/coupons/${couponId}`, {
      method: "DELETE",
    }),

  validate: (code: string, eventId: string) =>
    apiFetch<CouponPreview>("/api/coupons/validate", {
      method: "POST",
      body: { code, eventId },
    }),
};

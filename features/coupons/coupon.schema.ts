import { z } from "zod";

const baseCoupon = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Codes need at least 3 characters.")
    .max(32, "Codes are limited to 32 characters.")
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens or underscores only."),
  discountType: z.enum(["PERCENT", "FIXED"]),
  /** PERCENT: 1–100. FIXED: major units (rupees), converted to minor units. */
  discountValue: z.coerce.number().positive("Enter a discount greater than zero."),
  maxUses: z.coerce.number().int().min(1).max(100_000).optional(),
  expiresAt: z.string().trim().optional(),
  isActive: z.coerce.boolean().default(true),
});

export const createCouponSchema = baseCoupon
  .refine((value) => value.discountType !== "PERCENT" || value.discountValue <= 100, {
    message: "A percentage discount cannot exceed 100.",
    path: ["discountValue"],
  })
  .refine((value) => value.discountType !== "FIXED" || value.discountValue <= 1_000_000, {
    message: "That fixed discount is too large.",
    path: ["discountValue"],
  });

export const updateCouponSchema = z.object({
  isActive: z.coerce.boolean().optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code."),
  eventId: z.string().min(1),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

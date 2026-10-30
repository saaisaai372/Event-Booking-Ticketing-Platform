import { z } from "zod";

export const holdRequestSchema = z.object({
  eventId: z.string().min(1),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(10),
      }),
    )
    .min(1, "Select at least one ticket."),
  couponCode: z.string().trim().max(32).optional(),
});

export const checkoutSchema = z.object({
  method: z.enum(["CARD", "UPI"]),
  simulate: z.enum(["success", "failure"]).optional(),
});

export const checkInSchema = z.object({
  value: z.string().trim().min(4, "Enter or scan a ticket code."),
});

export const bookingListQuerySchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"]).optional(),
});

export type HoldRequestInput = z.infer<typeof holdRequestSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;

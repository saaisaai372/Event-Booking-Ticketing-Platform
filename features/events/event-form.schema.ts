import { z } from "zod";

const ticketTypeSchema = z
  .object({
    name: z.string().trim().min(1, "Ticket name is required.").max(60),
    description: z.string().trim().max(200).optional(),
    /** Major units (rupees); converted to minor units in the service. */
    price: z.coerce.number().min(0, "Price cannot be negative.").max(1_000_000),
    quantity: z.coerce.number().int().min(1, "Quantity must be at least 1.").max(100_000),
    saleStartAt: z.string().trim().optional(),
    saleEndAt: z.string().trim().optional(),
  })
  .refine(
    (value) =>
      !value.saleStartAt ||
      !value.saleEndAt ||
      new Date(value.saleStartAt) < new Date(value.saleEndAt),
    { message: "Sale window start must be before it ends.", path: ["saleEndAt"] },
  );

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Give your event a title.").max(140),
    summary: z
      .string()
      .trim()
      .max(200, "Keep the summary under 200 characters.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(20, "Describe your event in at least 20 characters."),
    categoryId: z.string().trim().optional(),
    bannerUrl: z
      .string()
      .trim()
      .url("Enter a valid image URL.")
      .optional()
      .or(z.literal("")),
    isOnline: z.coerce.boolean().default(false),
    onlineUrl: z.string().trim().url("Enter a valid link.").optional().or(z.literal("")),
    venueName: z.string().trim().max(140).optional(),
    venueAddress: z.string().trim().max(240).optional(),
    city: z.string().trim().max(80).optional(),
    startAt: z.string().trim().min(1, "Choose a start date and time."),
    endAt: z.string().trim().min(1, "Choose an end date and time."),
    ticketTypes: z.array(ticketTypeSchema).min(1, "Add at least one ticket type."),
    /** true = submit for admin approval, false = keep as a draft. */
    submitForReview: z.coerce.boolean().default(true),
  })
  .refine((value) => new Date(value.startAt) < new Date(value.endAt), {
    message: "The end time must be after the start time.",
    path: ["endAt"],
  })
  .refine((value) => !value.isOnline || Boolean(value.onlineUrl), {
    message: "Online events need a join link.",
    path: ["onlineUrl"],
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;

export const rejectEventSchema = z.object({
  reason: z.string().trim().min(5, "Give the organizer a reason.").max(300),
});

export const updateUserSchema = z.object({
  role: z.enum(["ATTENDEE", "ORGANIZER", "ADMIN"]).optional(),
  isActive: z.coerce.boolean().optional(),
  organizerStatus: z.enum(["NONE", "PENDING", "APPROVED", "REJECTED"]).optional(),
});

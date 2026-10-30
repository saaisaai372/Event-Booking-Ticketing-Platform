/** Shared domain types for the Evently platform. */

export const ROLES = ["ATTENDEE", "ORGANIZER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORGANIZER_STATUSES = ["NONE", "PENDING", "APPROVED", "REJECTED"] as const;
export type OrganizerStatus = (typeof ORGANIZER_STATUSES)[number];

export const EVENT_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const TICKET_STATUSES = ["VALID", "USED", "CANCELLED"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const HOLD_STATUSES = ["HELD", "CONVERTED", "EXPIRED", "RELEASED"] as const;
export type HoldStatus = (typeof HOLD_STATUSES)[number];

export const PAYMENT_METHODS = ["CARD", "UPI"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "BOOKING_CONFIRMED",
  "BOOKING_CANCELLED",
  "EVENT_CANCELLED",
  "EVENT_APPROVED",
  "EVENT_REJECTED",
  "EVENT_SUBMITTED",
  "ORGANIZER_APPROVED",
  "ORGANIZER_REJECTED",
  "ORGANIZER_REQUESTED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Uniform API envelope returned by every route handler. */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** The session user shape exposed to the client (never includes the hash). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  organizerStatus: OrganizerStatus;
  emailVerified: boolean;
}

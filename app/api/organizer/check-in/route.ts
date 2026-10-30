import { requireOrganizer } from "@/lib/auth/session";
import { checkInSchema } from "@/features/bookings/booking.schema";
import { checkInTicket } from "@/features/tickets/ticket.service";
import { ok, route } from "@/lib/http";

/** Scan (or type) a ticket code to check an attendee in. Single-use. */
export const POST = route(async (request: Request) => {
  const user = await requireOrganizer();
  const { value } = checkInSchema.parse(await request.json());
  const result = await checkInTicket(user.id, value, user.role === "ADMIN");
  return ok(result);
});

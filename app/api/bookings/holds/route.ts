import { requireUser } from "@/lib/auth/session";
import { createHold } from "@/features/bookings/booking.service";
import { holdRequestSchema } from "@/features/bookings/booking.schema";
import { created, route } from "@/lib/http";

/** Reserve seats and open a PENDING booking (10-minute hold). */
export const POST = route(async (request: Request) => {
  const user = await requireUser();
  const input = holdRequestSchema.parse(await request.json());
  const { created: booking } = await createHold(user.id, input.eventId, input);

  return created({ booking });
});

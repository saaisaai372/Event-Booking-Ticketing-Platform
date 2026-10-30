import { requireUser } from "@/lib/auth/session";
import { listMyBookings } from "@/features/bookings/booking.service";
import { bookingListQuerySchema } from "@/features/bookings/booking.schema";
import { ok, route } from "@/lib/http";

export const GET = route(async (request: Request) => {
  const user = await requireUser();
  const { status } = bookingListQuerySchema.parse({
    status: new URL(request.url).searchParams.get("status") ?? undefined,
  });

  const bookings = await listMyBookings(user.id, status);
  return ok({ bookings });
});

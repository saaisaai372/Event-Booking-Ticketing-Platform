import { requireUser } from "@/lib/auth/session";
import {
  getBookingForUser,
  releaseExpiredHolds,
} from "@/features/bookings/booking.service";
import { ok, route } from "@/lib/http";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/bookings/[id]">) => {
    const user = await requireUser();
    await releaseExpiredHolds();

    const { id } = await ctx.params;
    const booking = await getBookingForUser(user.id, id, user.role === "ADMIN");
    return ok({ booking });
  },
);

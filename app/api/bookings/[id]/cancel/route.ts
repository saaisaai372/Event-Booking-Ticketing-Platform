import { requireUser } from "@/lib/auth/session";
import { cancelBooking } from "@/features/bookings/booking.service";
import { ok, route } from "@/lib/http";

export const POST = route(
  async (_request: Request, ctx: RouteContext<"/api/bookings/[id]/cancel">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const result = await cancelBooking(user.id, id, user.role === "ADMIN");
    return ok(result);
  },
);

import { requireOrganizer } from "@/lib/auth/session";
import { cancelEventAsOrganizer } from "@/features/bookings/booking.service";
import { ok, route } from "@/lib/http";

export const POST = route(
  async (_request: Request, ctx: RouteContext<"/api/organizer/events/[id]/cancel">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const result = await cancelEventAsOrganizer(id, user.id);
    return ok(result);
  },
);

import { getEventBySlug } from "@/features/events/event.service";
import { releaseExpiredHolds } from "@/features/bookings/booking.service";
import { Errors, ok, route } from "@/lib/http";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/events/[slug]">) => {
    await releaseExpiredHolds();

    const { slug } = await ctx.params;
    const event = await getEventBySlug(slug);

    if (!event || event.status !== "APPROVED") {
      throw Errors.notFound("Event not found.");
    }

    return ok({ event });
  },
);

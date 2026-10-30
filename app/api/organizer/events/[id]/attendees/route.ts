import { requireOrganizer } from "@/lib/auth/session";
import { getEventStats, listEventAttendees } from "@/features/tickets/ticket.service";
import { ok, route } from "@/lib/http";

export const GET = route(
  async (
    _request: Request,
    ctx: RouteContext<"/api/organizer/events/[id]/attendees">,
  ) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;

    const [attendees, stats] = await Promise.all([
      listEventAttendees(id, user.id, user.role === "ADMIN"),
      getEventStats(id),
    ]);

    return ok({ attendees, stats });
  },
);

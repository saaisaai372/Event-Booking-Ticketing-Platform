import { requireOrganizer } from "@/lib/auth/session";
import {
  getOrganizerEvent,
  updateOrganizerEvent,
} from "@/features/events/organizer.service";
import { eventFormSchema } from "@/features/events/event-form.schema";
import { ok, route } from "@/lib/http";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/organizer/events/[id]">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const event = await getOrganizerEvent(id, user.id, user.role === "ADMIN");
    return ok({ event });
  },
);

export const PATCH = route(
  async (request: Request, ctx: RouteContext<"/api/organizer/events/[id]">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const input = eventFormSchema.parse(await request.json());
    const event = await updateOrganizerEvent(id, user.id, input, user.role === "ADMIN");
    return ok({ event });
  },
);

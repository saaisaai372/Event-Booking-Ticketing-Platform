import { requireRole } from "@/lib/auth/session";
import { rejectEvent } from "@/features/admin/admin.service";
import { rejectEventSchema } from "@/features/events/event-form.schema";
import { ok, route } from "@/lib/http";

export const POST = route(
  async (request: Request, ctx: RouteContext<"/api/admin/events/[id]/reject">) => {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    const { reason } = rejectEventSchema.parse(await request.json());
    const event = await rejectEvent(id, reason);
    return ok({ event });
  },
);

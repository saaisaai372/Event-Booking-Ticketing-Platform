import { requireRole } from "@/lib/auth/session";
import { approveEvent } from "@/features/admin/admin.service";
import { ok, route } from "@/lib/http";

export const POST = route(
  async (_request: Request, ctx: RouteContext<"/api/admin/events/[id]/approve">) => {
    await requireRole("ADMIN");
    const { id } = await ctx.params;
    const event = await approveEvent(id);
    return ok({ event });
  },
);

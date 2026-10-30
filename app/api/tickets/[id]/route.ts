import { requireUser } from "@/lib/auth/session";
import { getTicketForUser } from "@/features/tickets/ticket.service";
import { ok, route } from "@/lib/http";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/tickets/[id]">) => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const ticket = await getTicketForUser(user.id, id, user.role === "ADMIN");
    return ok({ ticket });
  },
);

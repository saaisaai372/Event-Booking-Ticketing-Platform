import { requireOrganizer } from "@/lib/auth/session";
import { submitEventForReview } from "@/features/events/organizer.service";
import { ok, route } from "@/lib/http";

/** Move a draft (or rejected event) into the admin approval queue. */
export const POST = route(
  async (_request: Request, ctx: RouteContext<"/api/organizer/events/[id]/publish">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const event = await submitEventForReview(id, user.id, user.role === "ADMIN");
    return ok({ event });
  },
);

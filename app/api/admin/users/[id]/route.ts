import { requireRole } from "@/lib/auth/session";
import { updateUser } from "@/features/admin/admin.service";
import { updateUserSchema } from "@/features/events/event-form.schema";
import { ok, route } from "@/lib/http";

export const PATCH = route(
  async (request: Request, ctx: RouteContext<"/api/admin/users/[id]">) => {
    const admin = await requireRole("ADMIN");
    const { id } = await ctx.params;
    const input = updateUserSchema.parse(await request.json());
    const user = await updateUser(id, input, admin.id);
    return ok({ user });
  },
);

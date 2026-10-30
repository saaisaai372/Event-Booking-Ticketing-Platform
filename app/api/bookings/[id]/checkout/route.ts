import { requireUser } from "@/lib/auth/session";
import { checkout } from "@/features/bookings/booking.service";
import { checkoutSchema } from "@/features/bookings/booking.schema";
import { ok, route } from "@/lib/http";

/** Mock payment: no card or UPI credentials are accepted or persisted. */
export const POST = route(
  async (request: Request, ctx: RouteContext<"/api/bookings/[id]/checkout">) => {
    const user = await requireUser();
    const input = checkoutSchema.parse(await request.json());

    const { id } = await ctx.params;
    const result = await checkout(user.id, id, input);

    return ok(result);
  },
);

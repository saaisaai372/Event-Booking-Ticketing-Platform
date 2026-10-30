import { requireOrganizer } from "@/lib/auth/session";
import { createEventCoupon, listEventCoupons } from "@/features/coupons/coupon.service";
import { createCouponSchema } from "@/features/coupons/coupon.schema";
import { created, ok, route } from "@/lib/http";

export const GET = route(
  async (_request: Request, ctx: RouteContext<"/api/organizer/events/[id]/coupons">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const coupons = await listEventCoupons(id, user.id, user.role === "ADMIN");
    return ok({ coupons });
  },
);

export const POST = route(
  async (request: Request, ctx: RouteContext<"/api/organizer/events/[id]/coupons">) => {
    const user = await requireOrganizer();
    const { id } = await ctx.params;
    const input = createCouponSchema.parse(await request.json());
    const coupon = await createEventCoupon(id, user.id, input, user.role === "ADMIN");
    return created({ coupon });
  },
);

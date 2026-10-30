import { requireOrganizer } from "@/lib/auth/session";
import { deleteCoupon, setCouponActive } from "@/features/coupons/coupon.service";
import { updateCouponSchema } from "@/features/coupons/coupon.schema";
import { ok, route } from "@/lib/http";

export const PATCH = route(
  async (request: Request, ctx: RouteContext<"/api/organizer/coupons/[couponId]">) => {
    const user = await requireOrganizer();
    const { couponId } = await ctx.params;
    const { isActive } = updateCouponSchema.parse(await request.json());

    if (isActive === undefined) {
      return ok({ updated: false });
    }

    const coupon = await setCouponActive(
      couponId,
      user.id,
      isActive,
      user.role === "ADMIN",
    );
    return ok({ coupon });
  },
);

export const DELETE = route(
  async (_request: Request, ctx: RouteContext<"/api/organizer/coupons/[couponId]">) => {
    const user = await requireOrganizer();
    const { couponId } = await ctx.params;
    const result = await deleteCoupon(couponId, user.id, user.role === "ADMIN");
    return ok(result);
  },
);

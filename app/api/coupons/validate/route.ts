import { previewCoupon } from "@/features/coupons/coupon.service";
import { validateCouponSchema } from "@/features/coupons/coupon.schema";
import { ok, route } from "@/lib/http";

/** Public preview so the booking widget can confirm a code before reserving. */
export const POST = route(async (request: Request) => {
  const { code, eventId } = validateCouponSchema.parse(await request.json());
  const result = await previewCoupon(code, eventId);
  return ok(result);
});

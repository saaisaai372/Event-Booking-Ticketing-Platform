import { otpSchema } from "@/features/auth/auth.schema";
import { verifyEmail } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const input = otpSchema.parse(await request.json());
  const result = await verifyEmail(input);
  return ok(result);
});

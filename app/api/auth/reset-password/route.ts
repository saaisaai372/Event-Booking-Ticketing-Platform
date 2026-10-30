import { clearAuthCookies } from "@/lib/auth/cookies";
import { resetPasswordSchema } from "@/features/auth/auth.schema";
import { resetPassword } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const input = resetPasswordSchema.parse(await request.json());
  const result = await resetPassword(input);
  await clearAuthCookies();
  return ok(result);
});

import { forgotPasswordSchema } from "@/features/auth/auth.schema";
import { requestPasswordReset } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const { email } = forgotPasswordSchema.parse(await request.json());
  const result = await requestPasswordReset(email);
  return ok(result);
});

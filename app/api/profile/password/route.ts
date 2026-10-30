import { requireUser } from "@/lib/auth/session";
import { changePassword } from "@/features/auth/auth.service";
import { changePasswordSchema } from "@/features/auth/auth.schema";
import { ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const session = await requireUser();
  const input = changePasswordSchema.parse(await request.json());
  const result = await changePassword(session.id, input);
  return ok(result);
});

import { requireUser } from "@/lib/auth/session";
import { updateProfile } from "@/features/profile/profile.service";
import { updateProfileSchema } from "@/features/auth/auth.schema";
import { ok, route } from "@/lib/http";

export const PATCH = route(async (request: Request) => {
  const session = await requireUser();
  const input = updateProfileSchema.parse(await request.json());
  const user = await updateProfile(session.id, input);
  return ok({ user });
});

import { setAuthCookies } from "@/lib/auth/cookies";
import { registerSchema } from "@/features/auth/auth.schema";
import { registerUser } from "@/features/auth/auth.service";
import { created, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const input = registerSchema.parse(await request.json());
  const session = await registerUser(input, request.headers.get("user-agent"));
  await setAuthCookies(session.accessToken, session.refreshToken);

  const { user, devCode } = session;
  return created({ user, ...(devCode ? { devCode } : {}) });
});

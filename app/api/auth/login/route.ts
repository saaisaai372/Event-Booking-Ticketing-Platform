import { setAuthCookies } from "@/lib/auth/cookies";
import { loginSchema } from "@/features/auth/auth.schema";
import { loginUser } from "@/features/auth/auth.service";
import { ok, route } from "@/lib/http";

export const POST = route(async (request: Request) => {
  const input = loginSchema.parse(await request.json());
  const session = await loginUser(input, request.headers.get("user-agent"));
  await setAuthCookies(session.accessToken, session.refreshToken);

  return ok({ user: session.user });
});

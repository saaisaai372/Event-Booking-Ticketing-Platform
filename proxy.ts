import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookie-names";

/**
 * Next.js 16 renamed `middleware` to `proxy` (same purpose). This performs an
 * optimistic auth check so unauthenticated visitors are bounced to /login
 * before a protected page renders. Authoritative checks still happen in each
 * route handler and page via `requireUser` / `requireRole`.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/bookings",
  "/tickets",
  "/profile",
  "/saved",
  "/organizer",
  "/admin",
  "/checkout",
  "/events/new",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?)$).*)",
  ],
};

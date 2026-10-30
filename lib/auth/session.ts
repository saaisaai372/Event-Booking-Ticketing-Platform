import { cache } from "react";
import type { User } from "@prisma/client";
import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import type { OrganizerStatus, Role, SessionUser } from "@/types";
import { getAccessToken } from "./cookies";
import { verifyAccessToken } from "./tokens";

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    avatarUrl: user.avatarUrl,
    organizerStatus: user.organizerStatus as OrganizerStatus,
    emailVerified: user.emailVerified,
  };
}

/**
 * Resolve the signed-in user from the httpOnly access-token cookie.
 * Deduplicated per render pass via React `cache`.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  const payload = await verifyAccessToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;

  return toSessionUser(user);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw Errors.forbidden();
  return user;
}

/** Organizers (role ORGANIZER or ADMIN) may manage events. */
export async function requireOrganizer(): Promise<SessionUser> {
  return requireRole("ORGANIZER", "ADMIN");
}

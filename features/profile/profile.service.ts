import { Errors } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toSessionUser } from "@/lib/auth/session";
import type { UpdateProfileInput } from "@/features/auth/auth.schema";
import type { SessionUser } from "@/types";

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<SessionUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone || null,
      bio: input.bio || null,
      avatarUrl: input.avatarUrl || null,
    },
  });
  return toSessionUser(user);
}

/** Attendee asks to become an organizer; an admin approves it later. */
export async function requestOrganizerAccess(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.role === "ORGANIZER" || user.role === "ADMIN") {
    throw Errors.conflict("Your account can already create events.");
  }
  if (user.organizerStatus === "PENDING") {
    throw Errors.conflict("Your organizer request is already awaiting review.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { organizerStatus: "PENDING" },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "ORGANIZER_REQUESTED",
        title: "Organizer access requested",
        message: `${user.name} (${user.email}) requested organizer access.`,
        link: "/admin/users",
      })),
    });
  }

  return { requested: true };
}

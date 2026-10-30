import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Errors, ok, route } from "@/lib/http";

/** Toggle the current user's saved state for an event. */
export const POST = route(
  async (_request: Request, ctx: RouteContext<"/api/events/[slug]/save">) => {
    const user = await requireUser();
    const { slug } = await ctx.params;

    const event = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!event) throw Errors.notFound("Event not found.");

    const existing = await prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: event.id } },
    });

    if (existing) {
      await prisma.savedEvent.delete({ where: { id: existing.id } });
      return ok({ saved: false });
    }

    await prisma.savedEvent.create({ data: { userId: user.id, eventId: event.id } });
    return ok({ saved: true });
  },
);

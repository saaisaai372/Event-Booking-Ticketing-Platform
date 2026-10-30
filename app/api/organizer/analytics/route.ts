import { requireOrganizer } from "@/lib/auth/session";
import { listOrganizerEvents } from "@/features/events/organizer.service";
import { getEventStats } from "@/features/tickets/ticket.service";
import { revenueTrend } from "@/features/admin/admin.service";
import { ok, route } from "@/lib/http";

/** Per-event sales + a 6-month revenue trend for the organizer dashboard. */
export const GET = route(async () => {
  const user = await requireOrganizer();
  const events = await listOrganizerEvents(user.id);

  const perEvent = await Promise.all(
    events.map(async (event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      startAt: event.startAt.toISOString(),
      stats: await getEventStats(event.id),
    })),
  );

  const totals = perEvent.reduce(
    (sum, event) => ({
      revenue: sum.revenue + event.stats.revenue,
      ticketsSold: sum.ticketsSold + event.stats.ticketsSold,
      checkedIn: sum.checkedIn + event.stats.checkedIn,
      bookings: sum.bookings + event.stats.bookings,
    }),
    { revenue: 0, ticketsSold: 0, checkedIn: 0, bookings: 0 },
  );

  const trend = await revenueTrend(user.id);
  return ok({ totals, perEvent, trend });
});

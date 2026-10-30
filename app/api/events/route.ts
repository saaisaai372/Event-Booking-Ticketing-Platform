import { parseEventQuery } from "@/features/events/event.schema";
import { countEvents, listEvents } from "@/features/events/event.service";
import { releaseExpiredHolds } from "@/features/bookings/booking.service";
import { ok, route } from "@/lib/http";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export const GET = route(async (request: Request) => {
  await releaseExpiredHolds();

  const filters = parseEventQuery(new URL(request.url).searchParams);
  const [items, total] = await Promise.all([listEvents(filters), countEvents(filters)]);

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  return ok({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

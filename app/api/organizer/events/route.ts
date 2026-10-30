import { requireOrganizer } from "@/lib/auth/session";
import {
  createOrganizerEvent,
  listOrganizerEvents,
} from "@/features/events/organizer.service";
import { eventFormSchema } from "@/features/events/event-form.schema";
import { created, ok, route } from "@/lib/http";

export const GET = route(async () => {
  const user = await requireOrganizer();
  const events = await listOrganizerEvents(user.id);
  return ok({ events });
});

export const POST = route(async (request: Request) => {
  const user = await requireOrganizer();
  const input = eventFormSchema.parse(await request.json());
  const event = await createOrganizerEvent(user.id, input);
  return created({ event });
});

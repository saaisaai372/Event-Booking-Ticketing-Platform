import { requireUser } from "@/lib/auth/session";
import { listMyTickets, type TicketScope } from "@/features/tickets/ticket.service";
import { ok, route } from "@/lib/http";

const SCOPES: TicketScope[] = ["upcoming", "past", "all"];

export const GET = route(async (request: Request) => {
  const user = await requireUser();
  const requested = new URL(request.url).searchParams.get("scope") as TicketScope | null;
  const scope: TicketScope = requested && SCOPES.includes(requested) ? requested : "all";

  const tickets = await listMyTickets(user.id, scope);
  return ok({ tickets, scope });
});

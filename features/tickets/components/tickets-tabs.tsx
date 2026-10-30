"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TicketX } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { TicketCard, type TicketView } from "@/features/tickets/components/ticket-card";
import { apiFetch } from "@/lib/api-client";

export function TicketsTabs() {
  const [scope, setScope] = useState<"upcoming" | "past">("upcoming");

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["tickets", scope],
    queryFn: () => apiFetch<{ tickets: TicketView[] }>(`/api/tickets?scope=${scope}`),
  });

  const tickets = data?.tickets ?? [];

  return (
    <div className="space-y-6">
      <Tabs
        value={scope}
        onValueChange={(value) => setScope(value as "upcoming" | "past")}
        tabs={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
      />

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" title="Could not load tickets">
          {error instanceof Error ? error.message : "Please try again."}
        </Alert>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketX}
          title={scope === "upcoming" ? "No upcoming tickets" : "No past tickets"}
          description={
            scope === "upcoming"
              ? "Book an event to get your QR ticket."
              : "Tickets for events that have finished will appear here."
          }
          actionLabel={scope === "upcoming" ? "Explore events" : undefined}
          actionHref={scope === "upcoming" ? "/events" : undefined}
        />
      ) : (
        <ul className="space-y-4">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

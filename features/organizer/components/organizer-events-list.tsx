"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Pencil, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/utils";

interface OrganizerEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  startAt: string;
  rejectionReason: string | null;
  _count: { bookings: number; tickets: number };
  ticketTypes: { id: string; price: number; quantity: number; sold: number }[];
}

export function OrganizerEventsList() {
  const queryClient = useQueryClient();
  const [pendingCancel, setPendingCancel] = useState<OrganizerEvent | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["organizer-events"],
    queryFn: () => apiFetch<{ events: OrganizerEvent[] }>("/api/organizer/events"),
  });

  const events = data?.events ?? [];

  async function publish(event: OrganizerEvent) {
    setBusyId(event.id);
    try {
      await apiFetch(`/api/organizer/events/${event.id}/publish`, { method: "POST" });
      toast.success("Submitted for approval");
      await queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not submit event.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function cancel() {
    if (!pendingCancel) return;
    setBusyId(pendingCancel.id);
    try {
      await apiFetch(`/api/organizer/events/${pendingCancel.id}/cancel`, {
        method: "POST",
      });
      toast.success("Event cancelled — attendees were notified");
      setPendingCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not cancel event.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" title="Could not load your events">
        {error instanceof Error ? error.message : "Please try again."}
      </Alert>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={CalendarPlus}
        title="No events yet"
        description="Create your first event and submit it for approval."
        actionLabel="Create event"
        actionHref="/organizer/events/new"
      />
    );
  }

  return (
    <>
      <ul className="space-y-4">
        {events.map((event) => {
          const capacity = event.ticketTypes.reduce(
            (sum, type) => sum + type.quantity,
            0,
          );
          const sold = event.ticketTypes.reduce((sum, type) => sum + type.sold, 0);
          const from = event.ticketTypes.length
            ? Math.min(...event.ticketTypes.map((type) => type.price))
            : 0;

          return (
            <li key={event.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/events/${event.slug}`}
                        className="font-semibold hover:text-primary"
                      >
                        {event.title}
                      </Link>
                      <StatusBadge status={event.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(event.startAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sold}/{capacity} seats sold · {event._count.bookings} bookings ·
                      from {from === 0 ? "Free" : formatMoney(from)}
                    </p>
                    {event.status === "REJECTED" && event.rejectionReason ? (
                      <p className="text-xs text-destructive">
                        Rejected: {event.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/organizer/events/${event.id}`} className="inline-flex">
                      <Button variant="outline" size="sm">
                        <Pencil />
                        Manage
                      </Button>
                    </Link>
                    {event.status === "DRAFT" || event.status === "REJECTED" ? (
                      <Button
                        size="sm"
                        disabled={busyId === event.id}
                        onClick={() => publish(event)}
                      >
                        <Send />
                        Submit
                      </Button>
                    ) : null}
                    {event.status !== "CANCELLED" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => setPendingCancel(event)}
                      >
                        <XCircle />
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this event?"
        description="All confirmed bookings will be cancelled, tickets voided, and every attendee notified. This cannot be undone."
        confirmLabel="Cancel event"
        cancelLabel="Keep event"
        destructive
        busy={Boolean(busyId)}
        onConfirm={cancel}
        onCancel={() => setPendingCancel(null)}
      />
    </>
  );
}

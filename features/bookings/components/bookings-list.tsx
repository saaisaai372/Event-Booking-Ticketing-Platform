"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/utils";

interface BookingRow {
  id: string;
  code: string;
  status: string;
  total: number;
  createdAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    startAt: string;
    city: string | null;
    isOnline: boolean;
  };
  items: { id: string; quantity: number; ticketType: { name: string } }[];
  tickets: { id: string }[];
}

export function BookingsList() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("all");
  const [pendingCancel, setPendingCancel] = useState<BookingRow | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["bookings", status],
    queryFn: () =>
      apiFetch<{ bookings: BookingRow[] }>(
        status === "all" ? "/api/bookings" : `/api/bookings?status=${status}`,
      ),
  });

  const bookings = data?.bookings ?? [];

  async function confirmCancel() {
    if (!pendingCancel) return;
    setCancelling(true);
    try {
      await apiFetch(`/api/bookings/${pendingCancel.id}/cancel`, { method: "POST" });
      toast.success("Booking cancelled");
      setPendingCancel(null);
      await queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not cancel booking.",
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={status}
        onValueChange={setStatus}
        tabs={[
          { value: "all", label: "All" },
          { value: "CONFIRMED", label: "Confirmed" },
          { value: "PENDING", label: "Pending" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" title="Could not load bookings">
          {error instanceof Error ? error.message : "Please try again."}
        </Alert>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No bookings yet"
          description="When you book an event, it will appear here."
          actionLabel="Explore events"
          actionHref="/events"
        />
      ) : (
        <ul className="space-y-4">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Card>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="font-semibold hover:text-primary"
                      >
                        {booking.event.title}
                      </Link>
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {formatDateTime(booking.event.startAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.code} ·{" "}
                      {booking.items
                        .map((item) => `${item.ticketType.name} × ${item.quantity}`)
                        .join(", ")}{" "}
                      · {booking.tickets.length} ticket
                      {booking.tickets.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-semibold">{formatMoney(booking.total)}</span>
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                    {booking.status === "CONFIRMED" || booking.status === "PENDING" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPendingCancel(booking)}
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this booking?"
        description="Your seats will be released and the tickets voided. This cannot be undone."
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        destructive
        busy={cancelling}
        onConfirm={confirmCancel}
        onCancel={() => setPendingCancel(null)}
      />
    </div>
  );
}

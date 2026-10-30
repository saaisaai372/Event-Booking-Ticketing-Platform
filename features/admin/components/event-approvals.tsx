"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatDateTime, formatMoney } from "@/lib/utils";

interface ReviewEvent {
  id: string;
  title: string;
  slug: string;
  status: string;
  startAt: string;
  city: string | null;
  isOnline: boolean;
  rejectionReason: string | null;
  organizer: { id: string; name: string; email: string };
  category: { name: string } | null;
  ticketTypes: { id: string; price: number; quantity: number; sold: number }[];
}

export function EventApprovals() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("PENDING");
  const [rejecting, setRejecting] = useState<ReviewEvent | null>(null);
  const [reason, setReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["admin-events", status],
    queryFn: () =>
      apiFetch<{ events: ReviewEvent[] }>(`/api/admin/events?status=${status}`),
  });

  const events = data?.events ?? [];

  async function approve(event: ReviewEvent) {
    setBusyId(event.id);
    try {
      await apiFetch(`/api/admin/events/${event.id}/approve`, { method: "POST" });
      toast.success(`${event.title} approved and published`);
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not approve event.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function reject() {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      toast.error("Give the organizer a reason (at least 5 characters).");
      return;
    }
    setBusyId(rejecting.id);
    try {
      await apiFetch(`/api/admin/events/${rejecting.id}/reject`, {
        method: "POST",
        body: { reason },
      });
      toast.success("Event rejected — the organizer was notified");
      setRejecting(null);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-events"] });
    } catch (caught) {
      toast.error(
        caught instanceof ApiError ? caught.message : "Could not reject event.",
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={status}
        onValueChange={setStatus}
        tabs={[
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" },
        ]}
      />

      {isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive" title="Could not load the approval queue">
          {error instanceof Error ? error.message : "Please try again."}
        </Alert>
      ) : events.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing to review"
          description={`No ${status.toLowerCase()} events right now.`}
        />
      ) : (
        <ul className="space-y-4">
          {events.map((event) => {
            const capacity = event.ticketTypes.reduce(
              (sum, type) => sum + type.quantity,
              0,
            );
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
                        {event.organizer.name} · {event.organizer.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(event.startAt)} ·{" "}
                        {event.isOnline ? "Online" : (event.city ?? "Venue TBA")} ·{" "}
                        {event.category?.name ?? "Uncategorised"} · {capacity} seats ·
                        from {from === 0 ? "Free" : formatMoney(from)}
                      </p>
                      {event.rejectionReason ? (
                        <p className="text-xs text-destructive">
                          {event.rejectionReason}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link href={`/events/${event.slug}`} className="inline-flex">
                        <Button variant="outline" size="sm">
                          Preview
                        </Button>
                      </Link>
                      {event.status !== "APPROVED" ? (
                        <Button
                          size="sm"
                          disabled={busyId === event.id}
                          onClick={() => approve(event)}
                        >
                          <Check />
                          Approve
                        </Button>
                      ) : null}
                      {event.status !== "REJECTED" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            setRejecting(event);
                            setReason("");
                          }}
                        >
                          <X />
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(rejecting)}
        title="Reject this event?"
        description="The organizer will be notified with your reason."
        confirmLabel="Reject event"
        cancelLabel="Cancel"
        destructive
        busy={Boolean(busyId)}
        onConfirm={reject}
        onCancel={() => setRejecting(null)}
      />
      {rejecting ? (
        <div className="rounded-lg border border-border p-4">
          <Label htmlFor="reject-reason">Reason for rejection</Label>
          <Input
            id="reject-reason"
            value={reason}
            placeholder="Tell the organizer what to fix…"
            onChange={(event) => setReason(event.target.value)}
            className="mt-2"
          />
        </div>
      ) : null}
    </div>
  );
}

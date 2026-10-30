"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatMoney } from "@/lib/utils";

export interface PublicTicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  saleStartAt: string | null;
  saleEndAt: string | null;
  isActive: boolean;
}

export function BookingWidget({
  eventId,
  eventSlug,
  ticketTypes,
  isAuthenticated,
  isCancelled,
}: {
  eventId: string;
  eventSlug: string;
  ticketTypes: PublicTicketType[];
  isAuthenticated: boolean;
  isCancelled: boolean;
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () =>
      ticketTypes.reduce((sum, type) => sum + (quantities[type.id] ?? 0) * type.price, 0),
    [quantities, ticketTypes],
  );

  const selectedCount = useMemo(
    () => Object.values(quantities).reduce((sum, value) => sum + value, 0),
    [quantities],
  );

  const ctaLabel =
    selectedCount > 0
      ? `Reserve ${selectedCount} seat${selectedCount === 1 ? "" : "s"}`
      : "Select tickets";

  function setQuantity(ticketTypeId: string, next: number) {
    setQuantities((current) => ({ ...current, [ticketTypeId]: Math.max(0, next) }));
  }

  async function reserve() {
    setError(null);

    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/events/${eventSlug}`)}`);
      return;
    }

    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    if (items.length === 0) {
      setError("Select at least one ticket to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiFetch<{ booking: { id: string } }>("/api/bookings/holds", {
        method: "POST",
        body: { eventId, items },
      });
      toast.success("Seats held for 10 minutes — complete payment to confirm.");
      router.push(`/checkout/${result.booking.id}`);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not reserve seats. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isCancelled) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive" title="This event was cancelled">
            The organizer cancelled this event. Existing bookings have been refunded.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="size-5 text-primary" />
          Choose tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <Alert variant="destructive">{error}</Alert> : null}

        {ticketTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tickets for this event are not on sale yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {ticketTypes.map((type) => {
              const remaining = Math.max(0, type.quantity - type.sold);
              const soldOut = remaining === 0;
              const quantity = quantities[type.id] ?? 0;

              return (
                <li
                  key={type.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{type.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.price === 0 ? "Free" : formatMoney(type.price)} ·{" "}
                      {soldOut ? "Sold out" : `${remaining} left`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label={`Remove one ${type.name}`}
                      disabled={quantity === 0}
                      onClick={() => setQuantity(type.id, quantity - 1)}
                    >
                      <Minus />
                    </Button>
                    <Input
                      readOnly
                      value={quantity}
                      aria-label={`${type.name} quantity`}
                      className="h-8 w-10 px-0 text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label={`Add one ${type.name}`}
                      disabled={soldOut || quantity >= Math.min(10, remaining)}
                      onClick={() => setQuantity(type.id, quantity + 1)}
                    >
                      <Plus />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-semibold">{formatMoney(total)}</span>
        </div>

        <Button
          className="w-full"
          disabled={submitting || selectedCount === 0 || ticketTypes.length === 0}
          onClick={reserve}
        >
          {submitting ? <Spinner /> : null}
          {submitting ? "Reserving…" : ctaLabel}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Seats are held for 10 minutes.{" "}
          {isAuthenticated ? null : (
            <Link
              href={`/login?next=/events/${eventSlug}`}
              className="text-primary hover:underline"
            >
              Sign in to book faster
            </Link>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

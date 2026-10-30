"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Clock, CreditCard, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, apiFetch } from "@/lib/api-client";
import { cn, formatDateTime, formatMoney } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

interface CheckoutBooking {
  id: string;
  code: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  expiresAt: string | null;
  event: {
    id: string;
    title: string;
    startAt: string;
    city: string | null;
    isOnline: boolean;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    ticketType: { name: string };
  }[];
}

export function CheckoutPanel({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const {
    data,
    isPending,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => apiFetch<{ booking: CheckoutBooking }>(`/api/bookings/${bookingId}`),
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const booking = data?.booking;
  const remainingMs =
    booking?.expiresAt && now !== null
      ? Math.max(0, new Date(booking.expiresAt).getTime() - now)
      : null;
  const expired = remainingMs !== null && remainingMs === 0;

  async function pay() {
    setError(null);
    setPaying(true);
    try {
      // Small delay purely to show the gateway's loading state.
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const result = await apiFetch<{
        status: "CONFIRMED" | "FAILED";
        bookingId?: string;
      }>(`/api/bookings/${bookingId}/checkout`, {
        method: "POST",
        body: { method, simulate: simulateFailure ? "failure" : "success" },
      });

      if (result.status === "FAILED") {
        setError("Your payment was declined by the mock gateway. No seats were charged.");
        toast.error("Payment failed");
        return;
      }

      toast.success("Payment successful — booking confirmed!");
      router.replace(`/bookings/${bookingId}?paid=1`);
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Payment could not be processed.",
      );
    } finally {
      setPaying(false);
    }
  }

  if (isPending) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <Alert variant="destructive" title="Could not load this booking">
        <p>{queryError instanceof Error ? queryError.message : "Please try again."}</p>
        <Link
          href="/bookings"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Back to my bookings
        </Link>
      </Alert>
    );
  }

  if (booking.status === "CONFIRMED") {
    return (
      <Alert variant="success" title="This booking is already confirmed">
        <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline">
          View booking details
        </Link>
      </Alert>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Payment method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {(["CARD", "UPI"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMethod(option)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors",
                    method === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {option === "CARD" ? (
                    <CreditCard className="size-4" />
                  ) : (
                    <Smartphone className="size-4" />
                  )}
                  {option === "CARD" ? "Card" : "UPI"}
                </button>
              ))}
            </div>

            <Alert variant="warning" className="text-xs">
              This is a simulated gateway. Do not enter real card or UPI details — nothing
              you type here is transmitted or stored.
            </Alert>

            {method === "CARD" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cardName">Name on card</Label>
                  <Input id="cardName" placeholder="Ada Lovelace" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cardNumber">Card number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiry">Expiry</Label>
                    <Input id="expiry" placeholder="12 / 30" autoComplete="off" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="123" autoComplete="off" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="vpa">UPI ID</Label>
                <Input id="vpa" placeholder="yourname@upi" autoComplete="off" />
              </div>
            )}

            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-[var(--primary)]"
                checked={simulateFailure}
                onChange={(event) => setSimulateFailure(event.target.checked)}
              />
              Simulate a declined payment (for testing the failure path)
            </label>

            {error ? <Alert variant="destructive">{error}</Alert> : null}
            {expired ? (
              <Alert variant="destructive" title="Your seat hold has expired">
                Go back and choose tickets again.
              </Alert>
            ) : null}

            <Button
              className="w-full"
              size="lg"
              onClick={pay}
              disabled={paying || expired}
            >
              {paying ? <Spinner /> : <Lock />}
              {paying ? "Processing payment…" : `Pay ${formatMoney(booking.total)}`}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:sticky lg:top-20 lg:h-fit">
        <CardHeader>
          <CardTitle>Order summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium">{booking.event.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(booking.event.startAt)} ·{" "}
              {booking.event.isOnline ? "Online" : (booking.event.city ?? "Venue TBA")}
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-3">
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.ticketType.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 border-t border-border pt-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatMoney(booking.subtotal)}</span>
            </div>
            {booking.discount > 0 ? (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatMoney(booking.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(booking.total)}</span>
            </div>
          </div>

          <div className="rounded-lg bg-muted/60 p-3 text-xs">
            <p className="flex items-center gap-1.5 font-medium">
              <Clock className="size-3.5" />
              {remainingMs === null
                ? "Hold expires 10 minutes after reserving"
                : expired
                  ? "Hold expired"
                  : `Hold expires in ${formatDuration(remainingMs)}`}
            </p>
            <p className="mt-1 text-muted-foreground">Booking reference {booking.code}</p>
          </div>

          {booking.status !== "PENDING" ? (
            <Alert variant="warning">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-4" />
                This booking is {booking.status.toLowerCase()} and cannot be paid.
              </span>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

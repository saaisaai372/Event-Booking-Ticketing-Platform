import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSessionUser } from "@/lib/auth/session";
import { getBookingForUser } from "@/features/bookings/booking.service";
import { CancelBookingButton } from "@/features/bookings/components/cancel-booking-button";
import { TicketCard, type TicketView } from "@/features/tickets/components/ticket-card";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking details" };

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/bookings");

  const { id } = await params;
  const { paid } = await searchParams;

  let booking;
  try {
    booking = await getBookingForUser(user.id, id, user.role === "ADMIN");
  } catch {
    notFound();
  }

  const tickets: TicketView[] = booking.tickets.map((ticket) => ({
    id: ticket.id,
    code: ticket.code,
    qrToken: ticket.qrToken,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt?.toISOString() ?? null,
    ticketType: {
      name:
        booking.items.find((item) => item.ticketTypeId === ticket.ticketTypeId)
          ?.ticketType.name ?? "Ticket",
      price:
        booking.items.find((item) => item.ticketTypeId === ticket.ticketTypeId)
          ?.unitPrice ?? 0,
    },
    event: {
      title: booking.event.title,
      slug: booking.event.slug,
      startAt: booking.event.startAt.toISOString(),
      city: booking.event.city,
      isOnline: booking.event.isOnline,
      venueName: booking.event.venueName,
    },
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to my bookings
      </Link>

      {paid ? (
        <Alert variant="success" title="Payment successful">
          <span className="flex items-center gap-2">
            <PartyPopper className="size-4" />
            Your booking is confirmed and your QR tickets are below.
          </span>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{booking.event.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Booking {booking.code} · placed {formatDateTime(booking.createdAt)}
            </p>
          </div>
          <StatusBadge status={booking.status} />
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                When
              </dt>
              <dd>{formatDateTime(booking.event.startAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Where
              </dt>
              <dd>
                {booking.event.isOnline
                  ? "Online"
                  : (booking.event.venueName ?? booking.event.city ?? "Venue TBA")}
              </dd>
            </div>
          </dl>

          <div className="space-y-2 border-t border-border pt-4 text-sm">
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {item.ticketType.name} × {item.quantity}
                </span>
                <span>{formatMoney(item.subtotal)}</span>
              </div>
            ))}
            {booking.discount > 0 ? (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-{formatMoney(booking.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total paid</span>
              <span>{formatMoney(booking.total)}</span>
            </div>
          </div>

          {booking.payment ? (
            <p className="text-xs text-muted-foreground">
              Mock payment · {booking.payment.method} · {booking.payment.status} ·{" "}
              {booking.payment.reference}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {booking.status === "PENDING" ? (
              <Link href={`/checkout/${booking.id}`} className="inline-flex">
                <Button>Complete payment</Button>
              </Link>
            ) : null}
            {booking.status === "CONFIRMED" || booking.status === "PENDING" ? (
              <CancelBookingButton bookingId={booking.id} />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {tickets.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Your tickets</h2>
          <ul className="space-y-4">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <TicketCard ticket={ticket} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

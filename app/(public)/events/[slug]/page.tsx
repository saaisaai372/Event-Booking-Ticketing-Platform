import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { getSessionUser } from "@/lib/auth/session";
import { getEventBySlug } from "@/features/events/event.service";
import { releaseExpiredHolds } from "@/features/bookings/booking.service";
import {
  BookingWidget,
  type PublicTicketType,
} from "@/features/events/components/booking-widget";
import { SaveEventButton } from "@/features/events/components/save-event-button";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatMoney } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.summary ?? event.description.slice(0, 155),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  await releaseExpiredHolds();

  const { slug } = await params;
  const [event, user] = await Promise.all([getEventBySlug(slug), getSessionUser()]);

  if (!event || (event.status !== "APPROVED" && event.status !== "CANCELLED")) {
    notFound();
  }

  const saved = user
    ? Boolean(
        await prisma.savedEvent.findUnique({
          where: { userId_eventId: { userId: user.id, eventId: event.id } },
        }),
      )
    : false;

  const ticketTypes: PublicTicketType[] = event.ticketTypes.map((type) => ({
    id: type.id,
    name: type.name,
    description: type.description,
    price: type.price,
    quantity: type.quantity,
    sold: type.sold,
    saleStartAt: type.saleStartAt?.toISOString() ?? null,
    saleEndAt: type.saleEndAt?.toISOString() ?? null,
    isActive: type.isActive,
  }));

  const seatsLeft = ticketTypes.reduce(
    (total, type) => total + Math.max(0, type.quantity - type.sold),
    0,
  );
  const priceFrom = ticketTypes.length
    ? Math.min(...ticketTypes.map((type) => type.price))
    : 0;

  return (
    <article>
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-muted">
        {event.bannerUrl ? (
          <Image
            src={event.bannerUrl}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CalendarDays className="size-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {event.category ? <Badge>{event.category.name}</Badge> : null}
            {event.isOnline ? <Badge variant="secondary">Online</Badge> : null}
            {event.status === "CANCELLED" ? (
              <Badge variant="destructive">Cancelled</Badge>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {event.title}
          </h1>

          {event.summary ? (
            <p className="mt-3 text-lg text-muted-foreground">{event.summary}</p>
          ) : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-5 text-primary" />
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Starts
                </dt>
                <dd className="text-sm">{formatDateTime(event.startAt)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-5 text-primary" />
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Ends
                </dt>
                <dd className="text-sm">{formatDateTime(event.endAt)}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-primary" />
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {event.isOnline ? "Online" : "Venue"}
                </dt>
                <dd className="text-sm">
                  {event.isOnline ? (
                    <a
                      href={event.onlineUrl ?? "#"}
                      className="text-primary hover:underline"
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      Join link
                    </a>
                  ) : (
                    <>
                      {event.venueName ?? "Venue to be announced"}
                      {event.venueAddress ? (
                        <span className="block text-muted-foreground">
                          {event.venueAddress}
                        </span>
                      ) : null}
                    </>
                  )}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-5 text-primary" />
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Availability
                </dt>
                <dd className="text-sm">
                  {seatsLeft > 0 ? `${seatsLeft} seats left` : "Sold out"}
                </dd>
              </div>
            </div>
          </dl>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">About this event</h2>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Organizer</h2>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={event.organizer.name} src={event.organizer.avatarUrl} />
              <div>
                <p className="text-sm font-medium">{event.organizer.name}</p>
                <Link
                  href={`/events?search=${encodeURIComponent(event.organizer.name)}`}
                  className="text-xs text-primary hover:underline"
                >
                  View their other events
                </Link>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <BookingWidget
            eventId={event.id}
            eventSlug={event.slug}
            ticketTypes={ticketTypes}
            isAuthenticated={Boolean(user)}
            isCancelled={event.status === "CANCELLED"}
          />

          <SaveEventButton
            slug={event.slug}
            initialSaved={saved}
            isAuthenticated={Boolean(user)}
          />

          <Card>
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <Ticket className="size-5 text-primary" />
              <div>
                <p className="font-medium">
                  {priceFrom === 0 ? "Free entry" : `From ${formatMoney(priceFrom)}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ticketTypes.length} ticket type{ticketTypes.length === 1 ? "" : "s"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </article>
  );
}

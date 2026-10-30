import Link from "next/link";
import {
  CalendarCheck,
  CreditCard,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { EventCard } from "@/features/events/components/event-card";
import { listFeaturedEvents } from "@/features/events/event.service";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HOW_IT_WORKS = [
  {
    icon: Search,
    title: "Discover",
    description: "Search and filter events by category, city, date and price.",
  },
  {
    icon: CreditCard,
    title: "Book",
    description:
      "Pick your ticket type — seats are held for 10 minutes while you check out.",
  },
  {
    icon: QrCode,
    title: "Check in",
    description: "Pay with the mock gateway and get a QR ticket scanned at the door.",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  Music: "🎵",
  Technology: "💻",
  Business: "💼",
  Sports: "🏆",
  "Arts & Culture": "🎨",
  "Food & Drink": "🍽️",
  "Health & Wellness": "🧘",
  Education: "🎓",
};

export default async function LandingPage() {
  const featured = await listFeaturedEvents(6);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-accent/40"
        />
        <div className="relative container-page py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" />
              Live events, booked in seconds
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find your next
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                {" "}
                unforgettable event
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              From concerts and conferences to workshops and food festivals — discover
              what&apos;s happening near you and book your seat with a QR ticket.
            </p>

            <form action="/events" className="mt-8 flex max-w-lg gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  name="search"
                  placeholder="Search events, artists, topics…"
                  aria-label="Search events"
                  className="h-11 w-full rounded-lg border border-input bg-background pr-3 pl-9 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                />
              </div>
              <button type="submit" className={cn(buttonVariants({ size: "lg" }))}>
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Verified organizers
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarCheck className="size-4 text-primary" /> Instant confirmation
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Browse by category</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick a vibe and see what&apos;s on.
            </p>
          </div>
          <Link
            href="/events"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all events →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/events?category=${category.slug}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <span aria-hidden className="text-xl">
                {CATEGORY_ICONS[category.name] ?? "🎫"}
              </span>
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pb-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Featured &amp; upcoming
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Handpicked events happening soon.
            </p>
          </div>
        </div>

        {featured.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Card className="mt-6 flex flex-col items-center gap-3 p-10 text-center">
            <CalendarCheck className="size-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No published events yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Once organizers publish events they&apos;ll show up here.
              </p>
            </div>
            <Link href="/for-organizers" className={cn(buttonVariants({ size: "sm" }))}>
              Become an organizer
            </Link>
          </Card>
        )}
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-card/40">
        <div className="container-page py-14">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <div key={step.title} className="relative">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </div>
                <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/30 p-8 sm:p-12">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Hosting an event? Sell tickets in minutes.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Create your event, set ticket types and quantities, and track sales and
            attendees from your organizer dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
              Get started free
            </Link>
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Browse events
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

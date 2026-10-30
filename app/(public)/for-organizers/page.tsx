import Link from "next/link";
import type { Metadata } from "next";
import { BarChart3, CalendarPlus, ScanLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "For organizers",
  description: "Create events, sell tickets and check attendees in with Evently.",
};

const STEPS = [
  {
    icon: CalendarPlus,
    title: "Create your event",
    body: "Add a banner, date and venue (or a join link), then define ticket types with prices and quantities.",
  },
  {
    icon: Sparkles,
    title: "Get approved",
    body: "Submit for review. An admin approves it and your event goes live on the explore page.",
  },
  {
    icon: BarChart3,
    title: "Track sales",
    body: "Watch revenue, tickets sold and check-ins per event from your analytics dashboard.",
  },
  {
    icon: ScanLine,
    title: "Check attendees in",
    body: "Scan (or type) each QR ticket at the door. Every ticket can only be used once.",
  },
];

export default function ForOrganizersPage() {
  return (
    <div className="container-page py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Sell tickets for your event in minutes
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Evently handles seat inventory, holds and QR tickets so you can focus on the
          event itself. Payments are simulated in this demo — no gateway is involved.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/register">
            <Button size="lg">Create an account</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline" size="lg">
              See live events
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <Card key={step.title}>
            <CardContent className="p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Step {index + 1}
              </p>
              <h2 className="mt-1 text-lg font-semibold">{step.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-12">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Already have an account? Request organizer access from your{" "}
          <Link href="/profile" className="text-primary hover:underline">
            profile page
          </Link>{" "}
          — an admin will approve it.
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Is this a real payment gateway?",
    a: "No. Checkout uses a mock gateway. You can enter anything (or nothing) in the card fields — nothing is sent anywhere or stored. Use the “simulate a declined payment” toggle to test the failure path.",
  },
  {
    q: "How long are seats held?",
    a: "When you reserve seats we hold them for 10 minutes. If you don't complete payment in that window the hold is released automatically and the seats go back on sale.",
  },
  {
    q: "Can an event be oversold?",
    a: "No. Seat counts are decremented with a conditional atomic update, so concurrent checkouts can never push sales past an event's capacity.",
  },
  {
    q: "How does check-in work?",
    a: "Each ticket has a unique QR code. Organizers scan (or type) the code on the check-in page. A ticket is marked used exactly once — a second scan is rejected.",
  },
  {
    q: "How do I become an organizer?",
    a: "Sign up, then request organizer access from your profile. An admin reviews and approves the request.",
  },
  {
    q: "What happens if an organizer cancels an event?",
    a: "All confirmed bookings are cancelled, tickets are voided, seats are released, and every attendee receives an in-app notification.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
      <div className="mt-8 space-y-4">
        {FAQS.map((faq) => (
          <Card key={faq.q}>
            <CardContent className="p-5">
              <h2 className="font-semibold">{faq.q}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-sm text-muted-foreground">
        Still stuck? Visit the{" "}
        <Link href="/contact" className="text-primary hover:underline">
          contact page
        </Link>
        .
      </p>
    </div>
  );
}

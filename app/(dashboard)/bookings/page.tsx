import type { Metadata } from "next";
import { BookingsList } from "@/features/bookings/components/bookings-list";

export const metadata: Metadata = { title: "My bookings" };

export default function BookingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track, view and cancel your event bookings.
        </p>
      </header>
      <BookingsList />
    </div>
  );
}

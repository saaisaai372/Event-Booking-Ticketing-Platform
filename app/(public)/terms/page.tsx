import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight">Terms of service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          Evently is a demonstration application. It is provided as-is for evaluation
          purposes and carries no warranty of availability or fitness for any purpose.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">Payments</h2>
        <p>
          All payments in this application are simulated. No real money is transferred, no
          payment provider is contacted, and no card or UPI credentials are collected,
          transmitted or stored. The checkout screen is a visual mock only.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">Accounts</h2>
        <p>
          You are responsible for keeping your account credentials secure. Accounts may be
          suspended or removed by administrators of this demonstration environment.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">Bookings</h2>
        <p>
          Seat holds expire after 10 minutes if payment is not completed. Organizers may
          cancel events; in that case affected bookings are cancelled and attendees are
          notified in-app.
        </p>
      </div>
    </div>
  );
}

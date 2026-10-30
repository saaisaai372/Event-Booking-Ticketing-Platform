import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight">About Evently</h1>
      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Evently is a full-stack event booking and ticketing platform built as an intern
          project. Organizers create events and sell tickets; attendees discover events,
          book seats, and receive QR-coded tickets; admins approve events and manage
          users.
        </p>
        <p>
          Payments are deliberately simulated — the checkout screen is a mock gateway that
          never transmits or stores card or UPI details. Seat holds, ticket issuance and
          check-in are real, backed by a relational database with atomic inventory updates
          so events can never be oversold.
        </p>
        <p>
          The platform is built with Next.js (App Router) and TypeScript, Tailwind CSS for
          a responsive design system, TanStack Query for server state, and Prisma over a
          relational database.
        </p>
      </div>
    </div>
  );
}

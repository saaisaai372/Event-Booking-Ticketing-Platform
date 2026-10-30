import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { TicketsTabs } from "@/features/tickets/components/tickets-tabs";

export const metadata: Metadata = { title: "My tickets" };

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">My tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Show the QR code at the entrance — each ticket can be scanned once.
        </p>
      </header>

      <Alert className="flex items-start gap-2 text-xs">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>
          Screenshot brightness up: QR codes are scanned by the organizer&apos;s check-in
          scanner.
        </span>
      </Alert>

      <TicketsTabs />
    </div>
  );
}

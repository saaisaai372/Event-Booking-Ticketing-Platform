"use client";

import { QRCodeSVG } from "qrcode.react";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, formatMoney } from "@/lib/utils";

export interface TicketView {
  id: string;
  code: string;
  qrToken: string;
  status: string;
  checkedInAt: string | null;
  ticketType: { name: string; price: number };
  event: {
    title: string;
    slug: string;
    startAt: string;
    endAt?: string;
    city: string | null;
    isOnline: boolean;
    venueName?: string | null;
    venueAddress?: string | null;
  };
}

export function TicketCard({ ticket }: { ticket: TicketView }) {
  const usable = ticket.status === "VALID";

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-lg border border-border bg-white p-2">
            <QRCodeSVG
              value={ticket.qrToken}
              size={132}
              level="M"
              marginSize={0}
              className={usable ? "" : "opacity-30"}
            />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {ticket.code}
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{ticket.event.title}</h3>
            <StatusBadge status={ticket.status} />
          </div>

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="size-4" />
            {formatDateTime(ticket.event.startAt)}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {ticket.event.isOnline
              ? "Online event"
              : (ticket.event.venueName ?? ticket.event.city ?? "Venue TBA")}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">{ticket.ticketType.name}</Badge>
            <span className="text-sm text-muted-foreground">
              {ticket.ticketType.price === 0
                ? "Free"
                : formatMoney(ticket.ticketType.price)}
            </span>
          </div>

          {ticket.status === "USED" && ticket.checkedInAt ? (
            <p className="text-xs text-muted-foreground">
              Checked in {formatDateTime(ticket.checkedInAt)}
            </p>
          ) : null}
          {ticket.status === "CANCELLED" ? (
            <p className="text-xs text-destructive">This ticket is no longer valid.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

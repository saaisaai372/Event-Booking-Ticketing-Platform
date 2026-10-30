"use client";

import { useState } from "react";
import { CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, apiFetch } from "@/lib/api-client";
import { QrCameraScanner } from "@/features/organizer/components/qr-camera-scanner";

interface CheckInResult {
  code: string;
  ticketType: string;
  attendee: string;
  event: string;
}

export function CheckInPanel() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CheckInResult[]>([]);

  async function checkIn(scanValue: string) {
    if (!scanValue.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<CheckInResult>("/api/organizer/check-in", {
        method: "POST",
        body: { value: scanValue.trim() },
      });
      setResult(data);
      setHistory((current) => [data, ...current].slice(0, 10));
      setValue("");
    } catch (caught) {
      setError(
        caught instanceof ApiError ? caught.message : "Could not check in this ticket.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="size-5 text-primary" />
            Check in a ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <QrCameraScanner onScan={checkIn} busy={busy} />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              or type it
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void checkIn(value);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="ticket">Ticket code or QR token</Label>
              <Input
                id="ticket"
                autoFocus
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="EVT-20261029-A1B2C3-01"
              />
              <p className="text-xs text-muted-foreground">
                Scanners can also type the code printed under the QR. Each ticket works
                once.
              </p>
            </div>
            <Button type="submit" disabled={busy || !value.trim()}>
              {busy ? <Spinner /> : null}
              Check in
            </Button>
          </form>

          {result ? (
            <Alert variant="success" title="Checked in successfully">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {result.attendee} · {result.ticketType} · {result.event}
              </span>
              <p className="mt-1 text-xs">Ticket {result.code}</p>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive" title="Not checked in">
              <span className="flex items-center gap-2">
                <XCircle className="size-4" />
                {error}
              </span>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Recently scanned</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scans yet this session.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((entry, index) => (
                <li
                  key={`${entry.code}-${index}`}
                  className="border-b border-border pb-2 last:border-0"
                >
                  <p className="font-medium">{entry.attendee}</p>
                  <p className="text-xs text-muted-foreground">{entry.code}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const DUPLICATE_WINDOW_MS = 3000;

/**
 * Camera-based QR scanner. `@zxing/browser` is imported lazily inside `start()`
 * so the decoder never touches `window` during server rendering, and its weight
 * is only paid when an operator actually opens the camera.
 *
 * Note: camera access requires a secure context — `localhost` or any HTTPS origin.
 */
export function QrCameraScanner({
  onScan,
  busy = false,
}: {
  onScan: (value: string) => void;
  busy?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: "", at: 0 });
  const busyRef = useRef(busy);
  const onScanRef = useRef(onScan);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    busyRef.current = busy;
    onScanRef.current = onScan;
  }, [busy, onScan]);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => controlsRef.current?.stop(), []);

  async function start() {
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError(
        "This browser can't open the camera here. Use the code field below, or open the site over HTTPS.",
      );
      return;
    }

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current ?? undefined,
        (result) => {
          if (!result || busyRef.current) return;

          const value = result.getText().trim();
          if (!value) return;

          const now = Date.now();
          const previous = lastScanRef.current;
          if (previous.value === value && now - previous.at < DUPLICATE_WINDOW_MS) return;

          lastScanRef.current = { value, at: now };
          onScanRef.current(value);
        },
      );

      controlsRef.current = controls;
      setActive(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(
        /permission|denied|notallowed/i.test(message)
          ? "Camera permission was blocked. Allow camera access for this site and try again."
          : "Could not start the camera. Use the code field below instead.",
      );
      setActive(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted">
        <video
          ref={videoRef}
          className="size-full object-cover"
          muted
          playsInline
          aria-label="Camera preview"
        />
        {!active ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Camera className="size-6" />
            <span>Camera is off</span>
          </div>
        ) : (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-8 rounded-lg border-2 border-primary/70"
          />
        )}
      </div>

      {error ? (
        <Alert variant="destructive" className="text-xs">
          {error}
        </Alert>
      ) : null}

      <div className="flex items-center gap-2">
        {active ? (
          <Button type="button" variant="outline" onClick={stop}>
            <CameraOff />
            Stop camera
          </Button>
        ) : (
          <Button type="button" onClick={start}>
            <Camera />
            Scan with camera
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Point the camera at the ticket QR. Each code is submitted once every few
          seconds.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-14">
      <h1 className="text-3xl font-bold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
      </p>
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">What we store</h2>
        <p>
          We store your name, email address, a securely hashed password (bcrypt), and
          optional profile details such as an avatar URL and bio. We store the events you
          create, the bookings you make and the tickets issued to you.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">
          What we never store
        </h2>
        <p>
          Card numbers, CVCs and UPI IDs are never collected, transmitted or stored. The
          mock payment screen deliberately discards everything typed into it.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">Cookies</h2>
        <p>
          Authentication uses short-lived access tokens plus a refresh token, both stored
          in HTTP-only cookies. No authentication token is ever written to localStorage or
          sessionStorage.
        </p>
        <h2 className="pt-2 text-base font-semibold text-foreground">Third parties</h2>
        <p>
          This demo does not share data with third parties. Event banner images may be
          loaded from an external image host if an organizer supplies one.
        </p>
      </div>
    </div>
  );
}

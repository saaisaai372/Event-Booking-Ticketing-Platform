# Evently — Event Booking & Ticketing Platform

A full-stack event booking and ticketing platform. Organizers create events and sell
tickets, attendees discover events, book with a mock payment flow and receive QR-coded
tickets, and admins approve events and manage users.

> **Payments are simulated.** There is no payment gateway integration and no card or UPI
> detail is ever accepted, transmitted or stored.

---

## Features

**Attendee**

- Landing page with hero, featured events, categories and how-it-works
- Explore events with search (name) and filters (category, city, date, price) plus sorting —
  all kept in the URL
- Event detail with ticket types, availability and a booking widget
- Seat hold for 10 minutes while you check out; released automatically if you don't pay
- Mock payment screen (card or UPI) with loading, success and simulated-decline paths
- Booking confirmation with one QR ticket per seat
- My bookings (list, detail, cancel) and My tickets (upcoming/past tabs with QR codes)
- Apply a coupon code at checkout with a live discount preview
- Saved events, profile editing, password change, organizer access request
- Email verification / password reset via 6-digit OTP

**Organizer**

- Create and edit events (banner, date/time, venue or online link, ticket types)
- Draft → submit for approval → publish flow
- Cancel an event, automatically notifying every attendee
- Create percentage or fixed-amount **coupons** per event, with usage caps and expiry
- Analytics: revenue, tickets sold, check-ins, per-event breakdown and a 6-month trend
- Attendee list per event
- QR check-in — scan with the camera or type the code; single use, with clear feedback for
  already-used or invalid tickets

**Admin**

- Approve or reject event submissions with a reason
- Approve or decline organizer access requests
- Manage users: change roles, suspend/reactivate
- Platform stats and charts

**Cross-cutting**

- Role-based access control enforced in `proxy.ts` _and_ on every API route
- Consistent API response envelope and error codes
- Loading, empty, error and success states on every data screen
- Responsive at 360 px, 768 px and desktop; light/dark/system theme
- Toasts, inline form errors and confirm dialogs

---

## Tech stack and why

| Layer        | Choice                                                   | Why                                                                            |
| ------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Framework    | **Next.js 16 (App Router)**                              | One codebase for UI + API, React Server Components, file-based routing         |
| Language     | **TypeScript (strict)**                                  | Types shared between forms, services and API                                   |
| Styling      | **Tailwind CSS v4** + owned shadcn-style primitives      | Semantic design tokens, no heavy UI dependency                                 |
| Database     | **Prisma** + **PostgreSQL** (Neon)                       | Serverless-friendly managed Postgres, schema-first workflow                    |
| Auth         | **Custom JWT** (`jose`) + **bcrypt** in httpOnly cookies | Short-lived access token + rotating refresh token, no tokens in `localStorage` |
| Server state | **TanStack Query**                                       | Caching and refetch-after-mutation                                             |
| Forms        | **React Hook Form** + **Zod**                            | One schema validates the form _and_ the API                                    |
| Charts       | **Recharts**                                             | Dashboard visualisations                                                       |
| QR           | **qrcode.react** / **@zxing/browser**                    | Render ticket QR codes, and decode them at the door                            |
| Tests        | **Vitest** + Testing Library                             | Fast unit and component tests                                                  |

---

## Getting started

Requirements: **Node.js ≥ 20.9** and **pnpm**.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env          # then edit the secrets (see below)

# 3. Create the tables and generate the Prisma client
pnpm db:push

# 4. Seed demo data (12 events, 8 categories, 3 roles)
pnpm db:seed

# 5. Run the app
pnpm dev                      # http://localhost:3000
```

Generate local JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment variables

| Variable                                   | Required | Description                                                                                                                          |
| ------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                             | ✅       | Postgres URL. The Prisma provider is inferred from the scheme (`file:` → sqlite, `postgresql://` → postgres).                        |
| `DATABASE_URL_POOLED`                      | —        | Optional pooled URL for serverless hosts (Neon's `-pooler` host).                                                                    |
| `JWT_ACCESS_SECRET`                        | ✅       | Signs the 15-minute access token                                                                                                     |
| `JWT_REFRESH_SECRET`                       | ✅       | Signs refresh material                                                                                                               |
| `ACCESS_TOKEN_TTL_MINUTES`                 | —        | Access token lifetime (default `15`)                                                                                                 |
| `REFRESH_TOKEN_TTL_DAYS`                   | —        | Refresh token lifetime (default `7`)                                                                                                 |
| `NEXT_PUBLIC_APP_URL`                      | —        | Public site URL (default `http://localhost:3000`)                                                                                    |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | —        | Admin account created by the seed                                                                                                    |
| `EMAIL_FROM`, `RESEND_API_KEY`             | —        | Optional email delivery. **If unset, OTP codes are written to the server log and returned in the API response in development only.** |

Only `.env.example` is committed; `.env` is gitignored.

---

## Test logins

All seeded users (except admin) share the password `Password@123`.

| Role          | Email                          | Password       |
| ------------- | ------------------------------ | -------------- |
| **Admin**     | `admin@evently.test`           | `Admin@12345`  |
| **Organizer** | `priya.organizer@evently.test` | `Password@123` |
| **Attendee**  | `rahul.attendee@evently.test`  | `Password@123` |

Other seeded accounts: `arjun.organizer@evently.test`, `neha.organizer@evently.test`,
`meera.attendee@evently.test`, `sam.attendee@evently.test`, and
`pending.organizer@evently.test` (has a pending organizer request to demo the admin flow).

The login screen has one-click buttons that fill these credentials.

---

## Scripts

| Command                             | Description                     |
| ----------------------------------- | ------------------------------- |
| `pnpm dev`                          | Start the dev server on :3000   |
| `pnpm build` / `pnpm start`         | Production build / serve        |
| `pnpm vercel-build`                 | Build command Vercel runs       |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                          |
| `pnpm format` / `pnpm format:check` | Prettier                        |
| `pnpm typecheck`                    | `tsc --noEmit`                  |
| `pnpm test` / `pnpm test:run`       | Vitest (watch / once)           |
| `pnpm test:coverage`                | Vitest with V8 coverage         |
| `pnpm db:push`                      | Sync the schema to the database |
| `pnpm db:seed`                      | Seed demo data (idempotent)     |
| `pnpm db:studio`                    | Browse the database             |
| `pnpm db:sync-provider`             | Align provider with the URL     |

---

## Project structure

```
app/
  (public)/     Landing, explore events, event detail, marketing pages
  (auth)/       Sign in, sign up, forgot/reset password, verify email
  (dashboard)/  Authenticated shell: dashboard, bookings, tickets, profile,
                checkout, saved, organizer/*, admin/*
  api/          Route handlers — the backend API
components/ui/  Design-system primitives
features/       Feature modules (schema + service + components + api client)
                auth/ events/ bookings/ tickets/ coupons/ organizer/ admin/
                dashboard/ profile/
lib/            Prisma client, env, auth, http helpers, utils, logger
prisma/         schema.prisma, seed.ts
scripts/        prepare-db.mjs — syncs the Prisma provider with DATABASE_URL
                check-db-config.mjs — fails the build on a provider/URL mismatch
docs/           Architecture, flow diagrams, ER diagram, API + deployment docs
proxy.ts        Route protection (Next 16's replacement for middleware)
```

---

## How the hard parts work

- **No overselling.** Seat inventory is decremented with a conditional update:
  `UPDATE "TicketType" SET sold = sold + n WHERE id = ? AND sold + n <= quantity`. If zero
  rows change, the seats sold out mid-checkout and the request fails with `409`.
- **Seat holds.** Reserving seats creates a `PENDING` booking and a `SeatHold` that expires
  in 10 minutes. Expired holds are released lazily before any availability read.
- **One ticket per seat, single use.** Checkout issues one `Ticket` per seat, each with a
  unique QR token. Check-in is a conditional update on `status = 'VALID'`, so a second scan
  is rejected even under a race.
- **Auth without `localStorage`.** Access (15 min) and refresh (7 day) tokens live in
  httpOnly cookies; refresh tokens are rotated on every use and hashed at rest.
- **Mock payments.** `Payment` records only method, amount, status and a mock reference.
- **Coupons.** A code is previewed in the booking widget for instant feedback, then
  re-validated and applied inside the seat-hold transaction, so the authoritative discount
  can never be spoofed by the client.

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/FLOWS.md`](docs/FLOWS.md) · [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) ·
[`docs/API.md`](docs/API.md).

---

## Deploying

The full walkthrough — Neon Postgres, environment variables, Vercel import and a
verification checklist — lives in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). In short:

1. **Database** — create a free Postgres instance (Neon / Supabase / Railway), put the
   connection string in `DATABASE_URL`, then `pnpm db:push && pnpm db:seed`.
2. **App** — import the repo into Vercel. `vercel.json` sets the build command
   (`pnpm vercel-build`); the Prisma provider is inferred from `DATABASE_URL`, so there is no
   provider flag to configure.
3. **Environment variables** — at minimum `DATABASE_URL`, `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET` and `NEXT_PUBLIC_APP_URL` (add them for Preview as well as Production).
4. **Verify** — `curl https://your-app.vercel.app/api/health` should return `status: "ok"`.

> The build runs `scripts/check-db-config.mjs`, which fails if the generated client cannot
> read `DATABASE_URL`. A Prisma provider/URL mismatch can otherwise pass the build and 500 at
> runtime, so treat the build badge as insufficient and check `/api/health`.

---

## Testing

`pnpm test:run` runs the Vitest suite (unit tests over validation schemas, formatting utils
and a component test). API and booking flows were verified manually end-to-end against a
running server, including hold → mock payment → QR ticket issuance, coupon redemption with
the discount applied, cancellation, and single-use check-in.

---

## Known limitations

- Payments are mocked; there is no gateway, webhook or refund integration.
- Organizer access is granted by an admin; there is no self-serve upgrade.
- Email is not actually sent unless `RESEND_API_KEY` is configured — OTP codes are logged
  (and returned in the API response in development only).
- Coupons are scoped to a single event; there are no platform-wide or first-order-only
  campaigns.
- Camera scanning needs a secure context, so it works on `localhost` and on the HTTPS
  deployment but not over plain HTTP.

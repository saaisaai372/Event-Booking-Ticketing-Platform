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
- Saved events, profile editing, password change, organizer access request
- Email verification / password reset via 6-digit OTP

**Organizer**

- Create and edit events (banner, date/time, venue or online link, ticket types)
- Draft → submit for approval → publish flow
- Cancel an event, automatically notifying every attendee
- Analytics: revenue, tickets sold, check-ins, per-event breakdown and a 6-month trend
- Attendee list per event
- QR check-in — single use, with clear feedback for already-used or invalid tickets

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
| Database     | **Prisma** + **SQLite** (dev) / **Postgres** (prod)      | Productive local dev with a realistic production path                          |
| Auth         | **Custom JWT** (`jose`) + **bcrypt** in httpOnly cookies | Short-lived access token + rotating refresh token, no tokens in `localStorage` |
| Server state | **TanStack Query**                                       | Caching and refetch-after-mutation                                             |
| Forms        | **React Hook Form** + **Zod**                            | One schema validates the form _and_ the API                                    |
| Charts       | **Recharts**                                             | Dashboard visualisations                                                       |
| QR           | **qrcode.react**                                         | Client-rendered ticket QR codes                                                |
| Tests        | **Vitest** + Testing Library                             | Fast unit and component tests                                                  |

---

## Getting started

Requirements: **Node.js ≥ 20.9** and **pnpm**.

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env          # then edit the secrets (see below)

# 3. Create the database and generate the Prisma client
pnpm db:migrate

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
| `DATABASE_URL`                             | ✅       | `file:./dev.db` for SQLite locally; a Postgres URL in production                                                                     |
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

| Command                             | Description                    |
| ----------------------------------- | ------------------------------ |
| `pnpm dev`                          | Start the dev server on :3000  |
| `pnpm build` / `pnpm start`         | Production build / serve       |
| `pnpm lint` / `pnpm lint:fix`       | ESLint                         |
| `pnpm format` / `pnpm format:check` | Prettier                       |
| `pnpm typecheck`                    | `tsc --noEmit`                 |
| `pnpm test` / `pnpm test:run`       | Vitest (watch / once)          |
| `pnpm test:coverage`                | Vitest with V8 coverage        |
| `pnpm db:migrate`                   | Create/apply dev migrations    |
| `pnpm db:seed`                      | Seed demo data (idempotent)    |
| `pnpm db:reset`                     | Drop, re-migrate and re-seed   |
| `pnpm db:deploy`                    | Apply migrations in production |
| `pnpm db:studio`                    | Browse the database            |

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
lib/            Prisma client, env, auth, http helpers, utils, logger
prisma/         schema.prisma, migrations, seed.ts
docs/           Architecture, flow diagrams, ER diagram, API reference
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

Full details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
[`docs/FLOWS.md`](docs/FLOWS.md) · [`docs/ER_DIAGRAM.md`](docs/ER_DIAGRAM.md) ·
[`docs/API.md`](docs/API.md).

---

## Deploying

1. **Database** — create a free Postgres instance (Neon / Supabase / Railway). In
   `prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"`, set
   `DATABASE_URL`, then run `pnpm prisma migrate deploy && pnpm db:seed`.
2. **App** — deploy to Vercel (or any Node host) with the same environment variables.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed origin so notification links resolve.

---

## Testing

`pnpm test:run` runs the Vitest suite (unit tests over validation schemas, formatting utils
and a component test). API and booking flows were verified manually end-to-end against a
running server, including hold → mock payment → QR ticket issuance, cancellation, and
single-use check-in.

---

## Known limitations

- Payments are mocked; there is no gateway, webhook or refund integration.
- Organizer access is granted by an admin; there is no self-serve upgrade.
- Email is not actually sent unless `RESEND_API_KEY` is configured — OTP codes are logged
  (and returned in the API response in development only).
- Coupon support exists in the data model and checkout pricing, but there is no coupon
  management UI yet.
- QR scanning is by code entry; a camera-based scanner can be layered on the same endpoint.

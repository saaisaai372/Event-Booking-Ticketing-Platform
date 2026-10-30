# Intern Project: Event Booking & Ticketing Platform

**Deadline:** Saturday, 24 October 2026, 4:00 PM IST  
**Type:** Individual, full-stack  
**Hosting:** Mandatory

## 1. What you will build

A complete, live web app where organizers create events and sell tickets, attendees discover events, book with a mock payment flow, and receive QR-coded tickets, and admins approve events and manage users.

## 2. Tech stack

| Layer | Requirement |
|---|---|
| Frontend | Next.js (App Router), TypeScript preferred, Tailwind / shadcn/ui or any UI library |
| Backend | Node.js (Express, NestJS or Next.js API routes) or Python (FastAPI, Django REST) |
| Database | Your choice: PostgreSQL, MySQL, MongoDB or Firestore (with Prisma, Drizzle, Mongoose or SQLAlchemy) |
| Auth | NextAuth/Auth.js, Clerk, Supabase/Firebase Auth, or custom JWT with refresh tokens |
| State | TanStack Query or SWR for server data + Zustand, Redux Toolkit or Context for UI state |
| Forms | React Hook Form + Zod/Yup; validate again on the server |
| Payment | No real payment gateway. Build a mock payment screen only (see section 5) |
| Other | QR code library; Cloudinary or similar for event banners |
| Tools | Any IDE: VS Code, Cursor, Antigravity, Claude Code |

## 3. User roles

- **Attendee:** browse events, book tickets, view bookings and tickets, cancel bookings.
- **Organizer:** everything an attendee can do, plus create and manage events, view sales and attendees, and check in tickets by QR.
- **Admin:** approve events and organizer requests, manage users, and view platform stats. Seed one admin account.

## 4. Mandatory screens

| Screen | Must include |
|---|---|
| 1. Landing page | Hero, featured / upcoming events, categories, how it works, footer |
| 2. Profile | View and edit details, avatar, change password, request organizer access |
| 3. Dashboard | Role-based: attendee summary, organizer sales and charts, admin overview |
| 4. Event creation | Details, banner upload, date/time, venue or online link, ticket types (price, quantity), draft / publish |
| 5. Ticket sale | Event detail, select ticket type and quantity, checkout summary, mock payment, confirmation |
| 6. My bookings | List with status, booking detail, cancel booking |
| 7. My tickets | Upcoming / past tabs, ticket with QR code |
| 8. Auth screens | Sign up, log in, forgot password, reset password, email verification / OTP |

**Build as many extra screens as possible:** explore events with search and filters, event detail, category page, payment success, ticket detail, organizer my events, edit event, event analytics and attendee list, QR check-in scanner, coupons, admin event approvals, admin users, notifications, saved events, settings, about / contact / FAQ, terms / privacy, 404, error and unauthorized pages.

## 5. Core features (must work on the live site)

- Search events by name; filter by category, city, date and price; sort by date or price.
- Multiple ticket types per event with price, quantity and sale window.
- Seats are held during checkout (e.g. 10 minutes) and released if payment is not completed.
- **No overselling:** update seat counts atomically (DB transaction or atomic update).
- **Mock payment only:** design a payment screen where the user enters card / UPI details (no real gateway, no real data stored), clicks Pay, sees a short loading state, then a payment successful screen and the booking is confirmed.
- One ticket per seat with a unique ID and QR code; a ticket can be checked in only once.
- Organizers can cancel an event; booked attendees are notified (in-app at minimum).
- Every data screen shows loading, empty, error and success states.

## 6. Technical requirements

### Auth & security

- Hashed passwords (bcrypt/argon2).
- HTTP-only cookies or short-lived JWT + refresh token; no tokens in `localStorage`.
- Protected routes via middleware and role checks on every backend API.
- Users can only access their own bookings.
- Secrets in environment variables; commit `.env.example` only.
- Never store mock card / UPI details.

### State management

- Server data with TanStack Query / SWR (cache + refetch after changes).
- UI state (user, ticket selection, filters, theme) in Zustand / Redux / Context.
- Keep search filters in the URL.

### Code quality

- TypeScript strict mode, ESLint + Prettier (Black/Ruff for Python).
- Small components; business logic in services; consistent naming; one API response format.
- No `console.log`, dead code or hard-coded secrets.
- Small commits with clear messages.

### Folder structure

Organise by feature, for example:

```text
app/
  (public)/
  (auth)/
  (dashboard)/
components/
  ui/
features/
  events/
  bookings/
hooks/
lib/
store/
types/
```

Backend: `modules/auth`, `events`, `bookings`, `tickets`, and `admin`, with routes, controller, service and schema in each module.

### Packages

- Use well-maintained, popular packages only.
- Commit the lockfile.
- Free / test tiers only.

### UI / UX

- Fully responsive at mobile (360 px), tablet (768 px) and desktop.
- Consistent colours, fonts and spacing.
- Skeleton loaders, inline form errors, toast messages, and confirm dialogs for cancel / delete.
- Accessible and attractive.

## 7. Documentation (mandatory)

- **Architecture diagram:** browser, Next.js frontend, backend modules, database, and external services (storage, email, AI) with how they connect.
- **Flow diagrams:** sign up and login, forgot / reset password, organizer approval, event creation and publishing, ticket booking (select, hold, mock payment, confirm, ticket), booking cancellation, and QR check-in.
- **ER diagram** of the database and API documentation (Swagger, Postman collection or an endpoint table).
- **README:** overview, features, tech stack and why, setup steps, environment variables, live links, test logins, screenshots.
- Keep all diagrams in a `/docs` folder.
- Tools: Excalidraw, draw.io, Mermaid, Figma or dbdiagram.io.

## 8. Hosting (mandatory)

- Frontend on Vercel or Netlify.
- Backend on Railway, Render or Fly.io.
- Database on Neon, Supabase, MongoDB Atlas or Railway.
- Seed at least 10 events in 4+ categories and test accounts for all 3 roles.
- **No live URL = not evaluated.**
- Deploy on day one and redeploy often.

## 9. Submission checklist

- [ ] GitHub repository link
- [ ] Live frontend and API URLs
- [ ] Test logins for Attendee, Organizer, Admin
- [ ] README
- [ ] Architecture, flow and ER diagrams
- [ ] API documentation

## Rules

- Individual work only; no copied projects or paid templates (UI libraries are fine).
- No real payment integration.
- Late submissions are not accepted.

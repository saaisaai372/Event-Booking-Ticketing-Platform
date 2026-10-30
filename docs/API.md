# API reference

Base URL: `/api`. Every response uses the same envelope:

```jsonc
// success
{ "success": true, "data": { /* … */ } }

// failure
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { } } }
```

**Auth:** a short-lived access JWT plus an opaque refresh token, both in `httpOnly` cookies
(`ev_access`, `ev_refresh`). Nothing is returned in the body and no token is stored client-side.

**Status codes:** `400` bad request · `401` unauthenticated · `403` forbidden · `404` not
found · `409` conflict (sold out / already checked in) · `422` validation · `500` unexpected.

| #   | Method | Endpoint                               | Auth        | Purpose                                          |
| --- | ------ | -------------------------------------- | ----------- | ------------------------------------------------ |
| 1   | GET    | `/api/health`                          | public      | Liveness + DB connectivity probe                 |
| 2   | POST   | `/api/auth/register`                   | public      | Create an account, set cookies, send OTP         |
| 3   | POST   | `/api/auth/login`                      | public      | Sign in, set cookies                             |
| 4   | POST   | `/api/auth/logout`                     | public      | Revoke refresh token, clear cookies              |
| 5   | POST   | `/api/auth/refresh`                    | cookie      | Rotate refresh token, reissue cookies            |
| 6   | GET    | `/api/auth/me`                         | optional    | Current session user (or `null`)                 |
| 7   | POST   | `/api/auth/forgot-password`            | public      | Send a 6-digit reset code                        |
| 8   | POST   | `/api/auth/reset-password`             | public      | Reset password with the code                     |
| 9   | POST   | `/api/auth/verify-email`               | public      | Verify email with the code                       |
| 10  | POST   | `/api/auth/resend-verification`        | user        | Send a fresh verification code                   |
| 11  | GET    | `/api/events`                          | public      | Browse approved events (search/filter/sort/page) |
| 12  | GET    | `/api/events/[slug]`                   | public      | Single approved event with ticket types          |
| 13  | POST   | `/api/events/[slug]/save`              | user        | Toggle saved state for an event                  |
| 14  | GET    | `/api/bookings`                        | user        | List my bookings (`?status=`)                    |
| 15  | POST   | `/api/bookings/holds`                  | user        | Reserve seats → `PENDING` booking (10-min hold)  |
| 16  | GET    | `/api/bookings/[id]`                   | owner/admin | Booking detail (owner or admin only)             |
| 17  | POST   | `/api/bookings/[id]/checkout`          | owner       | Mock payment → confirm + issue tickets           |
| 18  | POST   | `/api/bookings/[id]/cancel`            | owner/admin | Cancel booking, release seats                    |
| 19  | GET    | `/api/tickets`                         | user        | My tickets (`?scope=upcoming\|past\|all`)        |
| 20  | GET    | `/api/tickets/[id]`                    | owner/admin | Single ticket                                    |
| 21  | GET    | `/api/dashboard`                       | user        | Role-shaped dashboard summary                    |
| 22  | PATCH  | `/api/profile`                         | user        | Update name / phone / bio / avatar               |
| 23  | POST   | `/api/profile/password`                | user        | Change password (requires current password)      |
| 24  | POST   | `/api/profile/organizer-request`       | user        | Request organizer access                         |
| 25  | GET    | `/api/organizer/events`                | organizer   | List my events                                   |
| 26  | POST   | `/api/organizer/events`                | organizer   | Create an event (draft or submit)                |
| 27  | GET    | `/api/organizer/events/[id]`           | organizer   | Event detail for management                      |
| 28  | PATCH  | `/api/organizer/events/[id]`           | organizer   | Update an event                                  |
| 29  | POST   | `/api/organizer/events/[id]/publish`   | organizer   | Submit draft/rejected for approval               |
| 30  | POST   | `/api/organizer/events/[id]/cancel`    | organizer   | Cancel event, notify attendees                   |
| 31  | GET    | `/api/organizer/events/[id]/attendees` | organizer   | Attendee list + sales stats                      |
| 32  | POST   | `/api/organizer/check-in`              | organizer   | Check a ticket in (single use)                   |
| 33  | GET    | `/api/organizer/analytics`             | organizer   | Per-event sales + revenue trend                  |
| 34  | GET    | `/api/admin/events`                    | admin       | Approval queue (`?status=`)                      |
| 35  | POST   | `/api/admin/events/[id]/approve`       | admin       | Approve and publish an event                     |
| 36  | POST   | `/api/admin/events/[id]/reject`        | admin       | Reject with a reason                             |
| 37  | GET    | `/api/admin/users`                     | admin       | List/search users                                |
| 38  | PATCH  | `/api/admin/users/[id]`                | admin       | Change role / organizer status / active state    |
| 39  | GET    | `/api/admin/stats`                     | admin       | Platform stats + revenue trend                   |

## Representative request/response shapes

### `POST /api/bookings/holds`

```jsonc
// request
{
  "eventId": "cmv…",
  "items": [{ "ticketTypeId": "cmv…", "quantity": 2 }],
  "couponCode": "EARLY10"        // optional
}

// 201
{ "success": true, "data": { "booking": { "id": "cmv…", "code": "EVT-20261029-A1B2C3",
  "status": "PENDING", "subtotal": 79800, "discount": 0, "total": 79800,
  "expiresAt": "2026-10-29T17:05:00.000Z" } } }

// 409 when the seats went in the meantime
{ "success": false, "error": { "code": "CONFLICT",
  "message": "Those tickets just sold out. Please pick another type." } }
```

### `POST /api/bookings/[id]/checkout`

```jsonc
// request — note: no card or UPI data is ever accepted
{ "method": "CARD", "simulate": "success" }   // simulate: "success" | "failure"

// 200
{ "success": true, "data": { "status": "CONFIRMED", "reference": "pay_dcce…", "bookingId": "cmv…" } }
```

### `POST /api/organizer/check-in`

```jsonc
// request
{ "value": "EVT-20261029-A1B2C3-01" }   // printed code or QR token

// 200
{ "success": true, "data": { "ticketId": "cmv…", "code": "EVT-…-01",
  "ticketType": "General Admission", "attendee": "Rahul Sharma", "event": "Street Food Festival" } }

// 409 on a second scan
{ "success": false, "error": { "code": "CONFLICT",
  "message": "Already checked in at 2026-10-29T17:01:00.000Z." } }
```

### Error codes

| Code               | Meaning                                                |
| ------------------ | ------------------------------------------------------ |
| `VALIDATION_ERROR` | Zod schema rejected the payload (`details.issues[]`)   |
| `UNAUTHORIZED`     | No valid session                                       |
| `FORBIDDEN`        | Signed in but not allowed (wrong role / not the owner) |
| `NOT_FOUND`        | Resource missing                                       |
| `CONFLICT`         | Sold out, already checked in, duplicate email, …       |
| `BAD_REQUEST`      | Business rule violation (hold expired, not on sale, …) |
| `INTERNAL_ERROR`   | Unexpected server error                                |

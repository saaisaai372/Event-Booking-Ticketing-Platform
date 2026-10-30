# Flow diagrams

All flows are shown as Mermaid diagrams so they render on GitHub and stay in sync with the
code.

## 1. Sign up (register → verify email)

```mermaid
sequenceDiagram
    actor U as Visitor
    participant P as /register (page)
    participant A as POST /api/auth/register
    participant S as auth.service
    participant DB as Database

    U->>P: Submit name, email, password
    P->>A: fetch JSON
    A->>A: Zod validate (registerSchema)
    A->>S: registerUser()
    S->>DB: findUnique(email)
    alt email already exists
        S-->>A: AppError CONFLICT
        A-->>P: 409 { error }
    else new user
        S->>DB: create user (bcrypt hash)
        S->>DB: create 6-digit OTP (hashed, 15 min)
        S->>S: sendOtpEmail() (or log in dev)
        S->>DB: create refresh token
        S-->>A: session + httpOnly cookies
        A-->>P: 201 { user, devCode? }
    end
    P->>U: Redirect /verify-email
    U->>A: POST /api/auth/verify-email { email, code }
    A->>DB: mark emailVerified
```

## 2. Log in / log out

```mermaid
sequenceDiagram
    actor U as User
    participant A as POST /api/auth/login
    participant DB as Database
    participant X as POST /api/auth/refresh

    U->>A: email + password
    A->>DB: findUnique(email)
    A->>A: bcrypt.compare()
    alt invalid
        A-->>U: 401 INVALID_CREDENTIALS
    else valid
        A->>DB: insert refresh token (hashed)
        A-->>U: Set-Cookie ev_access (15m) + ev_refresh (7d)
    end

    Note over U,X: Every 10 minutes the client refreshes
    U->>X: POST /api/auth/refresh (cookie)
    X->>DB: revoke old refresh token
    X->>DB: insert new refresh token
    X-->>U: new cookie pair

    U->>A: POST /api/auth/logout
    A->>DB: revoke refresh token + clear cookies
```

## 3. Forgot / reset password

```mermaid
flowchart LR
    A["/forgot-password<br/>enter email"] --> B["POST /api/auth/forgot-password"]
    B --> C{"user exists?"}
    C -->|no| D["Always respond 200<br/>(no user enumeration)"]
    C -->|yes| E["Create 6-digit OTP<br/>hashed, 15 min TTL"]
    E --> F["sendOtpEmail()"]
    F --> G["/reset-password<br/>email + code + new password"]
    G --> H["POST /api/auth/reset-password"]
    H --> I["Verify + consume OTP"]
    I --> J["Update password hash,<br/>mark verified,<br/>revoke all refresh tokens"]
    J --> K["Redirect /login"]
```

## 4. Organizer approval

```mermaid
stateDiagram-v2
    [*] --> NONE
    NONE --> PENDING: attendee requests access<br/>(/profile)
    PENDING --> APPROVED: admin approves<br/>(role set to ORGANIZER)
    PENDING --> REJECTED: admin declines
    REJECTED --> PENDING: attendee requests again
    APPROVED --> [*]
    note right of PENDING
      Admin sees a notification
      and a badge in /admin/users
    end note
```

## 5. Event creation and publishing

```mermaid
flowchart TD
    A["/organizer/events/new"] --> B["POST /api/organizer/events"]
    B --> C{"submitForReview?"}
    C -->|false| D["status = DRAFT"]
    C -->|true| E["status = PENDING<br/>notify all admins"]
    D --> F["/organizer/events"]
    E --> G["Admin reviews in /admin/events"]
    G --> H{"decision"}
    H -->|approve| I["status = APPROVED<br/>publishedAt set<br/>notify organizer"]
    H -->|reject| J["status = REJECTED<br/>+ reason<br/>notify organizer"]
    I --> K["Visible on /events"]
    J --> L["Organizer edits and resubmits"]
    L --> E
```

## 6. Ticket booking (select → hold → pay → confirm → ticket)

```mermaid
sequenceDiagram
    actor U as Attendee
    participant W as BookingWidget
    participant H as POST /api/bookings/holds
    participant C as POST /api/bookings/:id/checkout
    participant DB as Database

    U->>W: Choose ticket types + quantities
    W->>H: { eventId, items[] }
    H->>H: releaseExpiredHolds()
    H->>DB: BEGIN
    H->>DB: price basket (windows, coupons, availability)
    H->>DB: UPDATE TicketType SET sold = sold + n<br/>WHERE sold + n <= quantity
    alt 0 rows affected
        H-->>W: 409 "just sold out"
    else reserved
        H->>DB: create PENDING booking + SeatHold (expires in 10 min)
        H->>DB: COMMIT
        H-->>W: 201 { booking }
    end
    W->>U: Redirect /checkout/:id

    U->>C: Enter mock card/UPI details, click Pay
    Note over C: Card details are never transmitted or stored
    C->>DB: create Payment (method, reference, SUCCESS)
    C->>DB: booking = CONFIRMED
    C->>DB: create 1 Ticket per seat (unique QR token)
    C->>DB: hold = CONVERTED, notify attendee
    C-->>U: Redirect /bookings/:id?paid=1 (QR tickets)
```

## 7. Seat hold expiry

```mermaid
flowchart LR
    A["SeatHold expiresAt < now<br/>status = HELD"] --> B["releaseExpiredHolds()"]
    B --> C["UPDATE TicketType<br/>SET sold = MAX(0, sold - n)"]
    B --> D["hold.status = EXPIRED"]
    B --> E["booking.status = EXPIRED"]
    E --> F["Seats available again"]
```

## 8. Booking cancellation

```mermaid
flowchart TD
    A["Attendee clicks Cancel"] --> B["Confirm dialog"]
    B --> C["POST /api/bookings/:id/cancel"]
    C --> D["Authorise: owner or admin"]
    D --> E["BEGIN"]
    E --> F["Release seats for each item"]
    E --> G["Tickets → CANCELLED"]
    E --> H["Booking → CANCELLED, cancelledAt"]
    E --> I["Holds → RELEASED"]
    E --> J["Commit"]
    J --> K["In-app notification to attendee"]
```

## 9. QR check-in (single use)

```mermaid
sequenceDiagram
    actor O as Organizer
    participant P as /organizer/check-in
    participant A as POST /api/organizer/check-in
    participant DB as Database

    O->>P: Scan or type ticket code
    P->>A: { value }
    A->>DB: find ticket by qrToken OR code
    alt not found
        A-->>P: 404 "no ticket matches"
    else wrong organizer
        A-->>P: 403
    else already USED
        A-->>P: 409 "already checked in at …"
    else valid
        A->>DB: UPDATE tickets SET status='USED'<br/>WHERE id = ? AND status = 'VALID'
        alt 0 rows affected (race)
            A-->>P: 409 "already checked in"
        else
            A-->>P: 200 { attendee, ticketType, event }
        end
    end
```

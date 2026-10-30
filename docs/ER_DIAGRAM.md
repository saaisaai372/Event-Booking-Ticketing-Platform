# Database schema (ER diagram)

Engine: **SQLite** in development (`prisma/dev.db`), **PostgreSQL** in production. Enums are
modelled as validated `String` columns so the same schema works on both engines; money is
stored as integer minor units (paise/cents).

```mermaid
erDiagram
    User ||--o{ Event : "organizes"
    User ||--o{ Booking : "makes"
    User ||--o{ Ticket : "holds"
    User ||--o{ Ticket : "scans (checkedInBy)"
    User ||--o{ Notification : "receives"
    User ||--o{ RefreshToken : "has"
    User ||--o{ VerificationToken : "has"
    User ||--o{ SavedEvent : "saves"
    User ||--o{ SeatHold : "places"
    User ||--o{ Coupon : "creates"

    Category ||--o{ Event : "classifies"

    Event ||--o{ TicketType : "offers"
    Event ||--o{ Booking : "receives"
    Event ||--o{ Ticket : "issues"
    Event ||--o{ SeatHold : "reserves"
    Event ||--o{ Coupon : "scopes"
    Event ||--o{ SavedEvent : "saved as"

    Booking ||--o{ BookingItem : "contains"
    Booking ||--o{ Ticket : "generates"
    Booking ||--o| Payment : "paid by"
    Booking ||--o| SeatHold : "backed by"

    TicketType ||--o{ BookingItem : "sold as"
    TicketType ||--o{ Ticket : "issued as"
    TicketType ||--o{ SeatHold : "held as"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        string role "ATTENDEE|ORGANIZER|ADMIN"
        string avatarUrl
        string phone
        string bio
        bool emailVerified
        string organizerStatus "NONE|PENDING|APPROVED|REJECTED"
        bool isActive
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        string id PK
        string userId FK
        string tokenHash UK
        datetime expiresAt
        datetime revokedAt
        string userAgent
    }

    VerificationToken {
        string id PK
        string userId FK
        string tokenHash UK
        string type "EMAIL_VERIFICATION|PASSWORD_RESET"
        datetime expiresAt
        datetime usedAt
    }

    Category {
        string id PK
        string name UK
        string slug UK
        string icon
    }

    Event {
        string id PK
        string organizerId FK
        string categoryId FK
        string title
        string slug UK
        string summary
        string description
        string bannerUrl
        string venueName
        string venueAddress
        string city
        bool isOnline
        string onlineUrl
        datetime startAt
        datetime endAt
        string status "DRAFT|PENDING|APPROVED|REJECTED|CANCELLED"
        string rejectionReason
        datetime publishedAt
        datetime cancelledAt
    }

    TicketType {
        string id PK
        string eventId FK
        string name
        string description
        int price "minor units"
        int quantity
        int sold
        datetime saleStartAt
        datetime saleEndAt
        bool isActive
        int sortOrder
    }

    SeatHold {
        string id PK
        string userId FK
        string eventId FK
        string ticketTypeId FK
        int quantity
        string status "HELD|CONVERTED|EXPIRED|RELEASED"
        datetime expiresAt
        string bookingId FK
    }

    Booking {
        string id PK
        string code UK
        string userId FK
        string eventId FK
        string status "PENDING|CONFIRMED|CANCELLED|EXPIRED"
        int subtotal
        int discount
        int total
        string couponCode
        datetime confirmedAt
        datetime cancelledAt
        datetime expiresAt
    }

    BookingItem {
        string id PK
        string bookingId FK
        string ticketTypeId FK
        int quantity
        int unitPrice
        int subtotal
    }

    Ticket {
        string id PK
        string code UK
        string bookingId FK
        string eventId FK
        string ticketTypeId FK
        string userId FK
        string qrToken UK
        string status "VALID|USED|CANCELLED"
        datetime checkedInAt
        string checkedInBy FK
    }

    Payment {
        string id PK
        string bookingId FK "unique"
        string method "CARD|UPI"
        string status "PENDING|SUCCESS|FAILED"
        int amount
        string reference UK
    }

    Coupon {
        string id PK
        string code UK
        string eventId FK
        string createdById FK
        string discountType "PERCENT|FIXED"
        int discountValue
        int maxUses
        int usedCount
        datetime expiresAt
        bool isActive
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string message
        string link
        datetime readAt
    }

    SavedEvent {
        string id PK
        string userId FK
        string eventId FK
    }
```

## Notes

- **No overselling:** `TicketType.sold` is only ever incremented through a conditional
  `UPDATE … WHERE sold + n <= quantity`, so concurrent checkouts cannot exceed capacity.
- **Money:** every monetary column is an `Int` of minor units. `formatMoney()` renders it.
- **Single-use tickets:** check-in is a conditional update on `Ticket.status = 'VALID'`.
- **Indexes:** `Event(status, startAt)`, `Event(organizerId)`, `Event(city)`,
  `Booking(userId, status)`, `Ticket(userId, status)`, `SeatHold(status, expiresAt)`.
- **Payments:** `Payment` stores only the method, status, amount and a mock reference. Card
  numbers, CVCs and UPI IDs are never accepted or persisted.

## Migrations and seeding

```bash
pnpm db:migrate    # create/apply migrations in development
pnpm db:seed       # 8 users, 8 categories, 12 events, 25 ticket types, a demo booking
pnpm db:deploy     # apply migrations in production
pnpm db:studio     # browse the data
```

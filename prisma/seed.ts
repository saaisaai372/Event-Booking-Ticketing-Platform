/**
 * Seed the Evently database with realistic demo data.
 *
 *   pnpm db:seed
 *
 * Idempotent: existing rows are cleared first (delete-then-insert), so it is
 * safe to re-run. Creates an admin, organizers, attendees, 12 events across 8
 * categories, ticket types, and a couple of confirmed bookings with QR tickets.
 */
import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Password@123";

const CATEGORIES = [
  { name: "Music", slug: "music", icon: "Music" },
  { name: "Technology", slug: "technology", icon: "Cpu" },
  { name: "Business", slug: "business", icon: "Briefcase" },
  { name: "Sports", slug: "sports", icon: "Trophy" },
  { name: "Arts & Culture", slug: "arts-culture", icon: "Palette" },
  { name: "Food & Drink", slug: "food-drink", icon: "UtensilsCrossed" },
  { name: "Health & Wellness", slug: "health-wellness", icon: "HeartPulse" },
  { name: "Education", slug: "education", icon: "GraduationCap" },
];

const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const hours = (n: number) => new Date(Date.now() + n * 60 * 60 * 1000);

interface EventSeed {
  title: string;
  slug: string;
  category: string;
  city: string | null;
  isOnline?: boolean;
  organizer: number; // index into organizers[]
  status: "APPROVED" | "PENDING" | "DRAFT" | "CANCELLED";
  startAt: Date;
  endAt: Date;
  summary: string;
  description: string;
  venueName?: string;
  venueAddress?: string;
  onlineUrl?: string;
  ticketTypes: { name: string; price: number; quantity: number; sold?: number }[];
}

const EVENTS: EventSeed[] = [
  {
    title: "Sunburn Arena — Electronic Nights",
    slug: "sunburn-arena-electronic-nights",
    category: "music",
    city: "Goa",
    organizer: 0,
    status: "APPROVED",
    startAt: days(12),
    endAt: days(12),
    summary: "A full night of house, techno and bass on the beach.",
    description:
      "Sunburn Arena returns to the Goan coast with a stacked line-up of international and homegrown electronic artists. Expect rooftop warm-ups, a main-stage sunset set and a late-night bass room. Food trucks and a chill-out zone run all night.",
    venueName: "Vagator Beach Grounds",
    venueAddress: "Vagator, North Goa",
    ticketTypes: [
      { name: "Early Bird", price: 149900, quantity: 200, sold: 180 },
      { name: "General Admission", price: 199900, quantity: 800, sold: 320 },
      { name: "VIP Lounge", price: 499900, quantity: 60, sold: 22 },
    ],
  },
  {
    title: "NextStack Conf 2026",
    slug: "nextstack-conf-2026",
    category: "technology",
    city: "Bengaluru",
    organizer: 1,
    status: "APPROVED",
    startAt: days(21),
    endAt: days(22),
    summary: "Two days of talks on TypeScript, edge runtimes and AI tooling.",
    description:
      "NextStack Conf brings together engineers building the modern web. Track A covers frameworks and type systems, Track B covers infrastructure and edge compute, and Track C is a hands-on AI workshop. All talks are recorded and published within a week.",
    venueName: "Bengaluru International Convention Centre",
    venueAddress: "Whitefield, Bengaluru",
    ticketTypes: [
      { name: "Student", price: 99900, quantity: 100, sold: 44 },
      { name: "Conference Pass", price: 349900, quantity: 400, sold: 210 },
      { name: "Workshop + Pass", price: 599900, quantity: 80, sold: 39 },
    ],
  },
  {
    title: "Founders' Breakfast: Scaling to Series A",
    slug: "founders-breakfast-series-a",
    category: "business",
    city: "Mumbai",
    organizer: 1,
    status: "APPROVED",
    startAt: days(6),
    endAt: days(6),
    summary: "An intimate morning with founders who have raised Series A.",
    description:
      "A limited-seat breakfast where three founders share what changed between seed and Series A: hiring, pricing, and the metrics investors actually cared about. Includes a 30-minute open Q&A and structured intros.",
    venueName: "The Oberoi Business Centre",
    venueAddress: "Nariman Point, Mumbai",
    ticketTypes: [
      { name: "Founder Seat", price: 249900, quantity: 40, sold: 31 },
      { name: "Team of 3", price: 599900, quantity: 10, sold: 4 },
    ],
  },
  {
    title: "City Half Marathon",
    slug: "city-half-marathon",
    category: "sports",
    city: "Pune",
    organizer: 2,
    status: "APPROVED",
    startAt: days(34),
    endAt: days(34),
    summary: "21.1 km, 10 km and a 5 km fun run through the city.",
    description:
      "Chip-timed half marathon with hydration stations every 2 km, pace groups from 4:00 to 7:00, and a finish-line festival with live music. All finishers receive a medal and a technical t-shirt.",
    venueName: "Balewadi Stadium",
    venueAddress: "Balewadi, Pune",
    ticketTypes: [
      { name: "5 km Fun Run", price: 79900, quantity: 500, sold: 402 },
      { name: "10 km", price: 129900, quantity: 700, sold: 655 },
      { name: "Half Marathon", price: 179900, quantity: 400, sold: 400 },
    ],
  },
  {
    title: "Modern Art Walk: Coastal Edition",
    slug: "modern-art-walk-coastal-edition",
    category: "arts-culture",
    city: "Chennai",
    organizer: 2,
    status: "APPROVED",
    startAt: days(9),
    endAt: days(9),
    summary: "A curated gallery walk with three working artists.",
    description:
      "Start at the marina gallery, move through two independent studios, and finish with a printmaking demo. Each stop includes a short talk with the artist. Refreshments included.",
    venueName: "Marina Arts Collective",
    venueAddress: "Triplicane, Chennai",
    ticketTypes: [
      { name: "Standard", price: 89900, quantity: 60, sold: 27 },
      { name: "Student", price: 49900, quantity: 25, sold: 25 },
    ],
  },
  {
    title: "Street Food Festival",
    slug: "street-food-festival",
    category: "food-drink",
    city: "Delhi",
    organizer: 0,
    status: "APPROVED",
    startAt: days(4),
    endAt: days(5),
    summary: "60 stalls, 12 regional cuisines, one very long weekend.",
    description:
      "Delhi's biggest street-food weekend: chaat, kebabs, momos, dosa carts, and a dessert alley. Cooking demos every hour on the main stage. Vegetarian, vegan and Jain options clearly marked at every stall.",
    venueName: "Major Dhyan Chand National Stadium Grounds",
    venueAddress: "India Gate, New Delhi",
    ticketTypes: [
      { name: "Day Pass", price: 39900, quantity: 2000, sold: 1180 },
      { name: "Weekend Pass", price: 69900, quantity: 900, sold: 260 },
    ],
  },
  {
    title: "Sunrise Yoga & Breathwork",
    slug: "sunrise-yoga-breathwork",
    category: "health-wellness",
    city: "Hyderabad",
    organizer: 2,
    status: "APPROVED",
    startAt: days(2),
    endAt: days(2),
    summary: "75 minutes of slow flow and guided breathwork at sunrise.",
    description:
      "An outdoor sunrise session suitable for all levels. Bring a mat and water. Mats are available to rent on site. Finishes with a short guided meditation and herbal tea.",
    venueName: "KBR Park Lawn",
    venueAddress: "Banjara Hills, Hyderabad",
    ticketTypes: [
      { name: "Drop-in", price: 59900, quantity: 80, sold: 51 },
      { name: "5-Class Pack", price: 249900, quantity: 20, sold: 6 },
    ],
  },
  {
    title: "Intro to Rust: Weekend Workshop",
    slug: "intro-to-rust-weekend-workshop",
    category: "education",
    city: "Online",
    isOnline: true,
    organizer: 1,
    status: "APPROVED",
    startAt: days(16),
    endAt: days(16),
    summary: "A hands-on weekend workshop building a CLI in Rust.",
    description:
      "Two live sessions (10:00–13:00 IST) where we build a small command-line tool in Rust. Covers ownership, error handling, and testing. Recording and starter repo are shared with all attendees.",
    onlineUrl: "https://meet.evently.test/rust-workshop",
    ticketTypes: [
      { name: "Workshop Seat", price: 149900, quantity: 150, sold: 88 },
      { name: "Seat + Recording", price: 199900, quantity: 100, sold: 41 },
    ],
  },
  {
    title: "Indie Sessions: Acoustic Rooftop",
    slug: "indie-sessions-acoustic-rooftop",
    category: "music",
    city: "Bengaluru",
    organizer: 0,
    status: "APPROVED",
    startAt: days(28),
    endAt: days(28),
    summary: "Four indie acts, one rooftop, zero backing tracks.",
    description:
      "An acoustic evening featuring four independent acts from South India. Seating is first-come, first-served. Bar and small plates available from 18:00.",
    venueName: "Skyline Rooftop",
    venueAddress: "Indiranagar, Bengaluru",
    ticketTypes: [
      { name: "General", price: 89900, quantity: 180, sold: 63 },
      { name: "Front Row Table (4)", price: 449900, quantity: 12, sold: 5 },
    ],
  },
  {
    title: "Product Analytics Bootcamp",
    slug: "product-analytics-bootcamp",
    category: "technology",
    city: "Online",
    isOnline: true,
    organizer: 1,
    status: "APPROVED",
    startAt: days(-14),
    endAt: days(-14),
    summary: "A past event — useful for testing past-ticket views.",
    description:
      "A three-hour bootcamp on funnel analysis, cohort retention and experimentation basics, using SQL and a product dataset. This event has already taken place.",
    onlineUrl: "https://meet.evently.test/product-analytics",
    ticketTypes: [{ name: "Bootcamp Seat", price: 99900, quantity: 120, sold: 120 }],
  },
  {
    title: "Winter Jazz Evening",
    slug: "winter-jazz-evening",
    category: "music",
    city: "Kolkata",
    organizer: 0,
    status: "PENDING",
    startAt: days(45),
    endAt: days(45),
    summary: "Awaiting admin approval — a quintet plays the standards.",
    description:
      "A five-piece jazz quintet performing a two-set programme of standards and originals in an intimate hall. This event is pending admin approval.",
    venueName: "Rabindra Sadan Hall 2",
    venueAddress: "Cathedral Road, Kolkata",
    ticketTypes: [
      { name: "Standard", price: 119900, quantity: 200, sold: 0 },
      { name: "Balcony", price: 79900, quantity: 120, sold: 0 },
    ],
  },
  {
    title: "City Marathon Expo (Draft)",
    slug: "city-marathon-expo-draft",
    category: "sports",
    city: "Pune",
    organizer: 2,
    status: "DRAFT",
    startAt: days(40),
    endAt: days(40),
    summary: "Still a draft — organizers are editing this one.",
    description:
      "An as-yet unpublished expo tied to the City Half Marathon. Kept as a draft to exercise the draft/publish flow.",
    venueName: "Balewadi Indoor Hall",
    venueAddress: "Balewadi, Pune",
    ticketTypes: [{ name: "Free Entry", price: 0, quantity: 300, sold: 0 }],
  },
];

async function main() {
  console.log("• Clearing existing data…");
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingItem.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatHold.deleteMany();
  await prisma.savedEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("• Creating users…");
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@evently.test";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Ava Admin",
      passwordHash: await hash(adminPassword, 10),
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const organizers = await Promise.all(
    [
      {
        email: "priya.organizer@evently.test",
        name: "Priya Nair",
        bio: "Music promoter, 8 years in live events.",
      },
      {
        email: "arjun.organizer@evently.test",
        name: "Arjun Mehta",
        bio: "Runs developer conferences across India.",
      },
      {
        email: "neha.organizer@evently.test",
        name: "Neha Kapoor",
        bio: "Sports and wellness event organiser.",
      },
    ].map((organizer) =>
      prisma.user.create({
        data: {
          ...organizer,
          passwordHash,
          role: "ORGANIZER",
          organizerStatus: "APPROVED",
          emailVerified: true,
        },
      }),
    ),
  );

  const attendees = await Promise.all(
    [
      { email: "rahul.attendee@evently.test", name: "Rahul Sharma" },
      { email: "meera.attendee@evently.test", name: "Meera Iyer" },
      { email: "sam.attendee@evently.test", name: "Sam Fernandes" },
    ].map((attendee) =>
      prisma.user.create({
        data: { ...attendee, passwordHash, role: "ATTENDEE", emailVerified: true },
      }),
    ),
  );

  // A user who has requested organizer access but is not approved yet.
  await prisma.user.create({
    data: {
      email: "pending.organizer@evently.test",
      name: "Kabir Pending",
      passwordHash,
      role: "ATTENDEE",
      organizerStatus: "PENDING",
      emailVerified: true,
    },
  });

  console.log("• Creating categories…");
  const categoryRows = await Promise.all(
    CATEGORIES.map((category) => prisma.category.create({ data: category })),
  );
  const categoryBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));

  console.log("• Creating events and ticket types…");
  const eventIds: Record<string, string> = {};
  for (const seed of EVENTS) {
    const event = await prisma.event.create({
      data: {
        title: seed.title,
        slug: seed.slug,
        summary: seed.summary,
        description: seed.description,
        bannerUrl: `https://picsum.photos/seed/${seed.slug}/1200/675`,
        organizerId: organizers[seed.organizer].id,
        categoryId: categoryBySlug.get(seed.category) ?? null,
        city: seed.city,
        isOnline: seed.isOnline ?? false,
        onlineUrl: seed.onlineUrl ?? null,
        venueName: seed.venueName ?? null,
        venueAddress: seed.venueAddress ?? null,
        startAt: seed.startAt,
        endAt: seed.endAt,
        status: seed.status,
        publishedAt: seed.status === "APPROVED" ? new Date() : null,
        ticketTypes: {
          create: seed.ticketTypes.map((type, index) => ({
            name: type.name,
            price: type.price,
            quantity: type.quantity,
            sold: type.sold ?? 0,
            sortOrder: index,
            saleStartAt: hours(-24 * 30),
            saleEndAt: seed.startAt,
          })),
        },
      },
      include: { ticketTypes: true },
    });
    eventIds[seed.slug] = event.id;
    if (seed.status === "PENDING") {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "EVENT_SUBMITTED",
          title: "Event awaiting approval",
          message: `${seed.title} was submitted for review.`,
          link: `/admin/events`,
        },
      });
    }
  }

  console.log("• Creating a confirmed booking with tickets…");
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventIds["nextstack-conf-2026"] },
    include: { ticketTypes: true },
  });
  const ticketType = event.ticketTypes.find((type) => type.name === "Conference Pass")!;
  const attendee = attendees[0];
  const quantity = 2;

  const booking = await prisma.booking.create({
    data: {
      code: "EVT-DEMO-0001",
      userId: attendee.id,
      eventId: event.id,
      status: "CONFIRMED",
      subtotal: ticketType.price * quantity,
      total: ticketType.price * quantity,
      confirmedAt: new Date(),
      items: {
        create: [
          {
            ticketTypeId: ticketType.id,
            quantity,
            unitPrice: ticketType.price,
            subtotal: ticketType.price * quantity,
          },
        ],
      },
      payment: {
        create: {
          method: "CARD",
          status: "SUCCESS",
          amount: ticketType.price * quantity,
          reference: `pay_demo_${randomUUID().slice(0, 12)}`,
        },
      },
      tickets: {
        create: Array.from({ length: quantity }).map((_, index) => ({
          code: `EVT-DEMO-0001-${String(index + 1).padStart(2, "0")}`,
          eventId: event.id,
          ticketTypeId: ticketType.id,
          userId: attendee.id,
          qrToken: randomUUID(),
        })),
      },
    },
    include: { tickets: true },
  });

  await prisma.notification.create({
    data: {
      userId: attendee.id,
      type: "BOOKING_CONFIRMED",
      title: "Booking confirmed",
      message: `Your tickets for ${event.title} are ready.`,
      link: `/bookings/${booking.id}`,
    },
  });

  // Mark one ticket as already checked in so the check-in flow is demoable.
  await prisma.ticket.update({
    where: { id: booking.tickets[1].id },
    data: { status: "USED", checkedInAt: new Date(), checkedInBy: organizers[1].id },
  });

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    events: await prisma.event.count(),
    ticketTypes: await prisma.ticketType.count(),
    bookings: await prisma.booking.count(),
    tickets: await prisma.ticket.count(),
  };

  console.log("✓ Seed complete:", counts);
  console.log("\n  Test logins (password shown):");
  console.log(`  Admin     → ${adminEmail} / ${adminPassword}`);
  console.log(`  Organizer → priya.organizer@evently.test / ${DEMO_PASSWORD}`);
  console.log(`  Attendee  → rahul.attendee@evently.test / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("✗ Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

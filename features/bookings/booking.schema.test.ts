import { describe, expect, it } from "vitest";
import { holdRequestSchema } from "@/features/bookings/booking.schema";

describe("holdRequestSchema", () => {
  it("accepts a valid single-item basket", () => {
    const result = holdRequestSchema.safeParse({
      eventId: "evt_1",
      items: [{ ticketTypeId: "tt_1", quantity: 2 }],
    });
    expect(result.success).toBe(true);
  });

  it("coerces a string quantity to a number", () => {
    const result = holdRequestSchema.parse({
      eventId: "evt_1",
      items: [{ ticketTypeId: "tt_1", quantity: "3" }],
    });
    expect(result.items[0].quantity).toBe(3);
  });

  it("rejects an empty basket", () => {
    const result = holdRequestSchema.safeParse({ eventId: "evt_1", items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity above the per-type cap of 10", () => {
    const result = holdRequestSchema.safeParse({
      eventId: "evt_1",
      items: [{ ticketTypeId: "tt_1", quantity: 11 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a zero quantity", () => {
    const result = holdRequestSchema.safeParse({
      eventId: "evt_1",
      items: [{ ticketTypeId: "tt_1", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

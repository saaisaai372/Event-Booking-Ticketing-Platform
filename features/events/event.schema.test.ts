import { describe, expect, it } from "vitest";
import { parseEventQuery } from "@/features/events/event.schema";

describe("parseEventQuery", () => {
  it("returns an empty filter set for no params", () => {
    const filters = parseEventQuery(new URLSearchParams());
    expect(filters.search).toBeUndefined();
    expect(filters.category).toBeUndefined();
    expect(filters.page).toBeUndefined();
  });

  it("converts price filters from major to minor units", () => {
    const filters = parseEventQuery(
      new URLSearchParams({ minPrice: "100", maxPrice: "2500" }),
    );
    expect(filters.minPrice).toBe(10_000);
    expect(filters.maxPrice).toBe(250_000);
  });

  it("treats blank parameters as absent", () => {
    const filters = parseEventQuery(
      new URLSearchParams({ search: "", category: "", page: "" }),
    );
    expect(filters.search).toBeUndefined();
    expect(filters.category).toBeUndefined();
    expect(filters.page).toBeUndefined();
  });

  it("passes through sort and date filters", () => {
    const filters = parseEventQuery(
      new URLSearchParams({
        sort: "price_desc",
        dateFrom: "2026-01-01",
        city: "Bengaluru",
      }),
    );
    expect(filters.sort).toBe("price_desc");
    expect(filters.dateFrom).toBe("2026-01-01");
    expect(filters.city).toBe("Bengaluru");
  });

  it("rejects an unknown sort value", () => {
    expect(() => parseEventQuery(new URLSearchParams({ sort: "cheapest" }))).toThrow();
  });
});

import { describe, expect, it } from "vitest";
import { formatMoney, initials, slugify } from "@/lib/utils";

describe("formatMoney", () => {
  it("formats minor units as rupees", () => {
    // 50000 paise = ₹500.00
    expect(formatMoney(50000)).toBe("₹500.00");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("₹0.00");
  });

  it("formats non-round amounts", () => {
    expect(formatMoney(199999)).toBe("₹1,999.99");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Sunburn Arena — Electronic Nights")).toBe(
      "sunburn-arena-electronic-nights",
    );
  });

  it("collapses repeated separators", () => {
    expect(slugify("  Hello   World!!  ")).toBe("hello-world");
  });

  it("strips characters that are not alphanumeric", () => {
    expect(slugify("C++ & Rust: 101")).toBe("c-rust-101");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Priya Nair")).toBe("PN");
  });

  it("handles a single name", () => {
    expect(initials("Cher")).toBe("C");
  });

  it("ignores extra words", () => {
    expect(initials("Ada Byron Lovelace")).toBe("AB");
  });
});

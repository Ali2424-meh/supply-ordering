import { describe, expect, test } from "vitest";
import page from "../fixtures/shopify-page.json";
import { mapProductsPage, parsePriceToCents } from "../../src/lib/sync/shopify";

describe("parsePriceToCents", () => {
  test("parses dollar strings without float drift", () => {
    expect(parsePriceToCents("18.95")).toBe(1895);
    expect(parsePriceToCents("59.00")).toBe(5900);
    expect(parsePriceToCents("0.10")).toBe(10);
    expect(parsePriceToCents("1000")).toBe(100000);
    expect(parsePriceToCents("2.5")).toBe(250);
  });
  test("throws on malformed prices", () => {
    expect(() => parsePriceToCents("abc")).toThrow();
    expect(() => parsePriceToCents("")).toThrow();
  });
});

describe("mapProductsPage (S-01 basis)", () => {
  const lines = mapProductsPage(page, "https://cleanersgallery.com.au");

  test("each variant becomes one catalogue line", () => {
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({
      shopifyVariantId: "1001", name: "Glass Cleaner", variantName: "5L",
      category: "Chemicals", description: "Streak-free glass cleaner.",
      imageUrl: "https://cdn.shopify.com/glass.jpg", priceCents: 1895,
      sku: "GC-5L", productUrl: "https://cleanersgallery.com.au/products/glass-cleaner",
    });
  });
  test("'Default Title' variant, empty sku/type/images map to nulls", () => {
    const mop = lines[2];
    expect(mop.variantName).toBeNull();
    expect(mop.sku).toBeNull();
    expect(mop.category).toBeNull();
    expect(mop.imageUrl).toBeNull();
    expect(mop.priceCents).toBe(3450);
  });
  test("rejects malformed payloads", () => {
    expect(() => mapProductsPage({ nope: true }, "x")).toThrow();
  });
});

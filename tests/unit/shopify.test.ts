import { afterEach, describe, expect, test, vi } from "vitest";
import page from "../fixtures/shopify-page.json";
import {
  fetchAllCatalogueLines,
  mapProductsPage,
  parsePriceToCents,
} from "../../src/lib/sync/shopify";

afterEach(() => vi.unstubAllGlobals());

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

describe("fetchAllCatalogueLines", () => {
  test("uses a live-store-safe page size and stops at the first empty page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(page)))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: [] })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAllCatalogueLines("https://cleanersgallery.com.au"),
    ).resolves.toHaveLength(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://cleanersgallery.com.au/products.json?limit=50&page=1",
      {
        headers: { "user-agent": "SupplyOrdering/1.0" },
        signal: expect.any(AbortSignal),
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://cleanersgallery.com.au/products.json?limit=50&page=2",
      {
        headers: { "user-agent": "SupplyOrdering/1.0" },
        signal: expect.any(AbortSignal),
      },
    );
  });

  test("retries transient Shopify failures", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ products: [] })),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchAllCatalogueLines("https://cleanersgallery.com.au"),
    ).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeUser, resetDb } from "./helpers";
import { applyCatalogueLines } from "../../src/lib/sync/apply";
import type { CatalogueLine } from "../../src/lib/sync/shopify";

const line = (
  id: string,
  overrides: Partial<CatalogueLine> = {},
): CatalogueLine => ({
  shopifyVariantId: id,
  name: `P${id}`,
  variantName: null,
  category: null,
  description: null,
  imageUrl: null,
  priceCents: 1000,
  sku: null,
  unitSize: null,
  productUrl: "https://x/products/p",
  ...overrides,
});

describe("applyCatalogueLines", () => {
  beforeEach(resetDb);

  test("S-01: new lines are added as active SYNCED products", async () => {
    const result = await applyCatalogueLines([line("1"), line("2")]);
    expect(result).toEqual({ added: 2, updated: 0, deactivated: 0 });
    const products = await db.product.findMany();
    expect(
      products.every((product) => product.active && product.source === "SYNCED"),
    ).toBe(true);
  });

  test("S-02: price change updates product and appends PriceHistory", async () => {
    await applyCatalogueLines([line("1", { priceCents: 1000 })]);
    const result = await applyCatalogueLines([line("1", { priceCents: 1200 })]);
    expect(result.updated).toBe(1);
    const product = await db.product.findUnique({
      where: { shopifyVariantId: "1" },
    });
    expect(product?.priceCents).toBe(1200);
    expect(
      await db.priceHistory.count({ where: { productId: product!.id } }),
    ).toBe(2);
  });

  test("unchanged products are not rewritten or counted as updates", async () => {
    await applyCatalogueLines([line("1")]);
    const historyBefore = await db.priceHistory.count();

    expect(await applyCatalogueLines([line("1")])).toEqual({
      added: 0,
      updated: 0,
      deactivated: 0,
    });
    expect(await db.priceHistory.count()).toBe(historyBefore);
  });

  test("S-03: missing SYNCED products are deactivated, never deleted", async () => {
    await applyCatalogueLines([line("1"), line("2")]);
    const result = await applyCatalogueLines([line("1")]);
    expect(result.deactivated).toBe(1);
    const missing = await db.product.findUnique({
      where: { shopifyVariantId: "2" },
    });
    expect(missing?.active).toBe(false);
  });

  test("S-04: returning products are reactivated and updated", async () => {
    await applyCatalogueLines([line("1")]);
    await applyCatalogueLines([]);
    const result = await applyCatalogueLines([
      line("1", { priceCents: 900 }),
    ]);
    expect(result.updated).toBe(1);
    const product = await db.product.findUnique({
      where: { shopifyVariantId: "1" },
    });
    expect(product?.active).toBe(true);
    expect(product?.priceCents).toBe(900);
  });

  test("MANUAL products are never touched by sync", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    asUser(supplyManager);
    await db.product.create({
      data: {
        name: "Manual",
        priceCents: 1,
        active: true,
        source: "MANUAL",
      },
    });
    await applyCatalogueLines([]);
    const manual = await db.product.findFirst({ where: { source: "MANUAL" } });
    expect(manual?.active).toBe(true);
  });
});

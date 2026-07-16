import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { createProduct, updateProduct } from "../../src/actions/products";

const base = {
  name: "Bucket",
  variantName: null,
  category: null,
  description: null,
  imageUrl: null,
  priceCents: 500,
  sku: null,
  unitSize: null,
  productUrl: null,
  active: true,
};

describe("product management", () => {
  beforeEach(resetDb);

  test("SM-08: manual create records product and audit entry", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    asUser(supplyManager);
    const id = await createProduct(base);
    const product = await db.product.findUnique({ where: { id } });
    expect(product?.source).toBe("MANUAL");
    const audit = await db.auditEvent.findFirst({ where: { entityId: id } });
    expect(audit?.action).toBe("CREATED");
    expect(audit?.actorId).toBe(supplyManager.id);
  });

  test("SM-09: edit records audit; price change appends PriceHistory", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    const product = await makeProduct({ priceCents: 500 });
    asUser(supplyManager);
    await updateProduct(product.id, { ...base, priceCents: 750 });
    expect(
      (await db.product.findUnique({ where: { id: product.id } }))?.priceCents,
    ).toBe(750);
    expect(
      await db.priceHistory.count({ where: { productId: product.id } }),
    ).toBe(1);
    expect(
      await db.auditEvent.count({
        where: { entityId: product.id, action: "UPDATED" },
      }),
    ).toBe(1);
  });

  test("SM-10: deactivation flips flag and records DEACTIVATED audit", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    const product = await makeProduct();
    asUser(supplyManager);
    await updateProduct(product.id, { ...base, active: false });
    expect(
      (await db.product.findUnique({ where: { id: product.id } }))?.active,
    ).toBe(false);
    expect(
      await db.auditEvent.count({
        where: { entityId: product.id, action: "DEACTIVATED" },
      }),
    ).toBe(1);
  });

  test("cleaners cannot manage products", async () => {
    const cleaner = await makeUser("CLEANER");
    asUser(cleaner);
    await expect(createProduct(base)).rejects.toThrow(/not allowed/i);
  });

  test("validation: empty name rejected", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    asUser(supplyManager);
    await expect(createProduct({ ...base, name: " " })).rejects.toThrow();
  });

  test("validation: unsafe product URLs are rejected server-side", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    asUser(supplyManager);
    await expect(
      createProduct({ ...base, productUrl: "javascript:alert(1)" }),
    ).rejects.toThrow(/http or https/i);
  });
});

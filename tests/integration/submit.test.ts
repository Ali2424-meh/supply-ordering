import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { submitOrder } from "../../src/actions/orders";

describe("submitOrder", () => {
  beforeEach(resetDb);

  async function cartFor(userId: string, lines: Array<[string, number]>) {
    for (const [productId, quantity] of lines) {
      await db.cartItem.create({ data: { userId, productId, quantity } });
    }
  }

  test("C-05: creates a SUBMITTED order with snapshots, sequence number, event, cleared cart", async () => {
    const user = await makeUser("CLEANER");
    const a = await makeProduct({
      name: "Glass Cleaner",
      variantName: "5L",
      priceCents: 1895,
    });
    const b = await makeProduct({ priceCents: 550 });
    await cartFor(user.id, [
      [a.id, 2],
      [b.id, 1],
    ]);
    asUser(user);

    const result = await submitOrder();
    expect(result).toEqual({ ok: true, orderNumber: "OR-00001" });

    const order = await db.order.findUnique({
      where: { orderNumber: "OR-00001" },
      include: { items: true, events: true },
    });
    expect(order?.status).toBe("SUBMITTED");
    expect(order?.totalCents).toBe(1895 * 2 + 550);
    expect(order?.items).toHaveLength(2);
    const snapshot = order?.items.find((item) => item.productId === a.id);
    expect(snapshot?.nameSnapshot).toBe("Glass Cleaner");
    expect(snapshot?.variantSnapshot).toBe("5L");
    expect(snapshot?.priceCentsSnapshot).toBe(1895);
    expect(order?.events[0].toStatus).toBe("SUBMITTED");
    expect(await db.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  test("S-02 basis: later price changes do not affect submitted orders", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct({ priceCents: 1000 });
    await cartFor(user.id, [[product.id, 1]]);
    asUser(user);
    await submitOrder();
    await db.product.update({
      where: { id: product.id },
      data: { priceCents: 9999 },
    });
    const item = await db.orderItem.findFirst();
    expect(item?.priceCentsSnapshot).toBe(1000);
  });

  test("C-06: rejects carts containing inactive products, reports which", async () => {
    const user = await makeUser("CLEANER");
    const available = await makeProduct();
    const unavailable = await makeProduct({ active: false });
    await cartFor(user.id, [
      [available.id, 1],
      [unavailable.id, 1],
    ]);
    asUser(user);
    const result = await submitOrder();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.invalidProductIds).toEqual([unavailable.id]);
    expect(await db.order.count()).toBe(0);
    expect(await db.cartItem.count()).toBe(2);
  });

  test("double submit: second call finds an empty cart and no-ops", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    await cartFor(user.id, [[product.id, 1]]);
    asUser(user);
    expect((await submitOrder()).ok).toBe(true);
    const second = await submitOrder();
    expect(second.ok).toBe(false);
    expect(await db.order.count()).toBe(1);
  });

  test("concurrent double submit creates only one order", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    await cartFor(user.id, [[product.id, 1]]);
    asUser(user);

    const results = await Promise.all([submitOrder(), submitOrder()]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    expect(await db.order.count()).toBe(1);
  });

  test("C-09: disabled cleaner cannot submit", async () => {
    const user = await makeUser("CLEANER", { disabled: true });
    const product = await makeProduct();
    await cartFor(user.id, [[product.id, 1]]);
    asUser(user);
    await expect(submitOrder()).rejects.toThrow(/disabled/i);
  });

  test("order numbers increment from the sequence", async () => {
    const firstUser = await makeUser("CLEANER");
    const secondUser = await makeUser("CLEANER");
    const product = await makeProduct();
    await cartFor(firstUser.id, [[product.id, 1]]);
    await cartFor(secondUser.id, [[product.id, 1]]);
    asUser(firstUser);
    expect(await submitOrder()).toEqual({
      ok: true,
      orderNumber: "OR-00001",
    });
    asUser(secondUser);
    expect(await submitOrder()).toEqual({
      ok: true,
      orderNumber: "OR-00002",
    });
  });
});

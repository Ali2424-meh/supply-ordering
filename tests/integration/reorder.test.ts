import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import { reorderFromOrder } from "../../src/actions/orders";

describe("reorderFromOrder", () => {
  beforeEach(resetDb);

  async function makeOrder(
    userId: string,
    items: Array<{ productId: string | null; quantity: number }>,
  ) {
    return db.order.create({
      data: {
        orderNumber: `OR-TEST-${Date.now()}`,
        userId,
        status: "SUBMITTED",
        totalCents: 1000,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            nameSnapshot: "Product Snapshot",
            priceCentsSnapshot: 1000,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  test("happy path: adds all active-product items to cart with correct quantities", async () => {
    const user = await makeUser("CLEANER");
    const productA = await makeProduct({ priceCents: 500 });
    const productB = await makeProduct({ priceCents: 750 });

    const order = await makeOrder(user.id, [
      { productId: productA.id, quantity: 3 },
      { productId: productB.id, quantity: 2 },
    ]);

    asUser(user);
    const result = await reorderFromOrder(order.id);

    expect(result).toMatchObject({ ok: true, added: 2, skipped: 0 });

    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      orderBy: { productId: "asc" },
    });
    expect(cartItems).toHaveLength(2);

    const itemA = cartItems.find((i) => i.productId === productA.id);
    const itemB = cartItems.find((i) => i.productId === productB.id);
    expect(itemA?.quantity).toBe(3);
    expect(itemB?.quantity).toBe(2);
  });

  test("happy path: accumulates quantities onto existing cart lines (clamped to 999)", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();

    // Pre-seed cart with 900
    await db.cartItem.create({
      data: { userId: user.id, productId: product.id, quantity: 900 },
    });

    const order = await makeOrder(user.id, [
      { productId: product.id, quantity: 200 },
    ]);

    asUser(user);
    const result = await reorderFromOrder(order.id);

    expect(result).toMatchObject({ ok: true, added: 1, skipped: 0 });

    const item = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } },
    });
    expect(item?.quantity).toBe(999); // clamped
  });

  test("ownership: throws if the order belongs to a different user", async () => {
    const owner = await makeUser("CLEANER");
    const other = await makeUser("CLEANER");
    const product = await makeProduct();

    const order = await makeOrder(owner.id, [
      { productId: product.id, quantity: 1 },
    ]);

    asUser(other);
    await expect(reorderFromOrder(order.id)).rejects.toThrow();
  });

  test("partial skip: inactive products are skipped, active ones are added", async () => {
    const user = await makeUser("CLEANER");
    const activeProduct = await makeProduct({ active: true });
    const inactiveProduct = await makeProduct({ active: false });

    const order = await makeOrder(user.id, [
      { productId: activeProduct.id, quantity: 2 },
      { productId: inactiveProduct.id, quantity: 1 },
    ]);

    asUser(user);
    const result = await reorderFromOrder(order.id);

    expect(result.ok).toBe(true);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);

    const cartItems = await db.cartItem.findMany({ where: { userId: user.id } });
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].productId).toBe(activeProduct.id);
    expect(cartItems[0].quantity).toBe(2);
  });

  test("all-skipped: returns ok:false when no items can be added", async () => {
    const user = await makeUser("CLEANER");
    const inactiveProduct = await makeProduct({ active: false });

    const order = await makeOrder(user.id, [
      { productId: inactiveProduct.id, quantity: 2 },
    ]);

    asUser(user);
    const result = await reorderFromOrder(order.id);

    expect(result.ok).toBe(false);
    expect(result.skipped).toBeGreaterThan(0);
    expect(result.error).toBeTruthy();

    const cartItems = await db.cartItem.findMany({ where: { userId: user.id } });
    expect(cartItems).toHaveLength(0);
  });

  test("null productId items are skipped (deleted products)", async () => {
    const user = await makeUser("CLEANER");
    const activeProduct = await makeProduct();

    // One item with a valid product, one with null productId (deleted)
    const order = await makeOrder(user.id, [
      { productId: activeProduct.id, quantity: 1 },
      { productId: null, quantity: 1 },
    ]);

    asUser(user);
    const result = await reorderFromOrder(order.id);

    expect(result.ok).toBe(true);
    expect(result.added).toBe(1);
    expect(result.skipped).toBe(1);

    const cartItems = await db.cartItem.findMany({ where: { userId: user.id } });
    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].productId).toBe(activeProduct.id);
  });
});

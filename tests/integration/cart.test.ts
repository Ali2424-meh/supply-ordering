import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeProduct, makeUser, resetDb } from "./helpers";
import {
  addToCart,
  removeFromCart,
  setCartQuantity,
} from "../../src/actions/cart";

describe("cart actions", () => {
  beforeEach(resetDb);

  test("addToCart creates a line, then merges quantities (no duplicate lines)", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    asUser(user);
    await addToCart(product.id, 2);
    await addToCart(product.id, 3);
    const items = await db.cartItem.findMany({ where: { userId: user.id } });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(5);
  });

  test("addToCart clamps the merged quantity to 999", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    asUser(user);
    await addToCart(product.id, 900);
    await addToCart(product.id, 200);
    const item = await db.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId: product.id } },
    });
    expect(item?.quantity).toBe(999);
  });

  test("addToCart rejects inactive products", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct({ active: false });
    asUser(user);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/not available/i);
  });

  test("setCartQuantity clamps to at least 1; removeFromCart deletes the line", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    asUser(user);
    await addToCart(product.id, 2);
    await setCartQuantity(product.id, 0);
    expect(
      (await db.cartItem.findFirst({ where: { userId: user.id } }))?.quantity,
    ).toBe(1);
    await removeFromCart(product.id);
    expect(await db.cartItem.count({ where: { userId: user.id } })).toBe(0);
  });

  test("non-cleaner roles cannot use the cart", async () => {
    const manager = await makeUser("MANAGER");
    const product = await makeProduct();
    asUser(manager);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/not allowed/i);
  });

  test("C-02 basis: feature toggle off blocks cart actions", async () => {
    const user = await makeUser("CLEANER");
    const product = await makeProduct();
    await db.setting.update({
      where: { key: "supplyOrderingEnabled" },
      data: { value: "false" },
    });
    asUser(user);
    await expect(addToCart(product.id, 1)).rejects.toThrow(/disabled/i);
  });
});

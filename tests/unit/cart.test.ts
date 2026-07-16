import { describe, expect, test } from "vitest";
import {
  cartTotalCents, clampQuantity, findInvalidLines, hasDuplicateLines, lineTotalCents,
} from "../../src/lib/cart";

const line = (productId: string, quantity: number, priceCents: number) =>
  ({ productId, quantity, priceCents });

describe("totals", () => {
  test("line total multiplies price by quantity in cents", () => {
    expect(lineTotalCents(line("a", 3, 1895))).toBe(5685);
  });
  test("cart total sums line totals; empty cart is 0", () => {
    expect(cartTotalCents([line("a", 2, 1000), line("b", 1, 550)])).toBe(2550);
    expect(cartTotalCents([])).toBe(0);
  });
});

describe("clampQuantity", () => {
  test("floors decimals, clamps to 1..999", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(-5)).toBe(1);
    expect(clampQuantity(2.9)).toBe(2);
    expect(clampQuantity(5000)).toBe(999);
  });
});

describe("hasDuplicateLines", () => {
  test("detects duplicate productIds", () => {
    expect(hasDuplicateLines([{ productId: "a" }, { productId: "a" }])).toBe(true);
    expect(hasDuplicateLines([{ productId: "a" }, { productId: "b" }])).toBe(false);
  });
});

describe("findInvalidLines (C-06 basis)", () => {
  const products = [{ id: "a", active: true }, { id: "b", active: false }];
  test("flags inactive and missing products", () => {
    expect(findInvalidLines(
      [{ productId: "a" }, { productId: "b" }, { productId: "ghost" }], products,
    )).toEqual(["b", "ghost"]);
  });
  test("all-active cart has no invalid lines", () => {
    expect(findInvalidLines([{ productId: "a" }], products)).toEqual([]);
  });
});

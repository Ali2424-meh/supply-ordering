import { describe, expect, test } from "vitest";
import { pageCount, parsePage } from "../../src/lib/pagination";

describe("pagination helpers", () => {
  test("accepts positive safe integer pages", () => {
    expect(parsePage("3")).toBe(3);
  });

  test("normalizes missing, fractional, negative and unsafe pages", () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage(String(Number.MAX_SAFE_INTEGER + 1))).toBe(1);
  });

  test("page count always has at least one page", () => {
    expect(pageCount(0, 48)).toBe(1);
    expect(pageCount(49, 48)).toBe(2);
  });
});

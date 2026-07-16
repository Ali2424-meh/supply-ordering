import { describe, expect, test } from "vitest";
import { STATUS_ORDER, statusDotClass } from "../../src/lib/statuses";

describe("statusDotClass", () => {
  test("all 9 statuses return a non-empty bg-*-500 class", () => {
    expect(STATUS_ORDER).toHaveLength(9);
    for (const s of STATUS_ORDER) {
      const cls = statusDotClass(s);
      expect(cls).toMatch(/^bg-\w+-500$/);
    }
  });

  test("known statuses map to expected dot colors", () => {
    expect(statusDotClass("SUBMITTED")).toBe("bg-blue-500");
    expect(statusDotClass("CONTACTED")).toBe("bg-sky-500");
    expect(statusDotClass("AWAITING_PAYMENT")).toBe("bg-amber-500");
    expect(statusDotClass("PAID")).toBe("bg-emerald-500");
    expect(statusDotClass("ORDERED_FROM_SUPPLIER")).toBe("bg-violet-500");
    expect(statusDotClass("READY_FOR_COLLECTION")).toBe("bg-teal-500");
    expect(statusDotClass("DELIVERED_COLLECTED")).toBe("bg-green-500");
    expect(statusDotClass("CANCELLED")).toBe("bg-zinc-500");
    expect(statusDotClass("ISSUE_ON_HOLD")).toBe("bg-red-500");
  });
});

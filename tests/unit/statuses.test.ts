import { describe, expect, test } from "vitest";
import { STATUS_ORDER, statusDotClass, statusPillClass } from "../../src/lib/statuses";

describe("status styles", () => {
  test("all 9 statuses return a full-literal bg dot class", () => {
    expect(STATUS_ORDER).toHaveLength(9);
    for (const s of STATUS_ORDER) {
      expect(statusDotClass(s)).toMatch(/^bg-[a-z]+-\d00$/);
      expect(statusPillClass(s)).toMatch(/^bg-[a-z]+-\d+ text-[a-z]+-\d+$/);
    }
  });

  test("known statuses map to the all-blue palette dots", () => {
    expect(statusDotClass("SUBMITTED")).toBe("bg-blue-500");
    expect(statusDotClass("CONTACTED")).toBe("bg-sky-500");
    expect(statusDotClass("AWAITING_PAYMENT")).toBe("bg-amber-500");
    expect(statusDotClass("PAID")).toBe("bg-indigo-500");
    expect(statusDotClass("ORDERED_FROM_SUPPLIER")).toBe("bg-violet-500");
    expect(statusDotClass("READY_FOR_COLLECTION")).toBe("bg-cyan-500");
    expect(statusDotClass("DELIVERED_COLLECTED")).toBe("bg-blue-700");
    expect(statusDotClass("CANCELLED")).toBe("bg-zinc-400");
    expect(statusDotClass("ISSUE_ON_HOLD")).toBe("bg-red-500");
  });
});

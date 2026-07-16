import { describe, expect, test } from "vitest";
import { formatAud, formatOrderNumber } from "../../src/lib/format";
import { STATUS_LABELS, STATUS_ORDER } from "../../src/lib/statuses";

describe("formatAud", () => {
  test("formats cents as AUD with two decimals", () => {
    expect(formatAud(1895)).toBe("$18.95");
    expect(formatAud(0)).toBe("$0.00");
    expect(formatAud(100000)).toBe("$1,000.00");
  });
});

describe("formatOrderNumber", () => {
  test("pads to five digits with OR- prefix", () => {
    expect(formatOrderNumber(1)).toBe("OR-00001");
    expect(formatOrderNumber(12345)).toBe("OR-12345");
    expect(formatOrderNumber(123456)).toBe("OR-123456");
  });
});

describe("statuses", () => {
  test("all nine statuses have labels, in spec order", () => {
    expect(STATUS_ORDER).toHaveLength(9);
    expect(STATUS_ORDER[0]).toBe("SUBMITTED");
    expect(STATUS_LABELS.ISSUE_ON_HOLD).toBe("Issue / on hold");
    expect(STATUS_LABELS.DELIVERED_COLLECTED).toBe("Delivered / collected");
    for (const s of STATUS_ORDER) expect(STATUS_LABELS[s]).toBeTruthy();
  });
});

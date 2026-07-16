import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeUser, resetDb } from "./helpers";
import { updateOrderStatus } from "../../src/actions/orders";

async function makeOrder(userId: string) {
  return db.order.create({
    data: {
      orderNumber: `OR-0000${(await db.order.count()) + 1}`,
      userId,
      status: "SUBMITTED",
      totalCents: 1000,
      events: { create: { toStatus: "SUBMITTED" } },
    },
  });
}

describe("updateOrderStatus", () => {
  beforeEach(resetDb);

  test("SM-05: supply manager sets status with a note; history records it", async () => {
    const cleaner = await makeUser("CLEANER");
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    const order = await makeOrder(cleaner.id);
    asUser(supplyManager);
    await updateOrderStatus(order.id, "CONTACTED", "Called, confirming Tuesday");
    const updated = await db.order.findUnique({
      where: { id: order.id },
      include: { events: { orderBy: { createdAt: "asc" } } },
    });
    expect(updated?.status).toBe("CONTACTED");
    const event = updated?.events.at(-1);
    expect(event?.fromStatus).toBe("SUBMITTED");
    expect(event?.toStatus).toBe("CONTACTED");
    expect(event?.note).toBe("Called, confirming Tuesday");
    expect(event?.actorId).toBe(supplyManager.id);
  });

  test("A-02 basis: admin can update status too", async () => {
    const cleaner = await makeUser("CLEANER");
    const admin = await makeUser("ADMIN");
    const order = await makeOrder(cleaner.id);
    asUser(admin);
    await updateOrderStatus(order.id, "CANCELLED");
    expect(
      (await db.order.findUnique({ where: { id: order.id } }))?.status,
    ).toBe("CANCELLED");
  });

  test("C-08 basis: cleaners cannot update status", async () => {
    const cleaner = await makeUser("CLEANER");
    const order = await makeOrder(cleaner.id);
    asUser(cleaner);
    await expect(updateOrderStatus(order.id, "PAID")).rejects.toThrow(
      /not allowed/i,
    );
  });

  test("rejects unknown order ids", async () => {
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    asUser(supplyManager);
    await expect(updateOrderStatus("nope", "PAID")).rejects.toThrow(/not found/i);
  });

  test("rejects oversized internal notes", async () => {
    const cleaner = await makeUser("CLEANER");
    const supplyManager = await makeUser("SUPPLY_MANAGER");
    const order = await makeOrder(cleaner.id);
    asUser(supplyManager);
    await expect(
      updateOrderStatus(order.id, "CONTACTED", "x".repeat(2_001)),
    ).rejects.toThrow(/2,000/);
  });
});

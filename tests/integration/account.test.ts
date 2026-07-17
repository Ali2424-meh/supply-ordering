import { beforeEach, describe, expect, test } from "vitest";
import { asUser, db, makeUser, resetDb } from "./helpers";
import { updateAccount } from "../../src/actions/account";

function details(name: string, phone = "") {
  const form = new FormData();
  form.set("name", name);
  form.set("phone", phone);
  return form;
}

describe("account settings", () => {
  beforeEach(resetDb);

  test("supply manager can update their own name and phone", async () => {
    const user = await makeUser("SUPPLY_MANAGER");
    asUser(user);

    await expect(
      updateAccount({}, details("  Sam Supply  ", "  0400 123 456  ")),
    ).resolves.toEqual({ ok: true });

    const updated = await db.user.findUnique({ where: { id: user.id } });
    expect(updated?.name).toBe("Sam Supply");
    expect(updated?.phone).toBe("0400 123 456");
  });

  test("administrator can update their own account", async () => {
    const user = await makeUser("ADMIN");
    asUser(user);
    await expect(updateAccount({}, details("Ada Admin"))).resolves.toEqual({
      ok: true,
    });
  });

  test("account updates remain available when supply ordering is disabled", async () => {
    const user = await makeUser("SUPPLY_MANAGER");
    await db.setting.update({
      where: { key: "supplyOrderingEnabled" },
      data: { value: "false" },
    });
    asUser(user);

    await expect(
      updateAccount({}, details("Sam Supply", "0400 000 000")),
    ).resolves.toEqual({ ok: true });
  });

  test("cleaners cannot use staff account settings", async () => {
    const user = await makeUser("CLEANER");
    asUser(user);
    await expect(updateAccount({}, details("Changed"))).rejects.toThrow(
      /not allowed/i,
    );
  });

  test("invalid details are rejected without changing the account", async () => {
    const user = await makeUser("SUPPLY_MANAGER");
    asUser(user);
    const result = await updateAccount({}, details(" ", "x".repeat(41)));
    expect(result.error).toMatch(/name is required/i);
    expect((await db.user.findUnique({ where: { id: user.id } }))?.name).toBe(
      user.name,
    );

    const longPhone = await updateAccount(
      {},
      details("Valid Name", "x".repeat(41)),
    );
    expect(longPhone.error).toMatch(/40 characters/i);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe.configure({ mode: "serial" });

test("SM-01 + SM-02: supply nav present; platform admin areas absent", async ({
  page,
}) => {
  await login(page, "supply@example.com");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.locator("aside")).toContainText("Order requests");
  await expect(page.locator("aside")).toContainText("Product catalogue");
  await expect(page.locator("aside")).not.toContainText("Bookings");
  await expect(page.locator("aside")).not.toContainText("Payouts");
});

test("SM-03 + SM-04 + SM-05: list, detail, status update and note", async ({
  page,
}) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/orders");
  await expect(page.getByTestId("admin-order-row").first()).toBeVisible();
  await page.getByTestId("admin-order-row").first().locator("a").click();
  await expect(page.locator("body")).toContainText("@example.com");
  await page.getByTestId("status-select").selectOption("CONTACTED");
  await page.getByTestId("status-note").fill("Called worker");
  await page.getByTestId("save-status").click();
  await expect(page.getByTestId("status-timeline")).toContainText("Contacted");
  await expect(page.getByTestId("status-timeline")).toContainText("Called worker");
});

test("SM-06: submitted order produces a captured email", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByLabel("Cart, 1 items")).toBeVisible();
  await page.goto("/supplies/cart");
  await page.getByTestId("submit-order").click();
  await expect(page.getByTestId("order-number")).toBeVisible();

  const files = readdirSync(".email-capture-e2e");
  expect(files.length).toBeGreaterThan(0);
  const email = JSON.parse(
    readFileSync(`.email-capture-e2e/${files.at(-1)}`, "utf8"),
  );
  expect(email.to).toBe("team@example.com");
  expect(email.subject).toMatch(/OR-\d{5}/);
  expect(email.html).toContain("Glass Cleaner");
});

test("SM-07 + SM-08 + SM-09 + SM-10: manage product lifecycle", async ({
  page,
}) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/catalogue");
  await expect(page.locator("body")).toContainText("Retired Mop");
  await page.getByRole("link", { name: "New product" }).click();
  await page.fill('input[name="name"]', "Test Bucket");
  await page.fill('input[name="price"]', "12.50");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Test Bucket" }),
  ).toBeVisible();
  await page.fill('input[name="price"]', "13.00");
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.locator("body")).toContainText("$13.00");
  await page.locator("a:visible").filter({ hasText: "Test Bucket" }).click();
  await page.uncheck('input[name="active"]');
  await page.getByRole("button", { name: "Save product" }).click();
  await page.context().clearCookies();
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await expect(page.locator("body")).not.toContainText("Test Bucket");
});

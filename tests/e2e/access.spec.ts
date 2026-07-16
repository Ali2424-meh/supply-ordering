import { expect, test } from "@playwright/test";
import { login, setFeature } from "./helpers";

test("A-01 + A-03: admin sees supply and platform areas", async ({ page }) => {
  await login(page, "admin@example.com");
  await expect(page).toHaveURL(/\/admin\/orders/);
  await expect(page.locator("aside")).toContainText("Order requests");
  await expect(page.locator("aside")).toContainText("Bookings");
  await page.goto("/admin/bookings");
  await expect(page.locator("body")).toContainText(/coming soon/i);
});

test("A-02: admin can update an order status", async ({ page }) => {
  await login(page, "admin@example.com");
  await page.goto("/admin/orders");
  await page.getByTestId("admin-order-row").first().locator("a").click();
  await page.getByTestId("status-select").selectOption("PAID");
  await page.getByTestId("save-status").click();
  await expect(page.getByTestId("status-timeline")).toContainText("Paid");
});

test("M-01 + M-02: manager has no supply access", async ({ page }) => {
  await login(page, "manager@example.com");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).not.toContainText("Order requests");
  await page.goto("/admin/orders");
  await expect(page).not.toHaveURL(/\/admin\/orders/);
  await page.goto("/supplies");
  await expect(page).not.toHaveURL(/\/supplies$/);
});

test("U-01: customer sees no supply ordering", async ({ page }) => {
  await login(page, "customer@example.com");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).not.toContainText("Supplies");
});

test("SM-01 disabled variant: staff lose supply screens", async ({ page }) => {
  await setFeature(page, false);
  await login(page, "supply@example.com");
  await expect(page.locator("aside")).not.toContainText("Order requests");
  await setFeature(page, true);
});

import { expect, test } from "@playwright/test";
import { setProductActive } from "./db";
import { login, setFeature } from "./helpers";

test.describe.configure({ mode: "serial" });

test("C-01: cleaner with feature enabled sees Supplies", async ({ page }) => {
  await setFeature(page, true);
  await login(page, "cleaner@example.com");
  await expect(page).toHaveURL(/\/supplies/);
  await expect(page.locator("header nav")).toContainText("Supplies");
});

test("C-02: feature disabled hides Supplies", async ({ page }) => {
  await setFeature(page, false);
  await login(page, "cleaner@example.com");
  await page.goto("/supplies");
  await expect(page.locator("body")).toContainText(/not.*found|404/i);
  await setFeature(page, true);
});

test("C-03: catalogue lists only active products with search and category filter", async ({
  page,
}) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Retired Mop");
  await page.getByRole("link", { name: "Chemicals" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await page.fill('input[name="q"]', "Glass");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(1);
});

test("C-04: product detail shows price, description, external link", async ({
  page,
}) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await expect(page).toHaveURL(/\/supplies\/catalogue\/[^/]+$/);
  await expect(page.locator("body")).toContainText("$18.95");
  await expect(page.locator("body")).toContainText("Streak-free glass cleaner");
  const link = page.getByRole("link", { name: /cleanersgallery\.com\.au/i });
  await expect(link).toHaveAttribute("href", /cleanersgallery\.com\.au/);
});

test("C-05 + C-10: cart persists across navigation and submits", async ({
  page,
}) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByLabel("Cart, 1 items")).toBeVisible();
  await page.goto("/supplies/catalogue");
  await page.goto("/supplies/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await page.getByTestId("submit-order").click();
  await expect(page.getByTestId("order-number")).toContainText(/OR-\d{5}/);
});

test("C-06: inactive cart product is rejected and identified", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().click();
  await expect(page).toHaveURL(/\/supplies\/catalogue\/[^/]+$/);
  const productId = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByTestId("add-to-cart").click();
  await expect(page.getByLabel("Cart, 1 items")).toBeVisible();
  try {
    await setProductActive(productId, false);
    await page.goto("/supplies/cart");
    await page.getByTestId("submit-order").click();
    await expect(
      page.getByRole("alert").filter({ hasText: /no longer available/i }),
    ).toBeVisible();
    await expect(page.getByTestId("cart-line")).toContainText(
      /No longer available/i,
    );
  } finally {
    await setProductActive(productId, true);
  }
});

test("C-07 + C-08: own orders only; detail is read-only", async ({ page }) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies");
  await expect(page.getByTestId("order-card").first()).toBeVisible();
  await page.getByTestId("order-card").first().click();
  await expect(page.getByTestId("status-timeline")).toBeVisible();
  await expect(page.getByTestId("status-select")).toHaveCount(0);
  await page.context().clearCookies();
  await login(page, "cleaner2@example.com");
  await page.goto("/supplies");
  await expect(page.getByTestId("order-card")).toHaveCount(0);
  await page.goto("/supplies/cart/submitted?orderNumber=OR-SEED");
  await expect(page.locator("body")).toContainText(/not.*found|404/i);
});

test("C-09: disabled cleaner cannot submit", async ({ page }) => {
  await login(page, "disabled@example.com");
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/supplies/cart");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByTestId("submit-order")).toHaveCount(0);
});

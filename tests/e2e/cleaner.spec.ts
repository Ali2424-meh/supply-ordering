import { expect, test } from "@playwright/test";
import { setProductActive } from "./db";
import { login, setFeature } from "./helpers";

test.describe.configure({ mode: "serial" });

test("C-01: cleaner with feature enabled sees Supplies", async ({ page }) => {
  await setFeature(page, true);
  await login(page, "cleaner@example.com");
  await expect(page).toHaveURL(/\/supplies/);
  await expect(page.locator("header nav")).toContainText("Supplies");
  await expect(page.getByTestId("dashboard-hero")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Everything you need, one request away.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse catalogue" }),
  ).toHaveAttribute("href", "/supplies/catalogue");
  await page.getByTestId("supply-journey").scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("heading", {
      name: "One request. A clear path from cart to site.",
    }),
  ).toBeVisible();
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

  // Active-only: inactive "Retired Mop" must not appear; active "Glass Cleaner 5L" must appear.
  await expect(page.getByTestId("product-card").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Retired Mop");

  // Live search — non-matching term produces empty state (proves the search path fires).
  await page.fill('input[name="q"]', "xyznonexistent");
  await page.waitForURL(/q=xyznonexistent/);
  await expect(page.getByTestId("product-card")).toHaveCount(0);
  await expect(page.locator("body")).toContainText(/no products found/i);

  // Matching term restores results (proves search narrows AND widens correctly).
  await page.fill('input[name="q"]', "Glass");
  await page.waitForURL(/q=Glass/);
  await expect(page.getByTestId("product-card")).toHaveCount(1);

  // Category filter: clear search, then filter to Chemicals (only 1 product).
  await page.fill('input[name="q"]', "");
  await page.waitForURL((url) => !url.searchParams.has("q") || url.searchParams.get("q") === "");
  await page.getByRole("link", { name: "Chemicals" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(1);
});

test("C-04: product detail shows price, description, external link", async ({
  page,
}) => {
  await login(page, "cleaner@example.com");
  await page.goto("/supplies/catalogue");
  await page.getByTestId("product-card").first().getByRole("link").click();
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
  await page.getByTestId("product-card").first().getByRole("link").click();
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
  await page.getByTestId("product-card").first().getByRole("link").click();
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
  await page.getByTestId("order-card").first().getByRole("link").click();
  await expect(page).toHaveURL(/\/supplies\/orders\/[^/]+$/, {
    timeout: 15_000,
  });
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

import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("core worker and admin screens fit a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "cleaner@example.com");
  for (const route of ["/supplies", "/supplies/catalogue", "/supplies/cart"]) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }

  await page.context().clearCookies();
  await login(page, "supply@example.com");
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "Order requests" })).toBeVisible();
});

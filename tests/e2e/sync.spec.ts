import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("S-01 smoke: refresh imports products from the mock store", async ({ page }) => {
  await login(page, "supply@example.com");
  await page.goto("/admin/imports");
  await page.getByTestId("refresh-catalogue").click();
  await expect(page.locator("body")).toContainText(/Added \d+, updated \d+/);
  await expect(page.getByTestId("import-row").first()).toContainText("SUCCEEDED");
  await page.goto("/admin/catalogue");
  await expect(page.locator("body")).toContainText("Pro Mop");
});

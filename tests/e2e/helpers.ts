import { expect, type Page } from "@playwright/test";

export async function login(
  page: Page,
  email: string,
  password = "password123",
) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  const authenticationFinished = Promise.race([
    page.waitForURL((url) => url.pathname !== "/login"),
    page.locator("form p[role='alert']").waitFor({ state: "visible" }),
  ]);
  await page.getByRole("button", { name: "Sign in" }).click();
  await authenticationFinished;
}

export async function setFeature(page: Page, enabled: boolean) {
  await page.context().clearCookies();
  await login(page, "admin@example.com");
  await page.goto("/admin/settings");
  const current = (await page.locator("form p").textContent())?.includes("enabled");
  if (current !== enabled) {
    await page
      .getByRole("button", { name: /(?:Enable|Disable) supply ordering/ })
      .click();
  }
  await expect(page.locator("form p")).toContainText(
    enabled ? "enabled" : "disabled",
  );
  await page.context().clearCookies();
}

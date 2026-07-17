import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("public entrance is responsive and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");

  await expect(
    page.getByRole("heading", {
      name: "From shelf to request, without the paperwork.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  const icon = page.getByTestId("login-step-icon").first();
  await expect(icon).toHaveCSS("transform", "none");
});

test("wide worker canvas and scroll experience remain accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1600, height: 900 });
  await login(page, "cleaner@example.com");

  await expect(page.getByTestId("dashboard-hero")).toBeVisible();
  await expect(page.getByTestId("worker-scroll-progress")).toBeHidden();
  await page.getByTestId("supply-journey").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("supply-journey")).toBeVisible();
  const orbit = page.getByTestId("journey-orbit");
  const transformBefore = await orbit.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.waitForTimeout(250);
  const transformAfter = await orbit.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(transformAfter).toBe(transformBefore);

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

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
  for (const route of ["/admin/orders", "/admin/account"]) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
  await expect(page.getByRole("heading", { name: "Your details" })).toBeVisible();
});

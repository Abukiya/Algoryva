import { test, expect } from "@playwright/test";

// Brand smoke tests. Need the dev server; the landing page and manifest do not need seeded data.
test("landing page is branded Algoryva", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Algoryva/);
  await expect(page.getByRole("link", { name: "Algoryva home" }).first()).toBeVisible();
  await expect(page.getByText(/cp\/platform/i)).toHaveCount(0);
});

test("web app manifest identifies Algoryva", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBeTruthy();
  expect((await res.json()).name).toBe("Algoryva");
});

test("brand assets are served", async ({ request }) => {
  for (const path of ["/brand/algoryva-mark-160.webp", "/brand/algoryva-mark-320.webp", "/brand/algoryva-mark-640.webp", "/icons/icon-192.png", "/icons/icon-512.png"]) {
    expect((await request.get(path)).ok(), path).toBeTruthy();
  }
});

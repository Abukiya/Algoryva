import { test, expect } from "@playwright/test";

// Needs the dev server + a seeded database. Each run registers a fresh random user (no cleanup performed).
const unique = () => `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

test("register, onboard, complete a topic, solve a problem", async ({ page }) => {
  const user = unique();
  await page.goto("/register");
  await page.getByLabel("Email").fill(`${user}@example.com`);
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill("correct-horse-battery-1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 30_000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

  await page.goto("/learn/python-basics");
  await page.getByRole("button", { name: "Mark as complete" }).click();
  await expect(page.getByText("Completed. A review is scheduled.")).toBeVisible();

  await page.goto("/problems?topic=arrays");
  await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
});

test("locked topic explains its prerequisites", async ({ page }) => {
  const user = unique();
  await page.goto("/register");
  await page.getByLabel("Email").fill(`${user}@example.com`);
  await page.getByLabel("Username").fill(user);
  await page.getByLabel("Password").fill("correct-horse-battery-1");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.goto("/learn/prefix-sum");
  await expect(page.getByText(/Locked\. Complete first/)).toBeVisible();
});

test("search finds a topic and a problem", async ({ page }) => {
  await page.goto("/search?q=binary+search");
  await expect(page.getByRole("link", { name: "Binary Search" }).first()).toBeVisible();
});

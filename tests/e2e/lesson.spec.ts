import { test, expect } from "@playwright/test";

// Needs the dev server + a seeded database. Guests can read lessons, so no account is required.
test("a complete lesson: visualization steps, mastery check explains answers, search lands on a section", async ({ page }) => {
  await page.goto("/learn/prefix-sum");
  await expect(page.getByRole("heading", { level: 1, name: "Prefix Sum" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /After this lesson you will be able to/ })).toBeVisible();

  // The visualization loads lazily once scrolled into view, then steps forward.
  const viz = page.getByRole("region", { name: /Visualization: Build the prefix array/ });
  await viz.scrollIntoViewIfNeeded();
  await expect(viz.getByText(/Step 1 of/)).toBeVisible();
  await viz.getByRole("button", { name: "Next step" }).click();
  await expect(viz.getByText(/Step 2 of/)).toBeVisible();

  // Mastery check: answering reveals an explanation, right or wrong.
  const check = page.locator("#mastery-check");
  await check.scrollIntoViewIfNeeded();
  await check.getByRole("button", { name: /^A\s*5$/ }).first().click();
  await expect(check.getByRole("status").first()).toBeVisible();

  await page.goto("/search?q=difference+array");
  await expect(page.getByRole("link", { name: /Prefix Sum/ }).first()).toHaveAttribute("href", /\/learn\/prefix-sum#/);
});

test("outline lessons are labelled as outlines, not passed off as complete", async ({ page }) => {
  await page.goto("/learn/trees");
  await expect(page.getByText("This lesson is an outline, not a full lesson yet")).toBeVisible();
});

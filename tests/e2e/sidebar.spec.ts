import { test, expect } from "@playwright/test";

// Desktop-width only: the sidebar is hidden below the lg breakpoint (phones and tablets use the bottom tabs).
test.use({ viewport: { width: 1280, height: 800 } });

test("sidebar collapses to an icon rail and remembers the choice", async ({ page }) => {
  await page.goto("/learn");
  // A cold dev server hydrates late; clicking before that would do nothing.
  await page.waitForLoadState("networkidle");
  const html = page.locator("html");
  const sidebar = page.locator("#sidebar");
  await expect(html).not.toHaveAttribute("data-sidebar", "collapsed");
  const openWidth = (await sidebar.boundingBox())!.width;

  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(html).toHaveAttribute("data-sidebar", "collapsed");
  await expect.poll(async () => (await sidebar.boundingBox())!.width).toBeLessThan(openWidth / 2);
  // Icons stay reachable and named even though the text is hidden.
  await expect(sidebar.getByRole("link", { name: "Problems" })).toBeVisible();

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(html).toHaveAttribute("data-sidebar", "collapsed");

  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(html).not.toHaveAttribute("data-sidebar", "collapsed");
});

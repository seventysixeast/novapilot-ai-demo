import { expect, test } from "@playwright/test";

test("landing has demo call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Interactive Demo" })).toBeVisible();
});

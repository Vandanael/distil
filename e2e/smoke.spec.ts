import { test, expect } from "@playwright/test";

test("la page login charge", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Distil")).toBeVisible();
  await expect(page.getByText("Connexion par lien magique")).toBeVisible();
});

import { test, expect } from "@playwright/test";

test("la page login charge avec le formulaire magic link", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Distil")).toBeVisible();
  await expect(page.getByText("Connexion par lien magique")).toBeVisible();
  await expect(page.getByRole("button", { name: /lien magique/i })).toBeVisible();
});

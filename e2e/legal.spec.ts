import { test, expect } from '@playwright/test'

test('/privacy renvoie 200, h1 présent, sections FR et EN présentes', async ({ page }) => {
  const response = await page.goto('/privacy')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Section EN condensée
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByText('Full privacy policy available in French below.')).toBeVisible()

  // Section FR complète avec ancre
  await expect(page.locator('#politique-fr')).toBeVisible()
  await expect(page.locator('#politique-fr').getByRole('heading', { level: 2 })).toContainText(
    'Politique de confidentialité'
  )
})

test('/terms renvoie 200, h1 présent, sections FR et EN présentes', async ({ page }) => {
  const response = await page.goto('/terms')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  // Section EN condensée
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible()
  await expect(page.getByText('Full terms of use available in French below.')).toBeVisible()

  // Section FR complète avec ancre
  await expect(page.locator('#conditions-fr')).toBeVisible()
  await expect(page.locator('#conditions-fr').getByRole('heading', { level: 2 })).toContainText(
    "Conditions d'utilisation"
  )
})

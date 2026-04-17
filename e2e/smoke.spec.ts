import { test, expect } from '@playwright/test'

test('la page login charge avec le bouton Google OAuth', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByText('Distil')).toBeVisible()
  await expect(page.getByText('Votre veille quotidienne')).toBeVisible()
  await expect(page.getByRole('button', { name: /continuer avec google/i })).toBeVisible()
  await expect(page.getByPlaceholder(/vous@exemple/i)).toHaveCount(0)
})

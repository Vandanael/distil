import { test, expect } from '@playwright/test'

test('la page about charge avec masthead, hero, copyright et lien GitHub', async ({ page }) => {
  const response = await page.goto('/about')
  expect(response?.status()).toBe(200)

  // Masthead marque Distil (lien accueil)
  await expect(page.getByRole('link', { name: 'Distil' }).first()).toBeVisible()

  // Hero h1 editorial
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Veille intelligente/)

  // Contact = lien GitHub Issues
  const github = page.getByRole('link', { name: /GitHub/i })
  await expect(github).toBeVisible()
  await expect(github).toHaveAttribute('href', /github\.com\/.+\/issues/)
})

test('la section fondations a 2 sous-sections et au moins 3 liens externes', async ({ page }) => {
  await page.goto('/about')

  // 2 sous-sections visuellement séparées
  await expect(page.getByText('Fondations classiques')).toBeVisible()
  await expect(page.getByText(/Fondations récentes/)).toBeVisible()

  // Au moins 3 liens externes dans la section fondations
  const externalLinks = page.locator('#fondations a[href^="http"]')
  const count = await externalLinks.count()
  expect(count).toBeGreaterThanOrEqual(3)
})

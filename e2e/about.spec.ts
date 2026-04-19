import { test, expect } from '@playwright/test'

test('la page about charge avec masthead, hero, copyright et lien GitHub', async ({ page }) => {
  const response = await page.goto('/about')
  expect(response?.status()).toBe(200)

  // Masthead marque Distil (lien accueil)
  await expect(page.getByRole('link', { name: 'Distil' }).first()).toBeVisible()

  // Hero h1 editorial
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Veille intelligente/)

  // Copyright avec annee courante dans le footer public
  const year = new Date().getFullYear()
  await expect(page.getByText(`© ${year} Distil`)).toBeVisible()

  // Contact = lien GitHub Issues (anti-scraping)
  const github = page.getByRole('link', { name: /GitHub/i })
  await expect(github).toBeVisible()
  await expect(github).toHaveAttribute('href', /github\.com\/.+\/issues/)
})

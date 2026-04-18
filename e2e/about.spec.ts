import { test, expect } from '@playwright/test'

test('la page about charge avec masthead, copyright et mailto', async ({ page }) => {
  const response = await page.goto('/about')
  expect(response?.status()).toBe(200)

  await expect(page.getByRole('heading', { name: 'Distil', level: 1 })).toBeVisible()

  const year = new Date().getFullYear()
  await expect(page.getByText(new RegExp(`${year}`))).toBeVisible()

  const mailto = page.getByRole('link', { name: /yvanforestier@gmail\.com/ })
  await expect(mailto).toBeVisible()
  await expect(mailto).toHaveAttribute('href', /^mailto:yvanforestier@gmail\.com$/)
})

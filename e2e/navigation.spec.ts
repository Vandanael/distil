/**
 * Navigation entre les sections de l'app.
 * Teste le header desktop et le BottomNav mobile.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }

test.describe('Navigation desktop (header)', () => {
  test.use({ viewport: DESKTOP })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('Feed → Profil → Feed via header', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Profil' })
      .click()
    await expect(page).toHaveURL(/\/profile/)
    await expect(page.getByRole('heading', { name: /[Pp]reference/ })).toBeVisible()

    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Feed' })
      .click()
    await expect(page).toHaveURL(/\/feed/)
  })

  test('Feed → À lire via header', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'À lire' })
      .click()
    await expect(page).toHaveURL(/\/library/)
  })

  test('Feed → Recherche via header', async ({ page }) => {
    await page
      .getByRole('navigation', { name: 'Navigation principale' })
      .getByRole('link', { name: 'Recherche' })
      .click()
    await expect(page).toHaveURL(/\/search/)
  })
})

test.describe('Qualite du rendu du feed', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('aucune occurrence de "recupere" sans accent dans le DOM du feed', async ({ page }) => {
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toMatch(/recupere/i)
  })
})

test.describe('Navigation mobile (BottomNav)', () => {
  test.use({ viewport: MOBILE })

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('Feed → Profil → Feed via BottomNav', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await nav.getByRole('link', { name: 'Profil' }).click()
    await expect(page).toHaveURL(/\/profile/)

    await nav.getByRole('link', { name: 'Feed' }).click()
    await expect(page).toHaveURL(/\/feed/)
  })

  test('Feed → Recherche via BottomNav', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await nav.getByRole('link', { name: 'Recherche' }).click()
    await expect(page).toHaveURL(/\/search/)
  })

  test('Feed → À lire via BottomNav', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await nav.getByRole('link', { name: 'À lire' }).click()
    await expect(page).toHaveURL(/\/library/)
  })

  test('BottomNav masque sur la page article', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    if ((await firstCard.count()) === 0) return

    await firstCard.click()
    await expect(page).toHaveURL(/\/article\//)

    // BottomNav ne doit pas etre present
    const nav = page.getByRole('navigation', { name: 'Navigation principale' })
    await expect(nav).not.toBeVisible()
  })
})

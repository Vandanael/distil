/**
 * Navigation inter-tabs de la Bibliotheque (Sprint 31).
 * Verifie que les redirections /archive, /rejected, /highlights aboutissent
 * sur /library avec le tab correct, et que le switch entre tabs conserve l'etat.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Bibliotheque unifiee', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('tab saved actif par defaut', async ({ page }) => {
    await page.goto('/library')
    await expect(page.getByTestId('library-tab-saved')).toHaveAttribute('aria-selected', 'true')
  })

  test('switch vers highlights met a jour l URL et l etat', async ({ page }) => {
    await page.goto('/library')
    await page.getByTestId('library-tab-highlights').click()
    await expect(page).toHaveURL(/tab=highlights/)
    await expect(page.getByTestId('library-tab-highlights')).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  test('switch vers filtered met a jour l URL et l etat', async ({ page }) => {
    await page.goto('/library')
    await page.getByTestId('library-tab-filtered').click()
    await expect(page).toHaveURL(/tab=filtered/)
    await expect(page.getByTestId('library-tab-filtered')).toHaveAttribute('aria-selected', 'true')
  })

  test('/archive redirige vers /library?tab=saved', async ({ page }) => {
    await page.goto('/archive')
    await expect(page).toHaveURL(/\/library\?tab=saved/)
  })

  test('/highlights redirige vers /library?tab=highlights', async ({ page }) => {
    await page.goto('/highlights')
    await expect(page).toHaveURL(/\/library\?tab=highlights/)
  })

  test('/rejected redirige vers /library?tab=filtered', async ({ page }) => {
    await page.goto('/rejected')
    await expect(page).toHaveURL(/\/library\?tab=filtered/)
  })
})

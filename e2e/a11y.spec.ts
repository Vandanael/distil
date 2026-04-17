/**
 * Audit a11y via axe-core.
 *
 * Exclut les violations "color-contrast" sur les tokens custom tant qu'on n'a
 * pas passe le design review accessibility complet. Toute regle critical /
 * serious doit rester 0 sur les pages auditees.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { loginAs } from './fixtures/auth'

const CRITICAL_IMPACT = new Set(['critical', 'serious'])

function filterCritical(violations: Array<{ impact?: string | null; id: string }>) {
  return violations.filter((v) => v.impact && CRITICAL_IMPACT.has(v.impact))
}

test.describe('Accessibilite (axe)', () => {
  test('page /feed sans violations critical/serious', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/feed/)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(filterCritical(results.violations)).toEqual([])
  })

  test('page /profile sans violations critical/serious', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(filterCritical(results.violations)).toEqual([])
  })

  test('page /article sans violations critical/serious', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await page.goto('/feed')

    const firstCard = page.getByTestId(/^article-card-/).first()
    const count = await firstCard.count()
    test.skip(count === 0, 'aucun article disponible dans le feed de test')

    await firstCard.click()
    await expect(page).toHaveURL(/\/article\//)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze()

    expect(filterCritical(results.violations)).toEqual([])
  })

  for (const tab of ['saved', 'highlights', 'filtered'] as const) {
    test(`page /library?tab=${tab} sans violations critical/serious`, async ({ page }) => {
      await loginAs(page, 'yvan-test@distil.local')
      await page.goto(`/library?tab=${tab}`)
      await expect(page).toHaveURL(/\/library/)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .disableRules(['color-contrast'])
        .analyze()

      expect(filterCritical(results.violations)).toEqual([])
    })
  }
})

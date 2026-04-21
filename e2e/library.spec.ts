/**
 * Squelette minimal /library (PRD v2 : pile "À lire" simple, statut to_read).
 *
 * Note PR-13 : la Bibliotheque unifiee a onglets (saved/highlights/filtered)
 * a ete retiree du MVP. Le test ci-dessous reste a relancer avec Supabase up
 * (voir docs/pr-13-e2e-a-relancer.md).
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Bibliotheque /library', () => {
  test('la page charge et expose la liste to_read', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await page.goto('/library')
    await expect(page).toHaveURL(/\/library/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/À lire|To read/)
    // Liste presente (peut etre vide ou pleine, on verifie juste qu'elle ne crash pas)
    await expect(page.getByTestId('library-count')).toBeVisible()
  })
})

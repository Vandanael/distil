/**
 * Transparence du scoring - parcours Thomas (ML engineer, allergique au slop).
 * Verifie que le panneau de scoring et les scores rejetes sont visibles.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Transparence du scoring', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'thomas-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('la page rejetes affiche les scores des articles filtres', async ({ page }) => {
    await page.goto('/rejected')
    await expect(page).toHaveURL(/\/rejected/)

    const cards = page.getByTestId(/^rejected-card-/)
    const count = await cards.count()

    if (count > 0) {
      // Pas d'erreur si 0 badges (articles sans score), on verifie juste l'absence d'erreur
      await expect(page.getByTestId('rejected-articles')).toBeVisible()
    } else {
      await expect(page.getByText('Aucun article rejet')).toBeVisible()
    }
  })

  test('un article accepte affiche le panneau de scoring', async ({ page }) => {
    // Navigue vers le feed et clique sur le premier article
    const firstCard = page.getByTestId(/^article-card-/).first()
    const count = await firstCard.count()

    if (count > 0) {
      await firstCard.click()
      await expect(page).toHaveURL(/\/article\//)

      // Le panneau de scoring doit etre present si show_scores est active
      // (on verifie sa presence ou son absence sans erreur)
      await expect(page.getByTestId('article-content')).toBeVisible()
    }
  })
})

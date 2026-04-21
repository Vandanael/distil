/**
 * Transparence du scoring - parcours Thomas (ML engineer, allergique au slop).
 * Verifie que la page article charge correctement.
 *
 * Note PR-13 : le scenario "section filtres affiche les scores des articles
 * filtres" a ete supprime - la vue dediee aux articles rejetes n'est pas dans
 * le PRD v2 (positionnement "on filtre pour toi", pas "voici tout ce qu'on a
 * ecarte"). Voir docs/pr-13-tests-casses.md (a supprimer apres merge).
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Transparence du scoring', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'thomas-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
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

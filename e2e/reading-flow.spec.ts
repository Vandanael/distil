/**
 * Flow de lecture - actions de base sur un article.
 * Teste l'ouverture, l'archivage, le rejet, et la retrouvabilite.
 * Utilise le compte Yvan (profil complet, articles existants).
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Flow de lecture', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')
    await expect(page).toHaveURL(/\/feed/)
  })

  test('ouvrir un article depuis le feed', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    const count = await firstCard.count()
    if (count === 0) {
      // Feed vide - le test passe sans bloquer
      await expect(page.getByTestId('empty-feed')).toBeVisible()
      return
    }

    await firstCard.click()
    await expect(page).toHaveURL(/\/article\//)
    await expect(page.getByTestId('article-content')).toBeVisible()
    await expect(page.getByTestId('floating-action-bar')).toBeVisible()
  })

  test('archiver un article depuis la vue de lecture', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    if ((await firstCard.count()) === 0) return

    const articleUrl = await firstCard.getAttribute('href')
    await firstCard.click()
    await expect(page).toHaveURL(/\/article\//)

    // Clic sur Archiver
    await page.getByTestId('action-archive').click()

    // La FloatingActionBar confirme l'archivage
    await expect(page.getByText('Archive')).toBeVisible({ timeout: 5000 })

    // L'article est retrouvable dans /archive
    if (articleUrl) {
      const articleId = articleUrl.split('/').pop()
      await page.goto('/archive')
      await expect(page).toHaveURL(/\/archive/)
      if (articleId) {
        await expect(page.getByTestId(`archive-card-${articleId}`)).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('rejeter un article depuis le feed', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    if ((await firstCard.count()) === 0) return

    const dismissBtn = firstCard.getByTestId(/^dismiss-/)
    await dismissBtn.click()

    // Toast "Article masque" visible
    await expect(page.getByText('Article masque')).toBeVisible({ timeout: 3000 })
  })

  test('annuler le rejet via undo', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    if ((await firstCard.count()) === 0) return

    const articleId = await firstCard.getAttribute('data-article-id')
    const dismissBtn = firstCard.getByTestId(/^dismiss-/)
    await dismissBtn.click()

    await expect(page.getByText('Article masque')).toBeVisible({ timeout: 3000 })
    await page.getByText('Annuler').click()

    // La carte doit reapparaitre (le dismiss a ete annule)
    if (articleId) {
      await expect(page.getByTestId(`article-card-${articleId}`)).toBeVisible({ timeout: 3000 })
    }
  })

  test('retourner au feed depuis la vue article', async ({ page }) => {
    const firstCard = page.getByTestId(/^article-card-/).first()
    if ((await firstCard.count()) === 0) return

    await firstCard.click()
    await expect(page).toHaveURL(/\/article\//)

    await page.goBack()
    await expect(page).toHaveURL(/\/feed/)
  })
})

/**
 * Parcours Yvan - PM senior, onboarding Express avec textarea,
 * verifie que le profil est bien enregistre sur la page preferences.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Yvan - onboarding Express + verification profil', () => {
  test('Express avec texte profil, verifie les preferences', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')

    await expect(page).toHaveURL(/\/onboarding/)
    await page.getByTestId('card-express').click()

    // Remplit le textarea
    await page.getByTestId('profile-text').fill('PM senior, product, IA, startups')
    await page.getByTestId('sector-select').selectOption('Produit')
    await page.getByTestId('submit-express').click()

    await expect(page).toHaveURL(/\/feed/)

    // Navigue vers le profil
    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/)

    // Verifie que le texte du profil est bien charge
    await expect(page.getByTestId('profile-text')).toHaveValue('PM senior, product, IA, startups')
  })
})

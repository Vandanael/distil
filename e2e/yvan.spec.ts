/**
 * Parcours Yvan - PM senior, onboarding ecran unique avec profile_text,
 * verifie que le profil est bien enregistre sur la page preferences.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Yvan - onboarding ecran unique + verification profil', () => {
  test('Remplit profile_text, verifie les preferences', async ({ page }) => {
    await loginAs(page, 'yvan-test@distil.local')

    await expect(page).toHaveURL(/\/onboarding/)

    await page.getByTestId('profile-text').fill('PM senior, product, IA, startups')
    await page.getByTestId('submit-onboarding').click()

    await expect(page).toHaveURL(/\/feed/)

    await page.goto('/profile')
    await expect(page).toHaveURL(/\/profile/)

    await expect(page.getByTestId('profile-text')).toHaveValue('PM senior, product, IA, startups')
  })
})

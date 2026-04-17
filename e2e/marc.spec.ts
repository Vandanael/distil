/**
 * Parcours Marc - consultant, onboarding ecran unique sans sources.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Marc - onboarding ecran unique', () => {
  test('saisit uniquement profile_text, profil cree, atterrit sur feed', async ({ page }) => {
    await loginAs(page, 'marc-test@distil.local')

    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByText('Bienvenue dans Distil')).toBeVisible()

    await page.getByTestId('profile-text').fill('Consultant strategie, transformation digitale')
    await page.getByTestId('submit-onboarding').click()

    await expect(page).toHaveURL(/\/feed/)
  })
})

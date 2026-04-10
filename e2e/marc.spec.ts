/**
 * Parcours Marc - consultant, onboarding Express sans textarea,
 * selectionne "Consulting", profil cree.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Marc - onboarding Express', () => {
  test('selectionne Consulting sans textarea, profil cree, atterrit sur feed', async ({ page }) => {
    await loginAs(page, 'marc-test@distil.local')

    // Doit atterrir sur /onboarding
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByText('Bienvenue dans Distil')).toBeVisible()

    // Clique sur la carte "Rapide"
    await page.getByTestId('card-express').click()
    await expect(page).toHaveURL(/\/onboarding\/express/)

    // Selectionne le secteur "Consulting" sans remplir le textarea
    await page.getByTestId('sector-select').selectOption('Consulting')

    // Soumet
    await page.getByTestId('submit-express').click()

    // Doit atterrir sur /feed
    await expect(page).toHaveURL(/\/feed/)
  })
})

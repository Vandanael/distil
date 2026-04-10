/**
 * Parcours Thomas - ML engineer, onboarding Wizard complet,
 * interets explicites, cap 5, serendipite 30%.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Thomas - onboarding Wizard', () => {
  test('wizard 5 etapes, cap 5, serendipite 30%, profil cree', async ({ page }) => {
    await loginAs(page, 'thomas-test@distil.local')

    await expect(page).toHaveURL(/\/onboarding/)
    await page.getByTestId('card-wizard').click()
    await expect(page).toHaveURL(/\/onboarding\/wizard/)

    // Etape 1 : interets
    await expect(page.getByTestId('wizard-step-1')).toBeVisible()
    await page.getByTestId('interest-input').fill('machine learning')
    await page.keyboard.press('Enter')
    await page.getByTestId('interest-input').fill('sources primaires')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('interests-list')).toContainText('machine learning')
    await page.getByTestId('wizard-next').click()

    // Etape 2 : sources
    await expect(page.getByTestId('wizard-step-2')).toBeVisible()
    await page.getByTestId('source-input').fill('arxiv.org')
    await page.keyboard.press('Enter')
    await page.getByTestId('wizard-next').click()

    // Etape 3 : rythme - selectionner 5
    await expect(page.getByTestId('wizard-step-3')).toBeVisible()
    await page.getByTestId('cap-5').click()
    await page.getByTestId('wizard-next').click()

    // Etape 4 : serendipite - selectionner 30%
    await expect(page.getByTestId('wizard-step-4')).toBeVisible()
    await page.getByTestId('serendipity-30').click()
    await page.getByTestId('wizard-next').click()

    // Etape 5 : recap
    await expect(page.getByTestId('wizard-step-5')).toBeVisible()
    await expect(page.getByText('machine learning')).toBeVisible()
    await expect(page.getByText('5')).toBeVisible()
    await expect(page.getByText('30%')).toBeVisible()

    await page.getByTestId('wizard-submit').click()
    await expect(page).toHaveURL(/\/feed/)
  })
})

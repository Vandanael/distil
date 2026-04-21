/**
 * Parcours Thomas - ML engineer, onboarding ecran unique avec sources,
 * ajuste cap et serendipite dans les parametres avances.
 */
import { test, expect } from '@playwright/test'
import { loginAs } from './fixtures/auth'

test.describe('Thomas - onboarding + parametres avances', () => {
  test('saisit profile_text + sources, regle cap et serendipite, feed visible', async ({
    page,
  }) => {
    await loginAs(page, 'thomas-test@distil.local')

    await expect(page).toHaveURL(/\/onboarding/)

    await page
      .getByTestId('profile-text')
      .fill('ML engineer, sources primaires uniquement, machine learning')

    await page.getByTestId('sources-urllist-input').fill('arxiv.org')
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('sources-urllist-list')).toContainText('arxiv.org')

    await page.getByTestId('submit-onboarding').click()
    await expect(page).toHaveURL(/\/feed/)

    // Parametres avances : cap + serendipite
    await page.goto('/profile')
    await page.getByText('Parametres avances').click()

    await page.getByTestId('daily-cap-select').selectOption('5')
    await page.getByTestId('serendipity-select').selectOption('0.3')
  })
})

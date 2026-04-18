import { test, expect } from '@playwright/test'

test('la page login charge avec le bouton Google OAuth et le lien retour', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Distil')
  await expect(page.getByText(/Votre veille quotidienne/)).toBeVisible()
  await expect(page.getByRole('button', { name: /continuer avec google/i })).toBeVisible()
  await expect(page.getByPlaceholder(/vous@exemple/i)).toHaveCount(0)
  const back = page.getByRole('link', { name: /accueil/i })
  await expect(back).toBeVisible()
  await expect(back).toHaveAttribute('href', '/')
})

test('la homepage publique expose le lien Connexion et le bloc Comment ca marche', async ({
  page,
}) => {
  await page.goto('/')
  const login = page.getByRole('link', { name: 'Connexion' }).first()
  await expect(login).toBeVisible()
  await expect(login).toHaveAttribute('href', '/login')

  await expect(page.getByText('Comment ca marche')).toBeVisible()
  await expect(page.getByText('01')).toBeVisible()
  await expect(page.getByText('02')).toBeVisible()
  await expect(page.getByText('03')).toBeVisible()
  await expect(page.getByText('On capte')).toBeVisible()
  await expect(page.getByText('On filtre')).toBeVisible()
  await expect(page.getByText('On sert')).toBeVisible()
})

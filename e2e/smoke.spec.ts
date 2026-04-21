import { test, expect } from '@playwright/test'

test('la page login charge avec OAuth Google et formulaire magic link', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Distil')
  await expect(page.getByText(/Votre veille quotidienne/)).toBeVisible()
  await expect(page.getByRole('button', { name: /continuer avec google/i })).toBeVisible()
  // Formulaire magic link present (PR-13 : ajout du flow email comme alternative a Google OAuth)
  await expect(page.getByPlaceholder('vous@exemple.com')).toBeVisible()
  await expect(page.getByRole('button', { name: /envoyer le lien/i })).toBeVisible()
  const back = page.getByRole('link', { name: /accueil/i })
  await expect(back).toBeVisible()
  await expect(back).toHaveAttribute('href', '/')
})

test('la homepage publique expose le H1 tagline et le CTA principal', async ({ page }) => {
  await page.goto('/')
  // Smoke test : on ne valide que la presence du H1 et du CTA, pas le contenu editorial
  // detaille (qui evolue souvent et casserait le test a chaque ajustement de copy).
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Votre veille quotidienne')
  await expect(page.getByRole('link', { name: /commencer/i }).first()).toBeVisible()
})

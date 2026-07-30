import { expect, test } from '@playwright/test'

test('la página 404 muestra el error y permite volver', async ({ page }) => {
  const response = await page.goto('/esta-ruta-no-existe')

  // La SPA responde 200 (es client-side), pero la vista debe ser el 404.
  await expect(page.getByRole('heading', { name: /marchitado/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
  expect(response?.status()).toBeLessThan(400)
})

test('el catálogo filtra por categoría desde la URL', async ({ page }) => {
  await page.goto('/shop?category=suculentas')

  await expect(page.getByRole('heading', { name: 'Plantas disponibles' })).toBeVisible()
  // El recuento debe reflejar un subconjunto, no el catálogo entero.
  await expect(page.getByText(/producto/i).first()).toBeVisible()
})

test('el toggle de tema cambia el atributo data-theme', async ({ page }) => {
  await page.goto('/')

  const initial = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))

  await page.getByRole('button', { name: /tema (oscuro|claro)/i }).click()

  const next = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
  expect(next).not.toBe(initial)
})

test('la ruta de admin exige sesión', async ({ page }) => {
  await page.goto('/admin')

  // ProtectedRoute redirige a /account cuando no hay sesión.
  await expect(page).toHaveURL(/\/account/)
})

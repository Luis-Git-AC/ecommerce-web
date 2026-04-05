import { expect, test } from '@playwright/test'

test('registro, carrito y creacion de pedido hasta checkout', async ({ page }) => {
  const timestamp = Date.now()
  const email = `playwright.critical.${timestamp}@example.com`

  await page.goto('/account')

  await page.getByRole('textbox', { name: 'Nombre' }).fill('Playwright Critical User')
  await page.getByRole('textbox', { name: 'Correo' }).nth(1).fill(email)
  await page.getByLabel('Contraseña').nth(1).fill('Password123!')
  await page.getByRole('button', { name: 'Registrarme' }).click()

  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()

  await page.goto('/shop')
  await expect(page.getByRole('heading', { name: 'Plantas disponibles' })).toBeVisible()

  await page.getByRole('link', { name: 'Ver detalle' }).first().click()
  await expect(page).toHaveURL(/\/product\//)

  await page.getByRole('button', { name: 'Añadir al carrito' }).click()
  await expect(page.getByText('Producto agregado al carrito.')).toBeVisible()

  await page.goto('/cart')
  await expect(page.getByRole('heading', { name: 'Carrito' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Crear pedido' })).toBeEnabled()

  await page.getByRole('button', { name: 'Crear pedido' }).click()

  await expect(page).toHaveURL(/\/checkout\//)
  await expect(page.getByRole('heading', { name: 'Checkout seguro' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resumen del pedido' })).toBeVisible()
})
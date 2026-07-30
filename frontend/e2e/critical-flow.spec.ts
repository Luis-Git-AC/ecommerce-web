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

  // Desde la fase 3.3 el pedido exige direccion de envio.
  await page.getByLabel('Nombre y apellidos').fill('Playwright Critical User')
  await page.getByLabel('Dirección', { exact: true }).fill('Calle Mayor 12, 3 B')
  await page.getByLabel('Código postal').fill('28013')
  await page.getByLabel('Ciudad').fill('Madrid')
  await page.getByLabel('Provincia').fill('Madrid')
  await page.getByLabel('Teléfono').fill('+34 600 123 456')

  await expect(page.getByRole('button', { name: 'Crear pedido' })).toBeEnabled()
  await page.getByRole('button', { name: 'Crear pedido' }).click()

  await expect(page).toHaveURL(/\/checkout\//)
  await expect(page.getByRole('heading', { name: 'Checkout seguro' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Resumen del pedido' })).toBeVisible()
})

/**
 * Pago con la tarjeta de test de Stripe. Requiere VITE_STRIPE_PUBLISHABLE_KEY y
 * un backend con STRIPE_SECRET_KEY configurados; si no, el formulario de pago
 * no se monta y el test se salta solo en lugar de fallar.
 */
test('completa el pago con la tarjeta de prueba de Stripe', async ({ page }) => {
  const timestamp = Date.now()
  const email = `playwright.pay.${timestamp}@example.com`

  await page.goto('/account')
  await page.getByRole('textbox', { name: 'Nombre' }).fill('Playwright Pay User')
  await page.getByRole('textbox', { name: 'Correo' }).nth(1).fill(email)
  await page.getByLabel('Contraseña').nth(1).fill('Password123!')
  await page.getByRole('button', { name: 'Registrarme' }).click()
  await expect(page.getByRole('heading', { name: 'Mis pedidos' })).toBeVisible()

  await page.goto('/shop')
  await page.getByRole('link', { name: 'Ver detalle' }).first().click()
  await page.getByRole('button', { name: 'Añadir al carrito' }).click()

  await page.goto('/cart')
  await page.getByLabel('Nombre y apellidos').fill('Playwright Pay User')
  await page.getByLabel('Dirección', { exact: true }).fill('Calle Mayor 12, 3 B')
  await page.getByLabel('Código postal').fill('28013')
  await page.getByLabel('Ciudad').fill('Madrid')
  await page.getByLabel('Provincia').fill('Madrid')
  await page.getByLabel('Teléfono').fill('+34 600 123 456')
  await page.getByRole('button', { name: 'Crear pedido' }).click()
  await expect(page).toHaveURL(/\/checkout\//)

  // Si Stripe no está configurado en el entorno, no hay formulario que rellenar.
  const stripeUnavailable = page.getByRole('heading', { name: 'Stripe no configurado' })
  if (await stripeUnavailable.isVisible().catch(() => false)) {
    test.skip(true, 'Stripe no configurado en el entorno de test')
  }

  // Stripe Elements se renderiza en un iframe. El titulo y los placeholders se
  // localizan segun el locale del navegador (la app pide es-ES), por eso los
  // selectores aceptan tanto el texto en ingles como en espanol.
  const cardFrame = page
    .frameLocator('iframe[title*="Secure payment"], iframe[title*="seguro para el pago"]')
    .first()

  // Con varios metodos de pago activos en la cuenta de Stripe, el Payment
  // Element se muestra como una lista y hay que elegir "Tarjeta" antes de que
  // aparezcan los campos de la tarjeta.
  await cardFrame.getByText(/^(Tarjeta|Card)$/).click()
  await cardFrame.getByPlaceholder('1234 1234 1234 1234').fill('4242 4242 4242 4242')
  await cardFrame.getByPlaceholder(/MM \/ (YY|AA)/).fill('12 / 34')
  await cardFrame.getByPlaceholder('CVC').fill('123')

  await page.getByRole('button', { name: 'Pagar ahora' }).click()

  // Tras confirmar, el pedido queda pagado (el webhook lo reconcilia).
  await expect(page.getByText(/pago (confirmado|completado)/i)).toBeVisible({ timeout: 20_000 })
})

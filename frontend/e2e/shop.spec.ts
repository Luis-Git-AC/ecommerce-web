import { expect, test } from '@playwright/test'

test('shop renderiza cards de productos', async ({ page }) => {
  await page.goto('/shop')

  await expect(page.getByRole('heading', { name: 'Plantas disponibles' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ver detalle' }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Ver detalle' }).first().click()
  await expect(page).toHaveURL(/\/product\//)
})

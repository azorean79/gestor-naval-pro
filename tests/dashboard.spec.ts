import { test, expect } from '@playwright/test';

test('dashboard renders main metrics', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('h1')).toHaveText(/Dashboard/i);
  await expect(page.getByText('Alertas de Stock')).toBeVisible();
  await expect(page.getByText('Inspeções Caducadas')).toBeVisible();
  await expect(page.getByText('Inspeções Próximas (30 dias)')).toBeVisible();
  await expect(page.getByText('Ver Stock')).toBeVisible();
});

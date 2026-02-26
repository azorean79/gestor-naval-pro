import { test, expect } from '@playwright/test';

test('inspecao page shows not-found message for missing id', async ({ page }) => {
  await page.goto('/agenda/inspecao/9999');
  // The page fetches the agendamento; if not found it renders this message
  await expect(page.getByText('Inspeção não encontrada.')).toBeVisible();
});

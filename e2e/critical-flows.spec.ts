import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('deve carregar dashboard principal', async ({ page }) => {
    await page.goto('/');

    // Verificar se redireciona para dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verificar elementos principais
    await expect(page.locator('h1').filter({ hasText: /Dashboard|Gestor Naval/ })).toBeVisible();
  });

  test('deve carregar dashboard diretamente', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar título da página
    await expect(page.locator('h1')).toContainText(/Dashboard/);

    // Verificar se widgets/carões estão presentes
    await expect(page.locator('[data-testid="status-cards"], .grid, .card')).toBeVisible();
  });
});

test.describe('Navegação', () => {
  test('deve navegar entre seções principais', async ({ page }) => {
    await page.goto('/dashboard');

    // Testar navegação para Jangadas
    await page.getByRole('link', { name: /jangadas/i }).click();
    await expect(page).toHaveURL(/.*jangadas/);
    await expect(page.locator('h1')).toContainText(/Jangadas/);

    // Testar navegação para Navios
    await page.getByRole('link', { name: /navios/i }).click();
    await expect(page).toHaveURL(/.*navios/);
    await expect(page.locator('h1')).toContainText(/Navios/);

    // Testar navegação para Clientes
    await page.getByRole('link', { name: /clientes/i }).click();
    await expect(page).toHaveURL(/.*clientes/);
    await expect(page.locator('h1')).toContainText(/Clientes/);
  });
});

test.describe('Marcas Jangada', () => {
  test('deve listar marcas', async ({ page }) => {
    await page.goto('/marcas');

    // Verificar se a página carrega
    await expect(page.locator('h1')).toContainText(/Marcas/);

    // Verificar se há uma tabela ou lista
    await expect(page.locator('table, [data-testid="marcas-list"]')).toBeVisible();
  });

  test('deve validar criação de marca duplicada', async ({ page }) => {
    await page.goto('/marcas');

    // Clicar em adicionar nova marca
    await page.getByRole('button', { name: /adicionar|novo/i }).click();

    // Preencher formulário com marca que já existe
    await page.fill('input[name="nome"]', 'Marca Teste Duplicada');

    // Tentar salvar
    await page.getByRole('button', { name: /salvar|criar/i }).click();

    // Verificar mensagem de erro
    await expect(page.locator('text=/já existe|duplicad/i')).toBeVisible();
  });
});

test.describe('API Health', () => {
  test('APIs críticas devem responder', async ({ request }) => {
    // Testar API de marcas
    const marcasResponse = await request.get('/api/marcas-jangada');
    expect(marcasResponse.ok()).toBeTruthy();

    // Testar API de dashboard
    const dashboardResponse = await request.get('/api/dashboard/resumo');
    expect(dashboardResponse.ok()).toBeTruthy();

    // Testar API de clientes
    const clientesResponse = await request.get('/api/clientes');
    expect(clientesResponse.ok()).toBeTruthy();
  });

  test('deve rejeitar criação de marca duplicada via API', async ({ request }) => {
    // Tentar criar marca que já existe
    const response = await request.post('/api/marcas-jangada', {
      data: { nome: 'Marca Teste' }
    });

    // Deve retornar 400 Bad Request
    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Já existe');
  });
});

test.describe('Responsividade', () => {
  test('deve funcionar em mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Teste apenas para mobile');

    await page.goto('/dashboard');

    // Verificar se menu mobile está presente
    await expect(page.locator('[data-testid="mobile-menu"], .mobile-nav')).toBeVisible();

    // Verificar se conteúdo é responsivo
    await expect(page.locator('.container, main')).toHaveCSS('max-width', /100%|auto/);
  });
});
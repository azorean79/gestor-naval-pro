import { test, expect } from '@playwright/test';

test.describe('CRUD Operations', () => {
  test('Clientes - fluxo completo', async ({ page }) => {
    await page.goto('/clientes');

    // Verificar listagem
    await expect(page.locator('h1')).toContainText(/Clientes/);

    // Clicar em novo cliente
    await page.getByRole('button', { name: /novo|adicionar/i }).click();
    await expect(page).toHaveURL(/.*clientes\/novo/);

    // Preencher formulário
    await page.fill('input[name="nome"]', 'Cliente Teste E2E');
    await page.fill('input[name="email"]', 'teste.e2e@email.com');
    await page.fill('input[name="telefone"]', '+351 123 456 789');

    // Salvar
    await page.getByRole('button', { name: /salvar|criar/i }).click();

    // Verificar se voltou para listagem
    await expect(page).toHaveURL(/.*clientes/);

    // Verificar se cliente aparece na lista
    await expect(page.locator('text=Cliente Teste E2E')).toBeVisible();
  });

  test('Stock - validação de campos obrigatórios', async ({ page }) => {
    await page.goto('/stock');

    // Clicar em adicionar item
    await page.getByRole('button', { name: /novo|adicionar/i }).click();

    // Tentar salvar sem preencher campos obrigatórios
    await page.getByRole('button', { name: /salvar/i }).click();

    // Verificar mensagens de validação
    await expect(page.locator('text=/obrigatório|required/i')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('página dashboard carrega rapidamente', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Menos de 5 segundos

    console.log(`Dashboard carregou em ${loadTime}ms`);
  });

  test('APIs respondem rapidamente', async ({ request }) => {
    const startTime = Date.now();

    const [marcasRes, dashboardRes, clientesRes] = await Promise.all([
      request.get('/api/marcas-jangada'),
      request.get('/api/dashboard/resumo'),
      request.get('/api/clientes')
    ]);

    const responseTime = Date.now() - startTime;

    expect(marcasRes.ok()).toBeTruthy();
    expect(dashboardRes.ok()).toBeTruthy();
    expect(clientesRes.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(2000); // Menos de 2 segundos

    console.log(`APIs responderam em ${responseTime}ms`);
  });
});

test.describe('Error Handling', () => {
  test('página 404 funciona corretamente', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe');

    // Deve mostrar página 404
    await expect(page.locator('text=/404|página não encontrada/i')).toBeVisible();
  });

  test('API com erro retorna resposta adequada', async ({ request }) => {
    // Tentar acessar API inexistente
    const response = await request.get('/api/endpoint-inexistente');

    expect(response.status()).toBe(404);
  });
});

test.describe('Data Integrity', () => {
  test('dados são persistidos corretamente', async ({ page, request }) => {
    // Criar uma marca via API
    const marcaData = { nome: `Marca Teste ${Date.now()}` };
    const createResponse = await request.post('/api/marcas-jangada', {
      data: marcaData
    });

    expect(createResponse.ok()).toBeTruthy();

    const createdMarca = await createResponse.json();

    // Verificar se aparece na listagem
    const listResponse = await request.get('/api/marcas-jangada');
    const marcas = await listResponse.json();

    const marcaEncontrada = marcas.find((m: any) => m.id === createdMarca.id);
    expect(marcaEncontrada).toBeTruthy();
    expect(marcaEncontrada.nome).toBe(marcaData.nome);
  });
});
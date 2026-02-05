import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('/api/marcas-jangada POST', () => {
  it('deve criar marca com sucesso', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ nome: 'Nova Marca Teste' })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.nome).toBe('Nova Marca Teste');
  });

  it('deve rejeitar marca duplicada', async () => {
    // Primeiro cria uma marca
    const mockRequest1 = {
      json: jest.fn().mockResolvedValue({ nome: 'Marca Duplicada' })
    } as unknown as NextRequest;

    await POST(mockRequest1);

    // Tenta criar a mesma marca novamente
    const mockRequest2 = {
      json: jest.fn().mockResolvedValue({ nome: 'Marca Duplicada' })
    } as unknown as NextRequest;

    const response = await POST(mockRequest2);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Já existe');
  });

  it('deve rejeitar nome vazio', async () => {
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ nome: '' })
    } as unknown as NextRequest;

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('obrigatório');
  });
});
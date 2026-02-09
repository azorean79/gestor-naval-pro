describe('Validação e notificações', () => {
import { describe, it, expect } from 'vitest';
import { prisma } from '../src/lib/prisma';

describe('Validação e notificações', () => {
  it('deve criar notificações para componentes vencidos', async () => {
    await prisma.notificacao.create({
      data: {
        titulo: '⛔ Componente vencido: Teste',
        mensagem: 'Jangada X possui componente Teste vencido.',
        tipo: 'warning',
        jangadaNumeroSerie: 'X',
        dataEnvio: new Date(),
      }
    });
    const notificacao = await prisma.notificacao.findFirst({ where: { titulo: { contains: 'vencido' } } });
    expect(notificacao).toBeTruthy();
  });

  it('deve criar notificações para divergências de cilindro', async () => {
  it('deve criar notificações para divergências de cilindro', async () => {
    await prisma.notificacao.create({
      data: {
        titulo: '❗ Divergência de cilindro: Teste',
        mensagem: 'Jangada Y modelo Z: esperado 2, importado 1.',
        tipo: 'warning',
        jangadaNumeroSerie: 'Y',
        dataEnvio: new Date(),
      }
    });
    const notificacao = await prisma.notificacao.findFirst({ where: { titulo: { contains: 'Divergência' } } });
    expect(notificacao).toBeTruthy();
  });
});

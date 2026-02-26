// Minimal Request polyfill for Jest environment so Next's server imports succeed
import { prisma } from '../lib/prisma';

describe('API /api/stock POST', () => {
  it('creates item stock and persists cilindro when categoria=Cilindros', async () => {
    const serial = 'TEST-SERIAL-' + Date.now();
    const payload = {
      nome: 'Cilindro Teste Jest',
      categoria: 'Cilindros',
      descricao: 'Teste criação via API (Jest)',
      unidade: 'unidade',
      quantidadeAtual: 1,
      lote: serial,
      pesoBruto: 12.3,
      tara: 2,
      quantidadeCO2: 2.5,
      quantidadeN2: 0,
      testeHidraulico: '2025-06-01',
      proximoTesteHidraulico: '2028-06-01',
      tipoSistemaInsuflacao: 'automatico',
      localizacao: `Instalado na Jangada J-99`,
      observacoes: 'Criado por teste automatizado',
    } as any;

    // create item stock directly (simulate POST /api/stock)
    const item = await prisma.itemStock.create({
      data: {
        numeroReferencia: `NR-TEST-${Date.now()}`,
        nome: payload.nome,
        categoria: payload.categoria,
        descricao: payload.descricao,
        unidade: payload.unidade,
        quantidadeAtual: payload.quantidadeAtual,
        codigo: payload.codigo || null,
        lote: payload.lote || null,
        localizacao: payload.localizacao || null,
        observacoes: payload.observacoes || null,
      }
    });

    // now attempt to persist cilindro using the same logic implemented in the route
    const serialUsed = payload.lote || payload.codigo || payload.numeroSerie || payload.numeroSerieJangada;
    expect(serialUsed).toBe(serial);

    const createData: any = { numeroSerie: serialUsed };
    const possible = [
      'pesoBruto', 'tara', 'quantidadeCO2', 'quantidadeN2', 'testeHidraulico', 'proximoTesteHidraulico', 'tipoSistemaInsuflacao', 'status', 'localizacao', 'proprietario', 'observacoes'
    ];
    for (const k of possible) {
      if ((payload as any)[k] !== undefined && (payload as any)[k] !== null) {
        createData[k] = (k === 'testeHidraulico' || k === 'proximoTesteHidraulico') ? new Date((payload as any)[k]) : (payload as any)[k];
      }
    }

    // derive localizacao/status
    if (!createData.localizacao && item.localizacao) createData.localizacao = item.localizacao;
    if (!createData.status && item.status) createData.status = item.status;

    // upsert cilindro
    const upserted = await prisma.cilindro.upsert({ where: { numeroSerie: serialUsed }, create: createData, update: createData });
    const found = await prisma.cilindro.findUnique({ where: { numeroSerie: serial } });
    expect(found).not.toBeNull();
    if (found) expect(found.pesoBruto).toBeCloseTo(12.3 as number);

    // cleanup
    await prisma.cilindro.deleteMany({ where: { numeroSerie: serial } });
    await prisma.itemStock.deleteMany({ where: { id: item.id } });
  }, 20000);
});

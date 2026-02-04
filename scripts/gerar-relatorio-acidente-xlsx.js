const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const XLSX = require('xlsx');

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Inicializar Prisma com adapter PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function calcularTestesSOLAS(dataFabricacao, dataInspecao = new Date()) {
  const idadeAnos = Math.floor((dataInspecao - dataFabricacao) / (1000 * 60 * 60 * 24 * 365.25));
  const testes = [];

  testes.push({
    nome: 'Inspeção Visual Completa',
    custo: 150.0,
    norma: 'SOLAS III/20, IMO MSC.218(82)',
    obrigatorio: true,
  });

  testes.push({
    nome: 'Teste de Pressão (Pressure Test)',
    custo: 200.0,
    norma: 'SOLAS III/20.8, IMO MSC.48(66)',
    obrigatorio: true,
  });

  if (idadeAnos >= 10) {
    testes.push({
      nome: 'FS Test (Fabric Strength Test)',
      custo: 350.0,
      norma: 'IMO MSC.81(70) Annex 1',
      obrigatorio: true,
    });
    testes.push({
      nome: 'NAP Test (Necessary Additional Pressure)',
      custo: 300.0,
      norma: 'IMO MSC.81(70) Annex 2',
      obrigatorio: true,
    });
  }

  if (idadeAnos >= 5 && idadeAnos % 5 === 0) {
    testes.push({
      nome: 'Gas Insuflation Test',
      custo: 450.0,
      norma: 'SOLAS III/20.11, IMO MSC.218(82)',
      obrigatorio: true,
    });
  }

  return { idadeAnos, testes };
}

async function gerarRelatorioXLSX() {
  console.log('📊 Gerando relatório Excel (acidente total)...');

  const jangada = await prisma.jangada.findFirst({
    where: { numeroSerie: { contains: 'RFD-MKIV-ESP' } },
    include: {
      navio: { include: { cliente: true } },
      marca: true,
      modelo: true,
      lotacao: true,
      tipoPackRef: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!jangada) {
    throw new Error('Jangada não encontrada');
  }

  const componentes = await prisma.inspecaoComponente.findMany({
    where: { jangadaId: jangada.id },
    orderBy: { nome: 'asc' },
  });

  const fatura = await prisma.fatura.findFirst({
    where: { jangadaId: jangada.id },
    orderBy: { createdAt: 'desc' },
  });

  const obra = await prisma.obra.findFirst({
    where: { clienteId: jangada.navio.clienteId },
    orderBy: { createdAt: 'desc' },
  });

  const movimentacoes = await prisma.movimentacaoStock.findMany({
    where: {
      motivo: { contains: `Acidente Jangada ${jangada.numeroSerie}` },
    },
    orderBy: { data: 'desc' },
  });

  const { idadeAnos, testes } = calcularTestesSOLAS(jangada.dataFabricacao, new Date());
  const custoTestes = testes.reduce((sum, t) => sum + t.custo, 0);

  const resumo = [
    ['Relatório de Acidente - Jangada'],
    ['Número de Série', jangada.numeroSerie],
    ['Navio', jangada.navio?.nome || ''],
    ['Cliente', jangada.navio?.cliente?.nome || ''],
    ['Capacidade', jangada.capacidade],
    ['Data Fabrico', jangada.dataFabricacao.toLocaleDateString('pt-PT')],
    ['Idade (anos)', idadeAnos],
    ['Tipo Pack', jangada.tipoPackRef?.nome || ''],
    ['Marca', jangada.marca?.nome || ''],
    ['Modelo', jangada.modelo?.nome || ''],
    ['Obra (ID)', obra?.id || ''],
    ['Fatura (Número)', fatura?.numero || ''],
    ['Valor Fatura', fatura?.valor || ''],
    ['Status Fatura', fatura?.status || ''],
    ['Total Componentes', componentes.length],
    ['Total Movimentações', movimentacoes.length],
    ['Total Testes (estimado)', custoTestes],
  ];

  const componentesSheet = [
    ['Nome', 'Quantidade', 'Estado', 'Validade', 'Notas'],
    ...componentes.map((c) => [
      c.nome,
      c.quantidade,
      c.estado || '',
      c.validade ? new Date(c.validade).toLocaleDateString('pt-PT') : '',
      c.notas || '',
    ]),
  ];

  const testesSheet = [
    ['Teste', 'Custo', 'Norma', 'Obrigatório'],
    ...testes.map((t) => [t.nome, t.custo, t.norma, t.obrigatorio ? 'Sim' : 'Não']),
  ];

  const movimentacoesSheet = [
    ['Data', 'Stock ID', 'Tipo', 'Quantidade', 'Motivo'],
    ...movimentacoes.map((m) => [
      m.data ? new Date(m.data).toLocaleDateString('pt-PT') : '',
      m.stockId,
      m.tipo,
      m.quantidade,
      m.motivo,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), 'Resumo');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(componentesSheet), 'Componentes');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(testesSheet), 'Testes_SOLAS');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(movimentacoesSheet), 'Movimentacoes');

  const outDir = path.join(__dirname, '..', 'tmp', 'relatorios');
  fs.mkdirSync(outDir, { recursive: true });

  const fileName = `relatorio-acidente-${jangada.numeroSerie}-${Date.now()}.xlsx`;
  const filePath = path.join(outDir, fileName);

  XLSX.writeFile(wb, filePath);

  console.log('✅ Relatório Excel gerado:');
  console.log(filePath);
}

// Executar
(async () => {
  try {
    await gerarRelatorioXLSX();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

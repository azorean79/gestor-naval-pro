import { prisma } from '../src/lib/prisma';
import fs from 'fs';

async function gerarEspecificacoesPorMarcaModelo() {
  const jangadas = await prisma.jangada.findMany({
    include: {
      modelo: true,
      marca: true,
      inspecaoComponentes: true,
    },
  });

  const especificacoes: Record<string, any> = {};

  for (const jangada of jangadas) {
    const marca = jangada.marca?.nome || 'Desconhecida';
    const modelo = jangada.modelo?.nome || 'Desconhecido';
    const key = `${marca}::${modelo}`;
    if (!especificacoes[key]) {
      especificacoes[key] = {
        marca,
        modelo,
        capacidade: jangada.lotacao || jangada.capacidade || null,
        tipoPack: jangada.tipoPack || null,
        componentes: {},
      };
    }
    for (const comp of jangada.inspecaoComponentes) {
      especificacoes[key].componentes[comp.nome] = {
        quantidade: comp.quantidade,
        validade: comp.validade || null,
        tipo: comp.tipo || null,
        cilindroQuantidadeCO2: comp.cilindroQuantidadeCO2 || null,
        cilindroQuantidadeN2: comp.cilindroQuantidadeN2 || null,
      };
    }
  }

  fs.writeFileSync('especificacoes-importadas.json', JSON.stringify(especificacoes, null, 2), 'utf-8');
  console.log('Especificações por marca/modelo geradas em especificacoes-importadas.json');
}

gerarEspecificacoesPorMarcaModelo().catch(console.error);
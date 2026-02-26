import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '..', 'manuais', 'parts-extracted.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  const parts = parsed.parts || {};

  const survivaPns: string[] = [];
  for (const key of Object.keys(parts)) {
    const entry = (parts as any)[key];
    const occ: any[] = entry.occurrences || [];
    const matches = occ.some(o => /surviva/i.test(o.context || '') || /surviva/i.test(o.line || ''));
    if (matches) survivaPns.push(entry.partNumber);
  }

  console.log(`Found ${survivaPns.length} Surviva-related part numbers, inserting/updating...`);

  for (const pn of survivaPns) {
    const numeroReferencia = `PN-${pn}`;
    try {
      await prisma.itemStock.upsert({
        where: { numeroReferencia },
        update: {
          nome: `RFD Part ${pn}`,
          categoria: 'SOLAS/RFD',
          codigoFabricante: 'RFD',
          quantidadeAtual: 0,
        },
        create: {
          numeroReferencia,
          nome: `RFD Part ${pn}`,
          categoria: 'SOLAS/RFD',
          codigoFabricante: 'RFD',
          quantidadeAtual: 0,
        },
      });
    } catch (err) {
      console.error('Failed upsert for', pn, err);
    }
  }

  // Create three sample jangadas for RFD Surviva MK IV
  const sampleJangadas = [
    {
      numeroReferencia: 'JG-RFD-SURVIVA-001',
      numero: 'RFD-001',
      nome: 'Surviva MKIV Sample 1',
      proprietario: 'RFD',
      numeroSerie: 'SURVIVA-001',
    },
    {
      numeroReferencia: 'JG-RFD-SURVIVA-002',
      numero: 'RFD-002',
      nome: 'Surviva MKIV Sample 2',
      proprietario: 'RFD',
      numeroSerie: 'SURVIVA-002',
    },
    {
      numeroReferencia: 'JG-RFD-SURVIVA-003',
      numero: 'RFD-003',
      nome: 'Surviva MKIV Sample 3',
      proprietario: 'RFD',
      numeroSerie: 'SURVIVA-003',
    },
  ];

  const createdJangadas: { id: string; nome: string }[] = [];
  for (const j of sampleJangadas) {
    const res = await prisma.jangada.upsert({
      where: { numeroReferencia: j.numeroReferencia },
      update: { nome: j.nome, proprietario: j.proprietario, numeroSerie: j.numeroSerie },
      create: {
        numeroReferencia: j.numeroReferencia,
        numero: j.numero,
        nome: j.nome,
        proprietario: j.proprietario,
        numeroSerie: j.numeroSerie,
      },
    });
    createdJangadas.push({ id: res.id, nome: res.nome });
  }

  // Ensure we have a cliente to reference in inspeções
  let cliente = await prisma.cliente.findFirst();
  if (!cliente) {
    cliente = await prisma.cliente.create({
      data: {
        numeroReferencia: 'CLIENTE-SEED-RFD',
        nome: 'Cliente Seed RFD',
        nif: '999999990',
        email: 'seed-rfd@example.com',
        telefone: '000000000',
        tipo: 'empresa',
      },
    });
  }

  // Create an example inspeção for each sample jangada
  for (const j of createdJangadas) {
    try {
      await prisma.inspecao.create({
        data: {
          equipamentoId: j.id,
          equipamentoNome: j.nome,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
          tipoInspecao: 'rfd-surviva-sample',
          tecnico: 'Seed Script',
          dataInspecao: new Date(),
          status: 'concluido',
          checklist: JSON.stringify([]),
          observacoesGerais: 'Exemplo de inspeção criada pelo seed-manual-spares script',
        },
      });
    } catch (err) {
      console.error('Failed to create inspeção for jangada', j, err);
    }
  }

  console.log('Seed manual spares script completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

#!/usr/bin/env tsx
/**
 * Importa spare parts do manual RFD SURVIVA MkIII para a tabela Stock
 *
 * - Verifica por codigoFabricante: se já existir, ignora (não sobrescreve)
 * - Se não existir, cria novo registo com referencia = part_number
 * - Aplica: marca RFD, modelo Surviva MkIII
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SparePart {
  part_number: string;
  description: string;
  category: string;
  notes: string;
}

// Map manual category names to Portuguese category names used in the system
const CATEGORY_MAP: Record<string, string> = {
  'Iluminação': 'Iluminação',
  'Gás e Insuflação': 'Gás e Insuflação',
  'Equipamento de Bordo': 'Equipamento de Bordo',
  'Casco e Estrutura': 'Casco e Estrutura',
  'Sobrevivência': 'Sobrevivência',
  'Materiais de Reparação': 'Materiais de Reparação',
  'Etiquetas e Documentação': 'Etiquetas e Documentação',
  'Contentores e Embalagem': 'Contentores e Embalagem',
  'Ferramenta e Fixações': 'Ferramenta e Fixações',
};

async function main() {
  console.log('📦 Importar spare parts RFD SURVIVA MkIII...\n');

  const jsonPath = path.join(__dirname, 'mkiii_parts.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Ficheiro não encontrado: ${jsonPath}`);
    process.exit(1);
  }

  const parts: SparePart[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📖 ${parts.length} spare parts no ficheiro\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const part of parts) {
    try {
      // Check if already exists by codigoFabricante
      const existing = await prisma.stock.findFirst({
        where: { codigoFabricante: part.part_number },
        select: { id: true, referencia: true, descricao: true },
      });

      if (existing) {
        console.log(`⏭  Já existe (codigoFabricante=${part.part_number}): ${existing.referencia} — ${existing.descricao.substring(0, 60)}`);
        skipped++;
        continue;
      }

      // Also check by referencia (unique) to avoid conflicts
      const existingByRef = await prisma.stock.findUnique({
        where: { referencia: part.part_number },
        select: { id: true },
      });

      const referencia = existingByRef
        ? `RFD-MKIII-${part.part_number}`
        : part.part_number;

      const categoria = CATEGORY_MAP[part.category] ?? 'Jangada Surviva MkIII';

      await prisma.stock.create({
        data: {
          referencia,
          descricao: part.description,
          categoria,
          codigoFabricante: part.part_number,
          associavelJangada: true,
          aplicavelMarcaJangada: 'RFD',
          aplicavelModeloJangada: 'Surviva MkIII',
          precoVenda: 0.0,
          quantidade: 0,
          observacoes: part.notes || null,
        },
      });

      console.log(`✓ Inserido: ${part.part_number} — ${part.description.substring(0, 60)}`);
      inserted++;
    } catch (err: any) {
      errors++;
      console.error(`✗ Erro em ${part.part_number}: ${err.message}`);
    }
  }

  console.log('\n══════════════════════════════════════');
  console.log(`✅ Concluído!`);
  console.log(`   Novos inseridos: ${inserted}`);
  console.log(`   Já existiam (ignorados): ${skipped}`);
  console.log(`   Erros: ${errors}`);
  console.log(`   Total processados: ${parts.length}`);
  console.log('══════════════════════════════════════\n');

  // Summary by category
  if (inserted > 0) {
    console.log('Categorias inseridas:');
    const byCategory: Record<string, number> = {};
    for (const part of parts) {
      const cat = CATEGORY_MAP[part.category] ?? 'Jangada Surviva MkIII';
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${count} itens`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

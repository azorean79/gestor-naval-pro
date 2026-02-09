import { PrismaClient } from '../prisma/app/generated-prisma-client';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

interface Certificate {
  ficheiro: string;
  numero_certificado: string;
  marca_modelo: string;
  capacidade: number;
  numero_serie: string;
  data_fabrico: string | null;
  tipo_tela: string | null;
  comprimento_retenida: number | null;
  cilindro_serie: string | null;
  cilindro_co2: number | null;
  cilindro_n2: number | null;
  cilindro_teste_hidraulico: string | null;
  pack_tipo: string | null;
  pack_validade: string | null;
  navio_nome: string | null;
  armador: string | null;
  bandeira: string | null;
  data_inspecao: string | null;
  proxima_inspecao: string | null;
  componentes: Array<{
    componente: string;
    validade: string;
  }>;
  testes: string[];
}

interface BrandModel {
  brand: string;
  model: string;
}

function extractBrandModel(marcaModelo: string): BrandModel | null {
  if (!marcaModelo) return null;

  // Padrões conhecidos
  const patterns = [
    { regex: /^(RFD)\s+(.+)$/i, brand: 'RFD' },
    { regex: /^(DSB)\s+(.+)$/i, brand: 'DSB' },
    { regex: /^(VIKING)\s+(.+)$/i, brand: 'VIKING' },
    { regex: /^(EUROVINIL)\s+(.+)$/i, brand: 'EUROVINIL' },
    { regex: /^(EV)\s+(.+)$/i, brand: 'EUROVINIL' }, // EV é abreviação de EUROVINIL
    { regex: /^(ZODIAC)\s+(.+)$/i, brand: 'ZODIAC' },
    { regex: /^(LALIZAS)\s+(.+)$/i, brand: 'LALIZAS' },
    { regex: /^(PLASTIO)\s+(.+)$/i, brand: 'PLASTIO' },
    { regex: /^(ALMAR)\s+(.+)$/i, brand: 'ALMAR' },
    { regex: /^(ARIMAR)\s+(.+)$/i, brand: 'ARIMAR' },
  ];

  for (const pattern of patterns) {
    const match = marcaModelo.match(pattern.regex);
    if (match) {
      return {
        brand: pattern.brand,
        model: match[2].trim()
      };
    }
  }

  // Se não corresponder a nenhum padrão, tentar dividir pela primeira palavra
  const parts = marcaModelo.split(/\s+/, 2);
  if (parts.length === 2) {
    return {
      brand: parts[0].toUpperCase(),
      model: parts[1].trim()
    };
  }

  return {
    brand: marcaModelo,
    model: 'STANDARD'
  };
}

async function validateAndCreateBrandsModels() {
  console.log('\n' + '='.repeat(80));
  console.log('VALIDACAO E CRIACAO DE MARCAS E MODELOS');
  console.log('='.repeat(80) + '\n');

  // Ler ficheiro JSON (está na raiz do projeto, não na pasta scripts)
  const jsonPath = path.join(__dirname, '..', 'certificados-orey-2025-final.json');
  const data = fs.readFileSync(jsonPath, 'utf-8');
  const certificates: Certificate[] = JSON.parse(data);

  console.log(`Total de certificados: ${certificates.length}`);

  // Extrair marcas e modelos únicos
  const brandModelsSet = new Set<string>();
  const brandModelsMap = new Map<string, BrandModel>();

  for (const cert of certificates) {
    if (cert.marca_modelo) {
      const bm = extractBrandModel(cert.marca_modelo);
      if (bm) {
        const key = `${bm.brand}|${bm.model}`;
        brandModelsSet.add(key);
        brandModelsMap.set(key, bm);
      }
    }
  }

  console.log(`\nMarcas/Modelos unicos encontrados: ${brandModelsSet.size}\n`);

  // Verificar quais marcas já existem
  const existingBrands = await prisma.marcaJangada.findMany({
    select: { id: true, nome: true }
  });

  const existingBrandNames = new Set(existingBrands.map(b => b.nome.toUpperCase()));
  const brandMap = new Map(existingBrands.map(b => [b.nome.toUpperCase(), b.id]));

  console.log(`Marcas existentes na base de dados: ${existingBrands.length}`);
  existingBrands.forEach(b => console.log(`  - ${b.nome}`));

  // Criar marcas que não existem
  const uniqueBrands = new Set<string>();
  brandModelsMap.forEach(bm => uniqueBrands.add(bm.brand));

  const brandsToCreate: string[] = [];
  uniqueBrands.forEach(brand => {
    if (!existingBrandNames.has(brand)) {
      brandsToCreate.push(brand);
    }
  });

  console.log(`\nMarcas a criar: ${brandsToCreate.length}`);

  for (const brandName of brandsToCreate) {
    try {
      const newBrand = await prisma.marcaJangada.create({
        data: {
          nome: brandName
        }
      });
      brandMap.set(brandName, newBrand.id);
      console.log(`  [OK] Marca criada: ${brandName}`);
    } catch (error: any) {
      console.log(`  [ERRO] Falha ao criar marca ${brandName}: ${error.message}`);
    }
  }

  // Verificar quais modelos já existem
  const existingModels = await prisma.modeloJangada.findMany({
    include: {
      marca: true
    }
  });

  const existingModelKeys = new Set(
    existingModels.map(m => `${m.marca.nome.toUpperCase()}|${m.nome.toUpperCase()}`)
  );

  console.log(`\nModelos existentes na base de dados: ${existingModels.length}`);

  // Criar modelos que não existem
  const modelsToCreate: Array<{ brand: string; model: string }> = [];

  brandModelsMap.forEach((bm, key) => {
    const checkKey = `${bm.brand}|${bm.model.toUpperCase()}`;
    if (!existingModelKeys.has(checkKey)) {
      modelsToCreate.push(bm);
    }
  });

  console.log(`\nModelos a criar: ${modelsToCreate.length}`);

  for (const { brand, model } of modelsToCreate) {
    const marcaId = brandMap.get(brand);
    
    if (!marcaId) {
      console.log(`  [ERRO] Marca nao encontrada: ${brand}`);
      continue;
    }

    try {
      const newModel = await prisma.modeloJangada.create({
        data: {
          nome: model,
          marcaId: marcaId
        }
      });
      console.log(`  [OK] Modelo criado: ${brand} ${model}`);
    } catch (error: any) {
      console.log(`  [ERRO] Falha ao criar modelo ${brand} ${model}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESUMO');
  console.log('='.repeat(80));
  console.log(`Marcas criadas: ${brandsToCreate.length}`);
  console.log(`Modelos criados: ${modelsToCreate.length}`);
  console.log(`Total de marcas na BD: ${existingBrands.length + brandsToCreate.length}`);
  console.log(`Total de modelos na BD: ${existingModels.length + modelsToCreate.length}`);
}

async function main() {
  try {
    await validateAndCreateBrandsModels();
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Carregar .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

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

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

async function findOrCreateJangada(
  numeroSerie: string,
  marcaModelo: string,
  capacidade: number,
  dataFabricacao: Date | null,
  tipoPack: string | null
) {
  // Buscar jangada existente
  let jangada = await prisma.jangada.findUnique({
    where: { numeroSerie }
  });

  if (jangada) {
    return jangada;
  }

  // Jangada não existe, criar nova
  // Extrair marca e modelo
  let marcaId: string | null = null;
  let modeloId: string | null = null;

  if (marcaModelo) {
    const parts = marcaModelo.split(/\s+/);
    const marcaNome = parts[0];

    // Buscar marca
    const marca = await prisma.marcaJangada.findUnique({
      where: { nome: marcaNome }
    });

    if (marca) {
      marcaId = marca.id;

      // Buscar ou criar modelo
      let modelo = await prisma.modeloJangada.findFirst({
        where: {
          marcaId: marca.id,
          nome: marcaModelo
        }
      });

      if (!modelo) {
        // Criar modelo
        modelo = await prisma.modeloJangada.create({
          data: {
            nome: marcaModelo,
            marcaId: marca.id
          }
        });
      }

      modeloId = modelo.id;
    }
  }

  // Criar jangada
  try {
    jangada = await prisma.jangada.create({
      data: {
        numeroSerie,
        tipo: 'Inflavel',
        tipoPack: tipoPack || 'STANDARD',
        capacidade,
        dataFabricacao,
        marcaId,
        modeloId,
        status: 'ativo',
        estado: 'instalada',
        tecnico: 'Import OREY 2025'
      }
    });

    console.log(`  [CRIADA] Jangada: ${numeroSerie}`);
    return jangada;
  } catch (error: any) {
    console.log(`  [ERRO] Falha ao criar jangada ${numeroSerie}: ${error.message}`);
    return null;
  }
}

async function findOrCreateNavio(nomeNavio: string) {
  if (!nomeNavio || nomeNavio.trim() === '') return null;

  // Buscar navio com correspondência exata (case-insensitive) primeiro
  let navio = await prisma.navio.findFirst({
    where: {
      nome: {
        equals: nomeNavio.trim(),
        mode: 'insensitive'
      }
    }
  });

  // Se não encontrou com exatidão, buscar por correspondência parcial
  if (!navio) {
    navio = await prisma.navio.findFirst({
      where: {
        nome: {
          contains: nomeNavio.trim(),
          mode: 'insensitive'
        }
      }
    });
  }

  if (!navio) {
    // Criar navio
    try {
      navio = await prisma.navio.create({
        data: {
          nome: nomeNavio.trim(),
          tipo: 'Pesca',
          bandeira: 'Portugal',
          status: 'ativo',
          anoConstrucao: new Date().getFullYear()
        }
      });

      console.log(`  [CRIADO] Navio: ${nomeNavio}`);
    } catch (error: any) {
      console.log(`  [ERRO] Falha ao criar navio ${nomeNavio}: ${error.message}`);
      return null;
    }
  } else {
    console.log(`  [ENCONTRADO] Navio: ${navio.nome}`);
  }

  return navio;
}

async function importCertificates() {
  console.log('\n' + '='.repeat(80));
  console.log('IMPORTACAO DE CERTIFICADOS OREY 2025');
  console.log('='.repeat(80) + '\n');

  // Ler ficheiro JSON
  const jsonPath = path.join(__dirname, '..', 'certificados-orey-2025-final.json');
  const data = fs.readFileSync(jsonPath, 'utf-8');
  const certificates: Certificate[] = JSON.parse(data);

  console.log(`Total de certificados para importar: ${certificates.length}\n`);

  let importados = 0;
  let erros = 0;
  let ignorados = 0;

  for (const cert of certificates) {
    try {
      console.log(`\nProcessando: ${cert.numero_certificado} (${cert.navio_nome})`);

      // Parsear datas
      const dataInspecao = parseDate(cert.data_inspecao);
      const proximaInspecao = parseDate(cert.proxima_inspecao);
      const dataFabricacao = parseDate(cert.data_fabrico);
      const packValidade = parseDate(cert.pack_validade);

      // Se não tem próxima inspeção, usa hoje + 12 meses como padrão
      const dataValidade = proximaInspecao || 
        (packValidade) || 
        new Date(new Date().setFullYear(new Date().getFullYear() + 1));

      // Encontrar ou criar jangada
      const jangada = await findOrCreateJangada(
        cert.numero_serie,
        cert.marca_modelo,
        cert.capacidade || 0,
        dataFabricacao,
        cert.pack_tipo
      );

      if (!jangada) {
        console.log(`  [IGNORADO] Não foi possível criar/encontrar jangada`);
        ignorados++;
        continue;
      }

      // Atualizar jangada com dados de inspeção
      await prisma.jangada.update({
        where: { id: jangada.id },
        data: {
          dataInspecao: dataInspecao || new Date(),
          dataProximaInspecao: proximaInspecao || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          dataFabricacao: dataFabricacao || undefined,
          tipoPack: cert.pack_tipo || undefined
        }
      });

      // Encontrar ou criar navio
      let navioId: string | null = null;
      if (cert.navio_nome) {
        const navio = await findOrCreateNavio(cert.navio_nome);
        if (navio) {
          navioId = navio.id;
        }
      }

      // Verificar se certificado já existe
          const certExistente = await prisma.certificado.findUnique({
            where: { numero: cert.numero_certificado }
          });

          if (certExistente) {
            console.log(`  [IGNORADO] Certificado já existe para número: ${cert.numero_certificado}`);
            ignorados++;
            continue;
          }

      // Criar certificado
      const certificado = await prisma.certificado.create({
        data: {
          tipo: 'Re-inspeção',
          numero: cert.numero_certificado,
          dataEmissao: dataInspecao || new Date(),
          dataValidade: dataValidade,
          entidadeEmissora: 'OREY DIGITAL',
          status: dataValidade > new Date() ? 'ativo' : 'expirado',
          jangadaId: jangada.id,
          navioId: navioId || undefined
        }
      });

      console.log(`  [OK] Certificado importado: ${certificado.numero}`);
      importados++;
    } catch (error: any) {
      console.log(`  [ERRO] ${error.message}`);
      erros++;
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('RESUMO DA IMPORTACAO');
  console.log(`${'='.repeat(80)}`);
  console.log(`Certificados importados: ${importados}`);
  console.log(`Certificados ignorados: ${ignorados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Total processado: ${importados + ignorados + erros}/${certificates.length}`);
}

async function main() {
  try {
    await importCertificates();
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

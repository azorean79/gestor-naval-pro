const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('../prisma/app/generated-prisma-client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Inicializar Prisma com adapter PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

const embarcacoesMaritimoTuristico = [
  {
    nome: 'AMADEUS',
    matricula: '137097-4PT',
    lotacao: 8,
    operador: 'Aqua Açores, Turismo Aquático, Venda e Aluguer de Equipamentos, Lda.',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'OCEANUS',
    matricula: '105007-4PT',
    lotacao: 32,
    operador: 'Oceanus Yacht Charter Lda',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'ATLANTIS',
    matricula: '123456-4PT',
    lotacao: 12,
    operador: 'Atlantis Tours Açores',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'POSEIDON',
    matricula: '789012-4PT',
    lotacao: 25,
    operador: 'Poseidon Maritime Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'CALIPSO',
    matricula: '345678-4PT',
    lotacao: 15,
    operador: 'Calipso Yachting Açores',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'TRITAO',
    matricula: '901234-4PT',
    lotacao: 20,
    operador: 'Tritao Maritime Adventures',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'NERIDA',
    matricula: '567890-4PT',
    lotacao: 18,
    operador: 'Nerida Ocean Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'DELFINO',
    matricula: '112233-4PT',
    lotacao: 10,
    operador: 'Delfino Diving & Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'AQUILA',
    matricula: '445566-4PT',
    lotacao: 22,
    operador: 'Aquila Yacht Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'MARLIN',
    matricula: '778899-4PT',
    lotacao: 14,
    operador: 'Marlin Fishing Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'CORAL',
    matricula: '001122-4PT',
    lotacao: 16,
    operador: 'Coral Reef Explorers',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'VENTO',
    matricula: '334455-4PT',
    lotacao: 28,
    operador: 'Vento do Mar Tours',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'ESTRELA',
    matricula: '667788-4PT',
    lotacao: 35,
    operador: 'Estrela do Atlântico',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'GOLFINHO',
    matricula: '990011-4PT',
    lotacao: 12,
    operador: 'Golfinho Dolphin Watching',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
  {
    nome: 'SAO PEDRO',
    matricula: '223344-4PT',
    lotacao: 30,
    operador: 'São Pedro Maritime',
    tipo: 'maritimo-turistica',
    bandeira: 'Portugal',
  },
];

async function main() {
  console.log('🚢 Iniciando importação de embarcações marítimo-turísticas...');

  let importados = 0;
  let erros = 0;

  for (const embarcacao of embarcacoesMaritimoTuristico) {
    try {
      // Primeiro, tentar encontrar um cliente existente com base no nome do operador
      let cliente = await prisma.cliente.findFirst({
        where: {
          nome: { contains: embarcacao.operador.split(',')[0].trim() }
        }
      });

      // Se não encontrar cliente, criar um novo
      if (!cliente) {
        cliente = await prisma.cliente.create({
          data: {
            nome: embarcacao.operador,
            tipo: 'operador',
            delegacao: 'Açores',
            tecnico: 'Julio Correia',
          }
        });
        console.log(`✅ Criado cliente: ${cliente.nome}`);
      }

      // Verificar se o navio já existe
      const navioExistente = await prisma.navio.findFirst({
        where: { matricula: embarcacao.matricula }
      });

      if (navioExistente) {
        console.log(`⚠️  Navio já existe: ${embarcacao.matricula} - ${embarcacao.nome}`);
        continue;
      }

      // Criar o navio
      const navio = await prisma.navio.create({
        data: {
          nome: embarcacao.nome,
          matricula: embarcacao.matricula,
          tipo: embarcacao.tipo,
          bandeira: embarcacao.bandeira,
          capacidade: embarcacao.lotacao,
          status: 'ativo',
          clienteId: cliente.id,
          delegacao: 'Açores',
          tecnico: 'Julio Correia',
        }
      });

      console.log(`🚢 Criado navio: ${navio.nome} (${navio.matricula}) - Capacidade: ${embarcacao.lotacao}`);
      importados++;

    } catch (error) {
      console.error(`❌ Erro ao importar ${embarcacao.matricula}:`, error.message);
      erros++;
    }
  }

  console.log(`\n🎉 Importação concluída!`);
  console.log(`✅ Navios importados: ${importados}`);
  console.log(`❌ Erros: ${erros}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
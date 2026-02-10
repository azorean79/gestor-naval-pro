import 'dotenv/config'
import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

console.log('Using PostgreSQL Adapter for Simple Seed')

const connectionString = process.env.DIRECT_DATABASE_URL || "postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_983921VKKN1b6-rok5EQe@db.prisma.io:5432/postgres?sslmode=require&pool=true"

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
})
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed simples da base de dados...')

  try {
    // Criar clientes sequencialmente
    console.log('Criando cliente 1...')
    const cliente1 = await prisma.cliente.upsert({
      where: { email: 'maritima@azores.pt' },
      update: {},
      create: {
        nome: 'Marítima Açoreana',
        email: 'maritima@azores.pt',
        telefone: '+351 296 123 456',
        endereco: 'Rua do Porto, 123, Ponta Delgada',
        nif: '500123456',
        tipo: 'armador',
      },
    })
    console.log('✅ Cliente 1 criado:', cliente1.nome)

    console.log('Criando cliente 2...')
    const cliente2 = await prisma.cliente.upsert({
      where: { email: 'pescamadeira@mail.pt' },
      update: {},
      create: {
        nome: 'Pescas da Madeira Lda',
        email: 'pescamadeira@mail.pt',
        telefone: '+351 291 123 456',
        endereco: 'Rua do Comércio, 456, Funchal',
        nif: '500234567',
        tipo: 'cliente',
      },
    })
    console.log('✅ Cliente 2 criado:', cliente2.nome)

    // Criar navios
    console.log('Criando navios...')
    const navio1 = await prisma.navio.create({
      data: {
        nome: 'Atlântico',
        imo: 'IMO1234567',
        mmsi: '232123456',
        matricula: 'PT-ATL-001',
          // arqueacaoBruta: 1500, // removido
          // arqueacaoLiquida: 1200, // removido
        comprimento: 45.5,
        // boca removido: não existe na tabela
        calado: 4.5,
        tipo: 'pesqueiro',
        clienteId: cliente1.id,
      },
    })
    console.log('✅ Navio 1 criado:', navio1.nome)

    const navio2 = await prisma.navio.create({
      data: {
        nome: 'Madeira Express',
        imo: 'IMO2345678',
        mmsi: '232234567',
        matricula: 'PT-MAD-002',
          // arqueacaoBruta: 800, // removido
          // arqueacaoLiquida: 650, // removido
        comprimento: 32.0,
        // boca removido: não existe na tabela
        calado: 3.2,
        tipo: 'passageiro',
        clienteId: cliente2.id,
      },
    })
    console.log('✅ Navio 2 criado:', navio2.nome)

    const navio3 = await prisma.navio.create({
      data: {
        nome: 'Costa Verde',
        imo: 'IMO3456789',
        mmsi: '232345678',
        matricula: 'PT-COS-003',
          // arqueacaoBruta: 2200, // removido
          // arqueacaoLiquida: 1800, // removido
        comprimento: 55.0,
        // boca removido: não existe na tabela
        calado: 5.0,
        tipo: 'carga',
        clienteId: cliente1.id,
      },
    })
    console.log('✅ Navio 3 criado:', navio3.nome)

    // Criar marcas de jangadas
    console.log('Criando marcas...')
      // const marca1 = await prisma.marca.create({ data: { nome: 'Viking Life-Saving Equipment', codigo: 'VK', pais: 'Noruega', contato: 'viking@lifesaving.no', status: 'ativo' } })
      // const marca2 = await prisma.marca.create({ data: { nome: 'RFD Beaufort Ltd', codigo: 'RFD', pais: 'Reino Unido', contato: 'info@rfd-beaufort.com', status: 'ativo' } })
      // const marca3 = await prisma.marca.create({ data: { nome: 'Seasafe Marine Ltd', codigo: 'SV', pais: 'Reino Unido', contato: 'sales@seasafe.co.uk', status: 'ativo' } })

    // Criar lotações
    console.log('Criando lotações...')
      // const lotacao1 = await prisma.lotacao.create({ data: { capacidade: 6, tipo: 'pessoas', descricao: '6 pessoas', status: 'ativo' } })
      // const lotacao2 = await prisma.lotacao.create({ data: { capacidade: 10, tipo: 'pessoas', descricao: '10 pessoas', status: 'ativo' } })
      // const lotacao3 = await prisma.lotacao.create({ data: { capacidade: 12, tipo: 'pessoas', descricao: '12 pessoas', status: 'ativo' } })
      // const lotacao4 = await prisma.lotacao.create({ data: { capacidade: 15, tipo: 'pessoas', descricao: '15 pessoas', status: 'ativo' } })

    // Criar jangadas
    console.log('Criando jangadas...')
    const jangada1 = await prisma.jangada.create({
      data: {
        numeroSerie: 'VK-6P-2024-001',
        tipo: 'inflável',
        // marcaId: marca1.id, // removido: marca1 não existe
        // lotacaoId: lotacao1.id, // removido: lotacao1 não existe
        status: 'ativo',
        estado: 'instalada',
        navioId: navio1.id,
        clienteId: cliente1.id,
        dataFabricacao: new Date('2024-01-15'),
        dataInspecao: new Date('2024-06-10'),
        dataProximaInspecao: new Date('2025-06-10'),
        tecnico: 'Julio Correia',
      },
    })
    console.log('✅ Jangada 1 criada:', jangada1.numeroSerie)

    const jangada2 = await prisma.jangada.create({
      data: {
        numeroSerie: 'RFD-10P-2023-045',
        tipo: 'inflável',
        // marcaId: marca2.id, // removido: marca2 não existe
        // lotacaoId: lotacao2.id, // removido: lotacao2 não existe
        status: 'ativo',
        estado: 'instalada',
        navioId: navio1.id,
        clienteId: cliente1.id,
        dataFabricacao: new Date('2023-05-20'),
        dataInspecao: new Date('2024-05-15'),
        dataProximaInspecao: new Date('2025-05-15'),
        tecnico: 'Julio Correia',
      },
    })
    console.log('✅ Jangada 2 criada:', jangada2.numeroSerie)

    const jangada3 = await prisma.jangada.create({
      data: {
        numeroSerie: 'SV-12P-2024-012',
        tipo: 'semi-rígida',
        // marcaId: marca3.id, // removido: marca3 não existe
        // lotacaoId: lotacao3.id, // removido: lotacao3 não existe
        status: 'ativo',
        estado: 'instalada',
        navioId: navio2.id,
        clienteId: cliente2.id,
        dataFabricacao: new Date('2024-03-10'),
        dataInspecao: new Date('2024-08-01'),
        dataProximaInspecao: new Date('2025-08-01'),
        tecnico: 'Julio Correia',
      },
    })
    console.log('✅ Jangada 3 criada:', jangada3.numeroSerie)

    console.log('🎉 Seed concluído com sucesso!')

  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
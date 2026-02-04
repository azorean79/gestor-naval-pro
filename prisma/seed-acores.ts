import 'dotenv/config'
import { PrismaClient } from '../prisma/app/generated-prisma-client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Configurar variáveis de ambiente
process.env.DATABASE_URL = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

// Inicializar Prisma com adapter PG
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seeding completo dos Açores...')

  // ========== ARMADORES ==========
  console.log('⚓ Criando Armadores dos Açores...')
  const armadores = [
    {
      nome: 'Atlânticoline',
      email: 'geral@atlanticoline.pt',
      telefone: '+351 296 283 001',
      nif: '502442320',
      tipo: 'armador',
      endereco: 'Rua Vasco da Gama, Ponta Delgada',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    },
    {
      nome: 'Transmaçor',
      email: 'geral@transmacor.pt',
      telefone: '+351 295 212 111',
      nif: '512156783',
      tipo: 'armador',
      endereco: 'Angra do Heroísmo, Terceira',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    },
    {
      nome: 'Transinsular',
      email: 'info@transinsular.pt',
      telefone: '+351 296 301 234',
      nif: '502987654',
      tipo: 'armador',
      endereco: 'Ponta Delgada, São Miguel',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    },
    {
      nome: 'Grupo Bensaude',
      email: 'geral@bensaude.pt',
      telefone: '+351 296 307 000',
      nif: '500144322',
      tipo: 'armador',
      endereco: 'Ponta Delgada, São Miguel',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    }
  ]

  for (const armador of armadores) {
    await prisma.cliente.upsert({
      where: { email: armador.email },
      update: armador,
      create: armador
    })
  }

  // ========== OPERADORES MARÍTIMO TURÍSTICOS ==========
  console.log('🐋 Criando Operadores Marítimo Turísticos...')
  const operadoresMaritimos = [
    // São Miguel
    { nome: 'Futurismo Azores Adventures', email: 'info@futurismo.pt', telefone: '+351 296 628 522', nif: '504123789', ilha: 'São Miguel' },
    { nome: 'Picos de Aventura', email: 'info@picosdeaventura.com', telefone: '+351 296 286 229', nif: '505234890', ilha: 'São Miguel' },
    { nome: 'Terra Azul', email: 'info@terraazul.pt', telefone: '+351 296 302 889', nif: '506345901', ilha: 'São Miguel' },
    { nome: 'Azores Whale Watching', email: 'info@azoreswhales.com', telefone: '+351 296 481 189', nif: '507456012', ilha: 'São Miguel' },
    { nome: 'Moby Dick Tours', email: 'info@mobydick.pt', telefone: '+351 296 284 999', nif: '508567123', ilha: 'São Miguel' },
    
    // Terceira
    { nome: 'Nautilus Diving & Whale Watching', email: 'info@nautilus-diving.com', telefone: '+351 295 216 700', nif: '509678234', ilha: 'Terceira' },
    { nome: 'Ocean Emotion Azores', email: 'info@oceanemotion.pt', telefone: '+351 295 218 200', nif: '510789345', ilha: 'Terceira' },
    
    // Pico
    { nome: 'Espaço Talassa', email: 'info@espacotalassa.com', telefone: '+351 292 623 000', nif: '511890456', ilha: 'Pico' },
    { nome: 'CW Azores', email: 'info@cwazores.com', telefone: '+351 292 623 611', nif: '512901567', ilha: 'Pico' },
    { nome: 'Aqua Açores', email: 'info@aquaacores.com', telefone: '+351 292 642 700', nif: '513012678', ilha: 'Pico' },
    
    // Faial
    { nome: 'Norberto Diver', email: 'info@norbertodiver.com', telefone: '+351 292 293 891', nif: '514123789', ilha: 'Faial' },
    { nome: 'Horta Diving', email: 'info@hortadiving.com', telefone: '+351 292 392 600', nif: '515234890', ilha: 'Faial' },
    
    // São Jorge
    { nome: 'Azores Nature Tours', email: 'info@azoresnaturetours.com', telefone: '+351 295 416 660', nif: '516345901', ilha: 'São Jorge' },
    
    // Santa Maria
    { nome: 'Santa Maria Diving', email: 'info@santamariadiving.com', telefone: '+351 296 882 400', nif: '517456012', ilha: 'Santa Maria' },
    
    // Flores
    { nome: 'West Coast Tours', email: 'info@westcoast.pt', telefone: '+351 292 592 500', nif: '518567123', ilha: 'Flores' }
  ]

  for (const operador of operadoresMaritimos) {
    await prisma.cliente.upsert({
      where: { email: operador.email },
      update: {
        tipo: 'operador',
        endereco: `${operador.ilha}, Açores`,
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      },
      create: {
        nome: operador.nome,
        email: operador.email,
        telefone: operador.telefone,
        nif: operador.nif,
        tipo: 'operador',
        endereco: `${operador.ilha}, Açores`,
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      }
    })
  }

  // ========== EMBARCAÇÕES DE PESCA POR ILHA ==========
  console.log('🎣 Criando Embarcações de Pesca por Ilha...')
  
  const embarcacoesPesca = [
    // São Miguel - Ponta Delgada
    { nome: 'Bom Jesus I', tipo: 'Embarcação de Pesca', matricula: 'PDL-001-2020', ilha: 'São Miguel', porto: 'Ponta Delgada' },
    { nome: 'São Pedro II', tipo: 'Embarcação de Pesca', matricula: 'PDL-002-2019', ilha: 'São Miguel', porto: 'Ponta Delgada' },
    { nome: 'Santa Maria III', tipo: 'Embarcação de Pesca', matricula: 'PDL-003-2021', ilha: 'São Miguel', porto: 'Ponta Delgada' },
    { nome: 'Atlântico IV', tipo: 'Embarcação de Pesca', matricula: 'PDL-004-2018', ilha: 'São Miguel', porto: 'Ponta Delgada' },
    
    // São Miguel - Rabo de Peixe
    { nome: 'Mar Azul I', tipo: 'Embarcação de Pesca', matricula: 'RPX-001-2020', ilha: 'São Miguel', porto: 'Rabo de Peixe' },
    { nome: 'Pescador II', tipo: 'Embarcação de Pesca', matricula: 'RPX-002-2019', ilha: 'São Miguel', porto: 'Rabo de Peixe' },
    { nome: 'Oceano III', tipo: 'Embarcação de Pesca', matricula: 'RPX-003-2021', ilha: 'São Miguel', porto: 'Rabo de Peixe' },
    
    // São Miguel - Porto Formoso
    { nome: 'Formoso I', tipo: 'Embarcação de Pesca', matricula: 'PFM-001-2020', ilha: 'São Miguel', porto: 'Porto Formoso' },
    { nome: 'Nordeste II', tipo: 'Embarcação de Pesca', matricula: 'PFM-002-2019', ilha: 'São Miguel', porto: 'Porto Formoso' },
    
    // São Miguel - Povoação
    { nome: 'Povoense I', tipo: 'Embarcação de Pesca', matricula: 'POV-001-2020', ilha: 'São Miguel', porto: 'Povoação' },
    { nome: 'São José II', tipo: 'Embarcação de Pesca', matricula: 'POV-002-2021', ilha: 'São Miguel', porto: 'Povoação' },
    
    // Terceira
    { nome: 'Terceirense I', tipo: 'Embarcação de Pesca', matricula: 'ANG-001-2020', ilha: 'Terceira', porto: 'Angra do Heroísmo' },
    { nome: 'Santo António II', tipo: 'Embarcação de Pesca', matricula: 'ANG-002-2019', ilha: 'Terceira', porto: 'Angra do Heroísmo' },
    { nome: 'Praia III', tipo: 'Embarcação de Pesca', matricula: 'PVT-001-2021', ilha: 'Terceira', porto: 'Praia da Vitória' },
    { nome: 'Vitória IV', tipo: 'Embarcação de Pesca', matricula: 'PVT-002-2020', ilha: 'Terceira', porto: 'Praia da Vitória' },
    
    // Faial
    { nome: 'Horta I', tipo: 'Embarcação de Pesca', matricula: 'HRT-001-2020', ilha: 'Faial', porto: 'Horta' },
    { nome: 'Faialense II', tipo: 'Embarcação de Pesca', matricula: 'HRT-002-2019', ilha: 'Faial', porto: 'Horta' },
    { nome: 'Caldeira III', tipo: 'Embarcação de Pesca', matricula: 'HRT-003-2021', ilha: 'Faial', porto: 'Horta' },
    
    // Pico
    { nome: 'Baleeiro I', tipo: 'Embarcação de Pesca', matricula: 'MDL-001-2020', ilha: 'Pico', porto: 'Madalena' },
    { nome: 'Pico II', tipo: 'Embarcação de Pesca', matricula: 'MDL-002-2019', ilha: 'Pico', porto: 'Madalena' },
    { nome: 'São Roque I', tipo: 'Embarcação de Pesca', matricula: 'SRP-001-2020', ilha: 'Pico', porto: 'São Roque do Pico' },
    { nome: 'Lajes I', tipo: 'Embarcação de Pesca', matricula: 'LJP-001-2021', ilha: 'Pico', porto: 'Lajes do Pico' },
    
    // São Jorge
    { nome: 'Jorgense I', tipo: 'Embarcação de Pesca', matricula: 'VLS-001-2020', ilha: 'São Jorge', porto: 'Velas' },
    { nome: 'Fajã II', tipo: 'Embarcação de Pesca', matricula: 'VLS-002-2019', ilha: 'São Jorge', porto: 'Velas' },
    { nome: 'Calheta I', tipo: 'Embarcação de Pesca', matricula: 'CLH-001-2020', ilha: 'São Jorge', porto: 'Calheta' },
    
    // Graciosa
    { nome: 'Graciosense I', tipo: 'Embarcação de Pesca', matricula: 'GRC-001-2020', ilha: 'Graciosa', porto: 'Santa Cruz da Graciosa' },
    { nome: 'Caldeirinha II', tipo: 'Embarcação de Pesca', matricula: 'GRC-002-2019', ilha: 'Graciosa', porto: 'Santa Cruz da Graciosa' },
    
    // Flores
    { nome: 'Florense I', tipo: 'Embarcação de Pesca', matricula: 'FLR-001-2020', ilha: 'Flores', porto: 'Santa Cruz das Flores' },
    { nome: 'Ocidental II', tipo: 'Embarcação de Pesca', matricula: 'FLR-002-2019', ilha: 'Flores', porto: 'Santa Cruz das Flores' },
    { nome: 'Lajes I', tipo: 'Embarcação de Pesca', matricula: 'LJF-001-2020', ilha: 'Flores', porto: 'Lajes das Flores' },
    
    // Corvo
    { nome: 'Corvense I', tipo: 'Embarcação de Pesca', matricula: 'CRV-001-2020', ilha: 'Corvo', porto: 'Corvo' },
    { nome: 'Atlântico II', tipo: 'Embarcação de Pesca', matricula: 'CRV-002-2019', ilha: 'Corvo', porto: 'Corvo' },
    
    // Santa Maria
    { nome: 'Gonçalo Velho I', tipo: 'Embarcação de Pesca', matricula: 'VPT-001-2020', ilha: 'Santa Maria', porto: 'Vila do Porto' },
    { nome: 'Oriental II', tipo: 'Embarcação de Pesca', matricula: 'VPT-002-2019', ilha: 'Santa Maria', porto: 'Vila do Porto' },
    { nome: 'São João III', tipo: 'Embarcação de Pesca', matricula: 'VPT-003-2021', ilha: 'Santa Maria', porto: 'Vila do Porto' }
  ]

  const clientePesca = await prisma.cliente.findFirst({ where: { tipo: 'armador' } })

  for (const embarcacao of embarcacoesPesca) {
    await prisma.navio.create({
      data: {
        nome: embarcacao.nome,
        tipo: embarcacao.tipo,
        matricula: embarcacao.matricula,
        ilha: embarcacao.ilha,
        bandeira: 'Portugal',
        comprimento: 8 + Math.random() * 7, // 8-15 metros
        largura: 2.5 + Math.random() * 1.5, // 2.5-4 metros
        capacidade: 2 + Math.floor(Math.random() * 4), // 2-5 pessoas
        anoConstrucao: 2015 + Math.floor(Math.random() * 10),
        status: 'ativo',
        clienteId: clientePesca?.id,
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      }
    })
  }

  // ========== EMBARCAÇÕES MARÍTIMO TURÍSTICAS ==========
  console.log('🛥️ Criando Embarcações Marítimo Turísticas...')
  
  const embarcacoesTuristicas = [
    // São Miguel
    { nome: 'Ocean Explorer', tipo: 'Embarcação Turística', matricula: 'PDL-T-001', ilha: 'São Miguel', operador: 'Futurismo Azores Adventures', capacidade: 12 },
    { nome: 'Whale Watcher I', tipo: 'Embarcação Turística', matricula: 'PDL-T-002', ilha: 'São Miguel', operador: 'Terra Azul', capacidade: 15 },
    { nome: 'Adventure II', tipo: 'Embarcação Turística', matricula: 'PDL-T-003', ilha: 'São Miguel', operador: 'Picos de Aventura', capacidade: 10 },
    { nome: 'Atlantic Dream', tipo: 'Embarcação Turística', matricula: 'PDL-T-004', ilha: 'São Miguel', operador: 'Azores Whale Watching', capacidade: 18 },
    { nome: 'Moby I', tipo: 'Embarcação Turística', matricula: 'PDL-T-005', ilha: 'São Miguel', operador: 'Moby Dick Tours', capacidade: 12 },
    
    // Terceira
    { nome: 'Nautilus Explorer', tipo: 'Embarcação Turística', matricula: 'ANG-T-001', ilha: 'Terceira', operador: 'Nautilus Diving', capacidade: 14 },
    { nome: 'Ocean Emotion I', tipo: 'Embarcação Turística', matricula: 'ANG-T-002', ilha: 'Terceira', operador: 'Ocean Emotion Azores', capacidade: 16 },
    
    // Pico
    { nome: 'Talassa I', tipo: 'Embarcação Turística', matricula: 'MDL-T-001', ilha: 'Pico', operador: 'Espaço Talassa', capacidade: 12 },
    { nome: 'CW Explorer', tipo: 'Embarcação Turística', matricula: 'MDL-T-002', ilha: 'Pico', operador: 'CW Azores', capacidade: 15 },
    { nome: 'Aqua I', tipo: 'Embarcação Turística', matricula: 'MDL-T-003', ilha: 'Pico', operador: 'Aqua Açores', capacidade: 10 },
    
    // Faial
    { nome: 'Norberto I', tipo: 'Embarcação Turística', matricula: 'HRT-T-001', ilha: 'Faial', operador: 'Norberto Diver', capacidade: 12 },
    { nome: 'Horta Explorer', tipo: 'Embarcação Turística', matricula: 'HRT-T-002', ilha: 'Faial', operador: 'Horta Diving', capacidade: 14 },
    
    // São Jorge
    { nome: 'Nature Tours I', tipo: 'Embarcação Turística', matricula: 'VLS-T-001', ilha: 'São Jorge', operador: 'Azores Nature Tours', capacidade: 10 },
    
    // Santa Maria
    { nome: 'Santa Maria Diver', tipo: 'Embarcação Turística', matricula: 'VPT-T-001', ilha: 'Santa Maria', operador: 'Santa Maria Diving', capacidade: 12 },
    
    // Flores
    { nome: 'West Coast I', tipo: 'Embarcação Turística', matricula: 'FLR-T-001', ilha: 'Flores', operador: 'West Coast Tours', capacidade: 14 }
  ]

  for (const embarcacao of embarcacoesTuristicas) {
    const operador = await prisma.cliente.findFirst({
      where: { nome: embarcacao.operador }
    })

    await prisma.navio.create({
      data: {
        nome: embarcacao.nome,
        tipo: embarcacao.tipo,
        matricula: embarcacao.matricula,
        ilha: embarcacao.ilha,
        bandeira: 'Portugal',
        comprimento: 10 + Math.random() * 5, // 10-15 metros
        largura: 3 + Math.random() * 1.5, // 3-4.5 metros
        capacidade: embarcacao.capacidade,
        anoConstrucao: 2015 + Math.floor(Math.random() * 10),
        status: 'ativo',
        clienteId: operador?.id,
        delegacao: 'Açores',
        tecnico: 'Julio Correia'
      }
    })
  }

  console.log('✅ Seeding completo dos Açores concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

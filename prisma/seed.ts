import { prisma } from '../src/lib/prisma'
import { EXEMPLOS_JANGADAS } from '../src/lib/exemplos-jangadas'

async function main() {
  console.log('🌱 Iniciando seeding da base de dados...')

  // Criar clientes de exemplo
  const clientes = [
    {
      nome: 'Transportes Açores',
      email: 'contacto@transportesacores.pt',
      telefone: '+351 296 123 456',
      endereco: 'Rua da Marina, 123, Ponta Delgada, Açores',
      nif: '123456789',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    },
    {
      nome: 'Naviera Açor',
      email: 'operacoes@naviera-acor.pt',
      telefone: '+351 295 987 654',
      endereco: 'Avenida do Porto, 456, Angra do Heroísmo, Açores',
      nif: '987654321',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    },
    {
      nome: 'Atlantic Lines',
      email: 'fleet@atlantic-lines.pt',
      telefone: '+351 291 555 123',
      endereco: 'Zona Industrial, Horta, Açores',
      nif: '555666777',
      delegacao: 'Açores',
      tecnico: 'Julio Correia'
    }
  ]

  console.log('📝 Criando clientes...')
  for (const cliente of clientes) {
    await prisma.cliente.upsert({
      where: { email: cliente.email },
      update: {},
      create: cliente
    })
  }

  // Buscar clientes criados
  const clientesCriados = await prisma.cliente.findMany()

  // Criar navios de exemplo
  const navios = [
    {
      nome: 'Santa Maria Express',
      tipo: 'Ferry de Passageiros',
      matricula: 'PT-SME-001',
      bandeira: 'Portugal',
      comprimento: 120.5,
      largura: 20.3,
      calado: 4.2,
      capacidade: 800,
      anoConstrucao: 2018,
      status: 'ativo',
      dataInspecao: new Date('2024-01-15'),
      dataProximaInspecao: new Date('2025-01-15'),
      clienteId: clientesCriados[0].id,
      delegacao: 'Açores'
    },
    {
      nome: 'Terceira Star',
      tipo: 'Navio de Carga',
      matricula: 'PT-TS-002',
      bandeira: 'Portugal',
      comprimento: 85.7,
      largura: 15.2,
      calado: 3.8,
      capacidade: 1200,
      anoConstrucao: 2015,
      status: 'ativo',
      dataInspecao: new Date('2024-02-20'),
      dataProximaInspecao: new Date('2025-02-20'),
      clienteId: clientesCriados[1].id,
      delegacao: 'Açores'
    },
    {
      nome: 'Flores Voyager',
      tipo: 'Ferry Misto',
      matricula: 'PT-FV-003',
      bandeira: 'Portugal',
      comprimento: 95.3,
      largura: 18.1,
      calado: 4.0,
      capacidade: 450,
      anoConstrucao: 2020,
      status: 'ativo',
      dataInspecao: new Date('2024-03-10'),
      dataProximaInspecao: new Date('2025-03-10'),
      clienteId: clientesCriados[2].id,
      delegacao: 'Açores'
    }
  ]

  console.log('🚢 Criando navios...')
  for (const navio of navios) {
    await prisma.navio.create({
      data: navio
    })
  }

  // Buscar navios criados
  const naviosCriados = await prisma.navio.findMany()

  // Criar jangadas usando os exemplos
  console.log('🛟 Criando jangadas...')
  for (let i = 0; i < Math.min(EXEMPLOS_JANGADAS.length, 10); i++) {
    const exemplo = EXEMPLOS_JANGADAS[i]
    const clienteAleatorio = clientesCriados[Math.floor(Math.random() * clientesCriados.length)]
    const navioAleatorio = naviosCriados[Math.floor(Math.random() * naviosCriados.length)]

    const statusPossiveis = ['Instalada', 'Em Inspeção', 'Aguardando Inspeção', 'Em Manutenção', 'Defeituosa']
    const status = statusPossiveis[Math.floor(Math.random() * statusPossiveis.length)]

    await prisma.jangada.upsert({
      where: { numeroSerie: exemplo.numeroSerie },
      update: {},
      create: {
        numeroSerie: exemplo.numeroSerie,
        tipo: exemplo.tipo,
        tipoPack: exemplo.tipoPack,
        dataInspecao: new Date(),
        dataProximaInspecao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        status: status,
        estado: status === 'Instalada' ? 'instalada' : 'removida',
        clienteId: clienteAleatorio.id,
        navioId: navioAleatorio.id,
        tecnico: 'Julio Correia'
      }
    })
  }

  // Criar tipos de packs de equipamento de jangada
  console.log('📋 Criando tipos de packs...')
  const tiposPack = [
    { nome: 'E', descricao: 'Pack Standard Europeu' },
    { nome: 'ORC', descricao: 'Pack ORC (Offshore Racing Council)' },
    { nome: 'STD', descricao: 'Pack Standard Completo' },
    { nome: 'STD1', descricao: 'Pack Standard 1' },
    { nome: 'STD UK', descricao: 'Pack Standard UK' },
    { nome: 'STD AR', descricao: 'Pack Standard Argentina' },
    { nome: 'STD IT', descricao: 'Pack Standard Itália' },
    { nome: 'STD OR', descricao: 'Pack Standard Orange' },
    { nome: 'STD ER', descricao: 'Pack Standard ER' },
    { nome: 'ISO 9650 ESP', descricao: 'Pack ISO 9650 Espanha' },
    { nome: 'ISO 9650-1', descricao: 'Pack ISO 9650-1' },
    { nome: 'ISO 9650-2', descricao: 'Pack ISO 9650-2' }
  ]

  for (const tipoPack of tiposPack) {
    await prisma.tipoPack.upsert({
      where: { nome: tipoPack.nome },
      update: {},
      create: tipoPack
    })
  }

  // Criar todos os itens de stock completos com items de cada pack
  console.log('📦 Criando itens de stock por pack...')
  const itensStock = [
    // Item 1: Anel de borracha cilindrada flutuante de 30m
    {
      nome: 'Anel de borracha cilindrada flutuante 30m',
      descricao: 'Anel de borracha cilindrada flutuante de 30m',
      categoria: 'Cabos e Cordas',
      quantidade: 50,
      quantidadeMinima: 5,
      precoUnitario: 280.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 2: Âncora (flutuante)
    {
      nome: 'Âncora flutuante',
      descricao: 'Âncora flutuante para jangada',
      categoria: 'Âncoras',
      quantidade: 80,
      quantidadeMinima: 10,
      precoUnitario: 95.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 3: Saco de flutuação
    {
      nome: 'Saco de flutuação',
      descricao: 'Saco de flutuação para emergência',
      categoria: 'Flutuação',
      quantidade: 100,
      quantidadeMinima: 20,
      precoUnitario: 75.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 4: Esponjas
    {
      nome: 'Esponjas',
      descricao: 'Esponjas absorventes para limpeza',
      categoria: 'Consumíveis',
      quantidade: 150,
      quantidadeMinima: 30,
      precoUnitario: 12.50,
      fornecedor: 'Bristles Inc',
      localizacao: 'Armazém Consumíveis',
      status: 'ativo'
    },
    // Item 5: Água fluorada
    {
      nome: 'Água fluorada destilada',
      descricao: 'Água destilada fluorada 0.5L',
      categoria: 'Viveres',
      quantidade: 200,
      quantidadeMinima: 40,
      precoUnitario: 6.50,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    // Item 6: Remos flutuantes
    {
      nome: 'Remos flutuantes',
      descricao: 'Remos dobrável com flutuação integrada',
      categoria: 'Remos',
      quantidade: 120,
      quantidadeMinima: 15,
      precoUnitario: 85.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 7: Velas de sinalização
    {
      nome: 'Velas de sinalização laranja',
      descricao: 'Velas laranja para sinalização 1.5m x 1.5m',
      categoria: 'Velas Sinalização',
      quantidade: 200,
      quantidadeMinima: 30,
      precoUnitario: 95.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 8: Foguetes de sinalização vermelha
    {
      nome: 'Foguetes de sinalização vermelha',
      descricao: 'Foguetes luminosos vermelhos para sinalização',
      categoria: 'Comunicações',
      quantidade: 300,
      quantidadeMinima: 50,
      precoUnitario: 22.00,
      fornecedor: 'Pains Wessex',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 9: Kit de pesca
    {
      nome: 'Kit de pesca de sobrevivência',
      descricao: 'Kit completo pesca com anzol, linha, etc',
      categoria: 'Sobrevivência',
      quantidade: 75,
      quantidadeMinima: 10,
      precoUnitario: 25.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 10: Fachos de sinalização
    {
      nome: 'Fachos de sinalização',
      descricao: 'Fachos de fumo para sinalização',
      categoria: 'Comunicações',
      quantidade: 180,
      quantidadeMinima: 30,
      precoUnitario: 18.50,
      fornecedor: 'Pains Wessex',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 11: Refletor de radar
    {
      nome: 'Refletor de radar',
      descricao: 'Refletor de radar para sinalização',
      categoria: 'Comunicações',
      quantidade: 90,
      quantidadeMinima: 15,
      precoUnitario: 120.00,
      fornecedor: 'Jotron',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 12: Refletor de radar com responsador
    {
      nome: 'Refletor de radar com responsador',
      descricao: 'Refletor com responsador SART integrado',
      categoria: 'Comunicações',
      quantidade: 45,
      quantidadeMinima: 8,
      precoUnitario: 4500.00,
      fornecedor: 'Jotron',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 13: Kit de reparação
    {
      nome: 'Kit de reparação balsa',
      descricao: 'Kit completo de reparação para balsas',
      categoria: 'Kits Reparação',
      quantidade: 120,
      quantidadeMinima: 15,
      precoUnitario: 350.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 14: Água (por pessoa)
    {
      nome: 'Água destilada 0.3L por pessoa',
      descricao: 'Água destilada 0.3L para suplemento',
      categoria: 'Viveres',
      quantidade: 500,
      quantidadeMinima: 100,
      precoUnitario: 4.50,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    // Item 15: Alimento (concentrado)
    {
      nome: 'Alimento concentrado',
      descricao: 'Ração de emergência concentrada',
      categoria: 'Viveres',
      quantidade: 400,
      quantidadeMinima: 80,
      precoUnitario: 12.50,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    // Item 16: Saco para lixo
    {
      nome: 'Saco para lixo',
      descricao: 'Saco para lixo impermeável',
      categoria: 'Consumíveis',
      quantidade: 200,
      quantidadeMinima: 40,
      precoUnitario: 1.50,
      fornecedor: 'Rexite',
      localizacao: 'Armazém Consumíveis',
      status: 'ativo'
    },
    // Item 17: Espelho de sinais
    {
      nome: 'Espelho de sinais solar',
      descricao: 'Espelho de sinais para sinalização solar',
      categoria: 'Comunicações',
      quantidade: 150,
      quantidadeMinima: 25,
      precoUnitario: 15.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 18: Agulha Termómetro (por lixação)
    {
      nome: 'Agulha termómetro de lixação',
      descricao: 'Agulha com termómetro para lixação',
      categoria: 'Sobrevivência',
      quantidade: 60,
      quantidadeMinima: 10,
      precoUnitario: 18.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 19: Bomba ou Fole
    {
      nome: 'Bomba ou fole manual',
      descricao: 'Bomba manual ou fole para inflação',
      categoria: 'Ferramentas',
      quantidade: 100,
      quantidadeMinima: 15,
      precoUnitario: 95.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 20: Maçarico (por pessoa)
    {
      nome: 'Maçarico por pessoa',
      descricao: 'Maçarico para sobrevivência 500g',
      categoria: 'Viveres',
      quantidade: 250,
      quantidadeMinima: 50,
      precoUnitario: 8.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    // Item 21: Instruções sobre medidas urgentes
    {
      nome: 'Instruções medidas urgentes',
      descricao: 'Instruções waterproof sobre medidas urgentes',
      categoria: 'Documentação',
      quantidade: 300,
      quantidadeMinima: 50,
      precoUnitario: 2.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Documentação',
      status: 'ativo'
    },
    // Item 22: Cilindro CO2
    {
      nome: 'Cilindro CO2 inflação',
      descricao: 'Cilindro de gás CO2 para inflação rápida',
      categoria: 'Cilindros Gás',
      quantidade: 200,
      quantidadeMinima: 30,
      precoUnitario: 450.00,
      fornecedor: 'Carburos Metálicos',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 23: Coletes salva-vidas
    {
      nome: 'Coletes salva-vidas SOLAS',
      descricao: 'Colete salva-vidas aprovado SOLAS',
      categoria: 'Coletes',
      quantidade: 500,
      quantidadeMinima: 100,
      precoUnitario: 85.00,
      fornecedor: 'Secumar',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    // Item 24: EPIRB
    {
      nome: 'EPIRB (Baliza Pessoal)',
      descricao: 'EPIRB - Baliza Pessoal de Emergência',
      categoria: 'EPIRBs',
      quantidade: 45,
      quantidadeMinima: 8,
      precoUnitario: 3500.00,
      fornecedor: 'McMurdo',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 25: Atalho elétrico pessoal
    {
      nome: 'Atalho elétrico pessoal',
      descricao: 'Atalho pessoal com conexão elétrica',
      categoria: 'Segurança',
      quantidade: 80,
      quantidadeMinima: 15,
      precoUnitario: 125.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 26: Estojo de medicamentos
    {
      nome: 'Estojo de medicamentos SOLAS',
      descricao: 'Estojo completo de medicamentos SOLAS',
      categoria: 'Médico',
      quantidade: 60,
      quantidadeMinima: 10,
      precoUnitario: 450.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Médico',
      status: 'ativo'
    },
    // Item 27: Saco antiemético
    {
      nome: 'Saco antiemético',
      descricao: 'Saco impermeável para enjoo',
      categoria: 'Médico',
      quantidade: 100,
      quantidadeMinima: 20,
      precoUnitario: 3.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Médico',
      status: 'ativo'
    },
    // Item 28: Instruções sobre medidas urgentes e lixação
    {
      nome: 'Instruções lixação e medidas urgentes',
      descricao: 'Instruções waterproof lixação e medidas urgentes',
      categoria: 'Documentação',
      quantidade: 200,
      quantidadeMinima: 40,
      precoUnitario: 2.50,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Documentação',
      status: 'ativo'
    },
    // Item 29: Bomba ou Fole (alternativa)
    {
      nome: 'Fole dobrável inflação',
      descricao: 'Fole dobrável para inflação manual',
      categoria: 'Ferramentas',
      quantidade: 90,
      quantidadeMinima: 15,
      precoUnitario: 85.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    // Item 30: Heligrafo
    {
      nome: 'Heligrafo de sinais',
      descricao: 'Heligrafo refletor para sinais solares',
      categoria: 'Comunicações',
      quantidade: 70,
      quantidadeMinima: 12,
      precoUnitario: 28.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },

    // Balsas Salva-Vidas
    {
      nome: 'ZODIAC-TO-SR-25',
      descricao: 'Balsa Salva-Vidas Zodiac TO SR 25P',
      categoria: 'Balsas',
      quantidade: 10,
      quantidadeMinima: 2,
      precoUnitario: 25000.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'VIKING-20P-SOLAS',
      descricao: 'Balsa Salva-Vidas Viking 20P SOLAS A',
      categoria: 'Balsas',
      quantidade: 8,
      quantidadeMinima: 1,
      precoUnitario: 22000.00,
      fornecedor: 'Viking Life-Saving Equipment',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'DAVIT-LOWERING-SYSTEM',
      descricao: 'Sistema de Descida Davit para Balsas',
      categoria: 'Sistemas Descida',
      quantidade: 4,
      quantidadeMinima: 1,
      precoUnitario: 15000.00,
      fornecedor: 'Wärtsilä',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    
    // Cilindros de Gás
    {
      nome: 'CILINDRO-GAS-CO2-45KG',
      descricao: 'Cilindro de Gás CO2 45kg para Inflação Rápida',
      categoria: 'Cilindros Gás',
      quantidade: 25,
      quantidadeMinima: 5,
      precoUnitario: 450.00,
      fornecedor: 'Carburos Metálicos',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'CILINDRO-GAS-NITRO-32KG',
      descricao: 'Cilindro de Gás Nitrogénio 32kg para Manutenção',
      categoria: 'Cilindros Gás',
      quantidade: 15,
      quantidadeMinima: 3,
      precoUnitario: 320.00,
      fornecedor: 'Air Liquide',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },

    // Válvulas de Inflação
    {
      nome: 'VALVULA-SOLENOID-AUTOMATICA',
      descricao: 'Válvula Solenoide Automática para Inflação',
      categoria: 'Válvulas',
      quantidade: 20,
      quantidadeMinima: 5,
      precoUnitario: 280.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'VALVULA-PRESSAO-REGULADORA',
      descricao: 'Válvula Reguladora de Pressão',
      categoria: 'Válvulas',
      quantidade: 18,
      quantidadeMinima: 4,
      precoUnitario: 180.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'VALVULA-ESCAPE-PRESSAO',
      descricao: 'Válvula de Escape de Pressão de Segurança',
      categoria: 'Válvulas',
      quantidade: 16,
      quantidadeMinima: 4,
      precoUnitario: 150.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },

    // Velas de Sinalização
    {
      nome: 'VELA-SINAL-LARANJA-GRANDE',
      descricao: 'Vela de Sinalização Laranja Grande (1.5m x 1.5m)',
      categoria: 'Velas Sinalização',
      quantidade: 30,
      quantidadeMinima: 5,
      precoUnitario: 95.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'VELA-SINAL-LARANJA-MEDIA',
      descricao: 'Vela de Sinalização Laranja Média (1.0m x 1.0m)',
      categoria: 'Velas Sinalização',
      quantidade: 25,
      quantidadeMinima: 5,
      precoUnitario: 65.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'REFLETOR-SINAL-NOTURNO',
      descricao: 'Refletor Espelho para Sinalização Noturna',
      categoria: 'Velas Sinalização',
      quantidade: 40,
      quantidadeMinima: 10,
      precoUnitario: 120.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },

    // Remos e Propulsão
    {
      nome: 'REMO-ALUMINIO-2.5M',
      descricao: 'Remo Dobrável Alumínio 2.5m',
      categoria: 'Remos',
      quantidade: 35,
      quantidadeMinima: 5,
      precoUnitario: 85.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'REMO-ALUMINIO-1.8M',
      descricao: 'Remo Dobrável Alumínio 1.8m',
      categoria: 'Remos',
      quantidade: 28,
      quantidadeMinima: 5,
      precoUnitario: 75.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'MOTOR-ELETRICO-PROPULSAO',
      descricao: 'Motor Elétrico de Propulsão para Balsas',
      categoria: 'Propulsão',
      quantidade: 8,
      quantidadeMinima: 1,
      precoUnitario: 2500.00,
      fornecedor: 'Minn Kota',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },

    // Âncoras
    {
      nome: 'ANCORA-MARINHA-15KG',
      descricao: 'Âncora Marinha Tipo Danforth 15kg',
      categoria: 'Âncoras',
      quantidade: 22,
      quantidadeMinima: 3,
      precoUnitario: 180.00,
      fornecedor: 'Lewmar',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'ANCORA-DROGUE-CACA',
      descricao: 'Âncora Flutuante/Drogue para Caça',
      categoria: 'Âncoras',
      quantidade: 18,
      quantidadeMinima: 3,
      precoUnitario: 95.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'CORDA-ANCORA-POLYESTER-100M',
      descricao: 'Corda Poliéster para Âncora 100m x 12mm',
      categoria: 'Âncoras',
      quantidade: 12,
      quantidadeMinima: 2,
      precoUnitario: 250.00,
      fornecedor: 'Samson Rope',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },

    // Kits e Reparação
    {
      nome: 'KIT-REPARACAO-BALSA',
      descricao: 'Kit Completo de Reparação para Balsas',
      categoria: 'Kits Reparação',
      quantidade: 15,
      quantidadeMinima: 3,
      precoUnitario: 350.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'KIT-REPARACAO-COSTURAS',
      descricao: 'Kit Reparação de Costuras e Vedação',
      categoria: 'Kits Reparação',
      quantidade: 20,
      quantidadeMinima: 4,
      precoUnitario: 120.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'ADESIVO-TECIDO-IMPERMEAVEL',
      descricao: 'Adesivo Tecido Impermeável Bicomponente',
      categoria: 'Kits Reparação',
      quantidade: 30,
      quantidadeMinima: 5,
      precoUnitario: 35.00,
      fornecedor: 'Bostik',
      localizacao: 'Armazém Consumíveis',
      status: 'ativo'
    },

    // Equipamentos de Segurança Individual
    {
      nome: 'COLETE-SALVA-VIDAS-ADULTO',
      descricao: 'Colete Salva-Vidas Adulto SOLAS Aprovado',
      categoria: 'Coletes',
      quantidade: 100,
      quantidadeMinima: 20,
      precoUnitario: 85.00,
      fornecedor: 'Secumar',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'COLETE-SALVA-VIDAS-INFANTIL',
      descricao: 'Colete Salva-Vidas Infantil SOLAS Aprovado',
      categoria: 'Coletes',
      quantidade: 50,
      quantidadeMinima: 10,
      precoUnitario: 65.00,
      fornecedor: 'Secumar',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'BALIZA-PESSOAL-EPIRB',
      descricao: 'EPIRB - Baliza Pessoal de Emergência',
      categoria: 'EPIRBs',
      quantidade: 12,
      quantidadeMinima: 3,
      precoUnitario: 3500.00,
      fornecedor: 'McMurdo',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },

    // Viveres e Médico
    {
      nome: 'RACAO-EMERGENCIA-24H',
      descricao: 'Ração de Emergência 24h (500kcal)',
      categoria: 'Viveres',
      quantidade: 200,
      quantidadeMinima: 40,
      precoUnitario: 12.50,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    {
      nome: 'AGUA-DOCE-DESTILADA-1.5L',
      descricao: 'Água Doce Destilada em Lata 1.5L',
      categoria: 'Viveres',
      quantidade: 150,
      quantidadeMinima: 30,
      precoUnitario: 8.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Alimentar',
      status: 'ativo'
    },
    {
      nome: 'ESTOJO-MEDICAMENTOS-SOLAS',
      descricao: 'Estojo de Medicamentos SOLAS Completo',
      categoria: 'Médico',
      quantidade: 10,
      quantidadeMinima: 2,
      precoUnitario: 450.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Médico',
      status: 'ativo'
    },
    {
      nome: 'KIT-PRIMEIROS-SOCORROS',
      descricao: 'Kit Primeiros Socorros Marinhos Completo',
      categoria: 'Médico',
      quantidade: 15,
      quantidadeMinima: 3,
      precoUnitario: 180.00,
      fornecedor: 'Survitec',
      localizacao: 'Armazém Médico',
      status: 'ativo'
    },

    // Comunicações
    {
      nome: 'RADIOBALIZA-SART',
      descricao: 'SART - Radar Transponder de Busca e Salvamento',
      categoria: 'Comunicações',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 4500.00,
      fornecedor: 'Jotron',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'FOGUETE-SINALIZACAO-VERMELHA',
      descricao: 'Foguete de Sinalização Luminosa Vermelha',
      categoria: 'Comunicações',
      quantidade: 60,
      quantidadeMinima: 10,
      precoUnitario: 22.00,
      fornecedor: 'Pains Wessex',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },
    {
      nome: 'ESPELHO-SINAIS-SOLAR',
      descricao: 'Espelho de Sinais Solar para Sinalização',
      categoria: 'Comunicações',
      quantidade: 25,
      quantidadeMinima: 5,
      precoUnitario: 15.00,
      fornecedor: 'Switlik',
      localizacao: 'Armazém Secundário',
      status: 'ativo'
    },

    // Ferramentas e Manutenção
    {
      nome: 'BOMBA-AR-MANUAL-DUPLA',
      descricao: 'Bomba de Ar Manual Dupla para Inflação',
      categoria: 'Ferramentas',
      quantidade: 20,
      quantidadeMinima: 4,
      precoUnitario: 95.00,
      fornecedor: 'Zodiac Maritime',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'BOMBA-ELETRICA-12V',
      descricao: 'Bomba Elétrica 12V para Inflação',
      categoria: 'Ferramentas',
      quantidade: 10,
      quantidadeMinima: 2,
      precoUnitario: 280.00,
      fornecedor: 'Flojet',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'MANOMETRO-DIGITAL-PRESSAO',
      descricao: 'Manómetro Digital para Medição de Pressão',
      categoria: 'Ferramentas',
      quantidade: 12,
      quantidadeMinima: 2,
      precoUnitario: 120.00,
      fornecedor: 'Fluke',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'KIT-FERRAMENTAS-INSPECAO',
      descricao: 'Kit Ferramentas de Inspeção Marítima',
      categoria: 'Ferramentas',
      quantidade: 8,
      quantidadeMinima: 2,
      precoUnitario: 650.00,
      fornecedor: 'Bahco',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    },
    {
      nome: 'FITIS-REPARACAO-MLTIPLOS',
      descricao: 'Fitis/Fitas de Reparação Múltiplos Tipos',
      categoria: 'Consumíveis',
      quantidade: 50,
      quantidadeMinima: 10,
      precoUnitario: 8.50,
      fornecedor: '3M',
      localizacao: 'Armazém Consumíveis',
      status: 'ativo'
    },
    {
      nome: 'CORDA-RESGATE-POLIPROPILENO-50M',
      descricao: 'Corda de Resgate Polipropileno 50m x 8mm',
      categoria: 'Consumíveis',
      quantidade: 30,
      quantidadeMinima: 5,
      precoUnitario: 45.00,
      fornecedor: 'Samson Rope',
      localizacao: 'Armazém Principal',
      status: 'ativo'
    }
  ]

  let contadorStock = 0
  for (const item of itensStock) {
    await prisma.stock.upsert({
      where: {
        nome_categoria: {
          nome: item.nome,
          categoria: item.categoria
        }
      },
      update: {
        quantidade: item.quantidade,
        quantidadeMinima: item.quantidadeMinima,
        status: item.status
      },
      create: item
    })
    contadorStock++
  }

  // Criar envios de exemplo
  console.log('📦 Criando envios de exemplo...')

  // Buscar alguns itens de stock e jangadas para os envios
  const stockHAMMAR = await prisma.stock.findFirst({
    where: { nome: { contains: 'HAMMAR' } }
  })

  const stockBalsa = await prisma.stock.findFirst({
    where: { categoria: 'Flutuação' }
  })

  const jangadaDisponivel = await prisma.jangada.findFirst({
    where: { status: 'ativo' },
    include: { modelo: true }
  })

  const enviosExemplo = [
    {
      numeroRastreio: 'CTT123456789PT',
      tipo: 'stock',
      metodoEnvio: 'correio',
      transportadora: 'CTT',
      status: 'entregue',
      destinatarioNome: 'Transportes Açores',
      destinatarioEmail: 'contacto@transportesacores.pt',
      destinatarioTelefone: '+351 296 123 456',
      enderecoEntrega: 'Rua da Marina, 123, Ponta Delgada, Açores',
      custoEnvio: 15.50,
      observacoes: 'Envio urgente de HAMMAR H20 para cliente',
      responsavel: 'Julio Correia',
      dataEnvio: new Date('2024-01-15'),
      dataEntregaReal: new Date('2024-01-17'),
      itens: stockHAMMAR ? [{
        tipoItem: 'stock',
        itemId: stockHAMMAR.id,
        quantidade: 2,
        descricao: 'HAMMAR H20 - Hydrostatic Release Unit'
      }] : []
    },
    {
      numeroRastreio: 'DHL987654321PT',
      tipo: 'stock',
      metodoEnvio: 'transitario',
      transportadora: 'DHL Express',
      status: 'em_transito',
      destinatarioNome: 'Naviera Açor',
      destinatarioEmail: 'operacoes@naviera-acor.pt',
      destinatarioTelefone: '+351 295 987 654',
      enderecoEntrega: 'Avenida do Porto, 456, Angra do Heroísmo, Açores',
      custoEnvio: 25.00,
      observacoes: 'Envio de material de flutuação para manutenção',
      responsavel: 'Julio Correia',
      dataEnvio: new Date('2024-01-20'),
      dataEntregaEstimada: new Date('2024-01-22'),
      itens: stockBalsa ? [{
        tipoItem: 'stock',
        itemId: stockBalsa.id,
        quantidade: 1,
        descricao: 'Material de flutuação para balsa salva-vidas'
      }] : []
    },
    {
      numeroRastreio: null,
      tipo: 'jangada',
      metodoEnvio: 'cliente_retira',
      transportadora: null,
      status: 'preparando',
      destinatarioNome: 'Atlantic Lines',
      destinatarioEmail: 'fleet@atlantic-lines.pt',
      destinatarioTelefone: '+351 291 555 123',
      enderecoEntrega: 'Zona Industrial, Horta, Açores',
      custoEnvio: 0.00,
      observacoes: 'Cliente irá retirar jangada na estação de serviço',
      responsavel: 'Julio Correia',
      itens: jangadaDisponivel ? [{
        tipoItem: 'jangada',
        itemId: jangadaDisponivel.id,
        quantidade: 1,
        descricao: `${jangadaDisponivel.modelo?.nome || 'Jangada'} - ${jangadaDisponivel.numeroSerie}`
      }] : []
    }
  ]

  for (const envio of enviosExemplo) {
    if (envio.itens.length > 0) {
      await prisma.envio.create({
        data: {
          numeroRastreio: envio.numeroRastreio,
          tipo: envio.tipo,
          metodoEnvio: envio.metodoEnvio,
          transportadora: envio.transportadora,
          status: envio.status,
          destinatarioNome: envio.destinatarioNome,
          destinatarioEmail: envio.destinatarioEmail,
          destinatarioTelefone: envio.destinatarioTelefone,
          enderecoEntrega: envio.enderecoEntrega,
          custoEnvio: envio.custoEnvio,
          observacoes: envio.observacoes,
          responsavel: envio.responsavel,
          dataEnvio: envio.dataEnvio,
          dataEntregaEstimada: envio.dataEntregaEstimada,
          dataEntregaReal: envio.dataEntregaReal,
          itens: {
            create: envio.itens.map(item => ({
              tipoItem: item.tipoItem,
              stockId: item.tipoItem === 'stock' ? item.itemId : undefined,
              jangadaId: item.tipoItem === 'jangada' ? item.itemId : undefined,
              quantidade: item.quantidade,
              descricao: item.descricao
            }))
          }
        }
      })
    }
  }

  console.log('✅ Seeding concluído com sucesso!')
  console.log(`📊 Dados criados:`)
  console.log(`   - ${clientes.length} clientes`)
  console.log(`   - ${navios.length} navios`)
  console.log(`   - ${Math.min(EXEMPLOS_JANGADAS.length, 10)} jangadas`)
  console.log(`   - ${tiposPack.length} tipos de packs`)
  console.log(`   - ${contadorStock} itens de stock`)
  console.log(`\n📦 Tipos de Packs Disponíveis:`)
  tiposPack.forEach(p => console.log(`   - ${p.nome}: ${p.descricao}`))
  console.log(`\n📦 Categorias de Stock:`)
  console.log(`   - Cabos e Cordas`)
  console.log(`   - Âncoras`)
  console.log(`   - Flutuação`)
  console.log(`   - Consumíveis`)
  console.log(`   - Viveres`)
  console.log(`   - Remos`)
  console.log(`   - Velas Sinalização`)
  console.log(`   - Comunicações`)
  console.log(`   - Sobrevivência`)
  console.log(`   - Kits Reparação`)
  console.log(`   - Documentação`)
  console.log(`   - Cilindros Gás`)
  console.log(`   - Coletes`)
  console.log(`   - EPIRBs`)
  console.log(`   - Médico`)
  console.log(`   - Segurança`)
  console.log(`   - Ferramentas`)
  console.log(`   - Balsas`)
  console.log(`   - Sistemas Descida`)
  console.log(`   - Válvulas`)
  console.log(`   - Propulsão`)
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
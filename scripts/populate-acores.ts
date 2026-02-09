import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🌱 Iniciando população de dados dos Açores...')

  try {
    // ========== ARMADORES ==========
    console.log('\n⚓ Criando Armadores dos Açores...')
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
    console.log(`✅ ${armadores.length} armadores criados`)

    // ========== OPERADORES MARÍTIMO TURÍSTICOS ==========
    console.log('\n🐋 Criando Operadores Marítimo Turísticos...')
    const operadoresMaritimos = [
      { nome: 'Futurismo Azores Adventures', email: 'info@futurismo.pt', telefone: '+351 296 628 522', nif: '504123789', ilha: 'São Miguel' },
      { nome: 'Picos de Aventura', email: 'info@picosdeaventura.com', telefone: '+351 296 286 229', nif: '505234890', ilha: 'São Miguel' },
      { nome: 'Terra Azul', email: 'info@terraazul.pt', telefone: '+351 296 302 889', nif: '506345901', ilha: 'São Miguel' },
      { nome: 'Azores Whale Watching', email: 'info@azoreswhales.com', telefone: '+351 296 481 189', nif: '507456012', ilha: 'São Miguel' },
      { nome: 'Moby Dick Tours', email: 'info@mobydick.pt', telefone: '+351 296 284 999', nif: '508567123', ilha: 'São Miguel' },
      { nome: 'Nautilus Diving & Whale Watching', email: 'info@nautilus-diving.com', telefone: '+351 295 216 700', nif: '509678234', ilha: 'Terceira' },
      { nome: 'Ocean Emotion Azores', email: 'info@oceanemotion.pt', telefone: '+351 295 218 200', nif: '510789345', ilha: 'Terceira' },
      { nome: 'Espaço Talassa', email: 'info@espacotalassa.com', telefone: '+351 292 623 000', nif: '511890456', ilha: 'Pico' },
      { nome: 'CW Azores', email: 'info@cwazores.com', telefone: '+351 292 623 611', nif: '512901567', ilha: 'Pico' },
      { nome: 'Aqua Açores', email: 'info@aquaacores.com', telefone: '+351 292 642 700', nif: '513012678', ilha: 'Pico' },
      { nome: 'Norberto Diver', email: 'info@norbertodiver.com', telefone: '+351 292 293 891', nif: '514123789', ilha: 'Faial' },
      { nome: 'Horta Diving', email: 'info@hortadiving.com', telefone: '+351 292 392 600', nif: '515234890', ilha: 'Faial' },
      { nome: 'Azores Nature Tours', email: 'info@azoresnaturetours.com', telefone: '+351 295 416 660', nif: '516345901', ilha: 'São Jorge' },
      { nome: 'Santa Maria Diving', email: 'info@santamariadiving.com', telefone: '+351 296 882 400', nif: '517456012', ilha: 'Santa Maria' },
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
    console.log(`✅ ${operadoresMaritimos.length} operadores turísticos criados`)

    // ========== EMBARCAÇÕES DE PESCA ==========
    console.log('\n🎣 Criando Embarcações de Pesca...')
    const embarcacoesPesca = [
      { nome: 'Bom Jesus I', matricula: 'PDL-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'São Pedro II', matricula: 'PDL-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Santa Maria III', matricula: 'PDL-003-2021', tipo: 'pesca', anos: 2024 },
      { nome: 'Atlântico IV', matricula: 'PDL-004-2018', tipo: 'pesca', anos: 2024 },
      { nome: 'Mar Azul I', matricula: 'RPX-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'Pescador II', matricula: 'RPX-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Oceano III', matricula: 'RPX-003-2021', tipo: 'pesca', anos: 2024 },
      { nome: 'Formoso I', matricula: 'PFM-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'Nordeste II', matricula: 'PFM-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Povoense I', matricula: 'POV-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'São José II', matricula: 'POV-002-2021', tipo: 'pesca', anos: 2024 },
      { nome: 'Terceirense I', matricula: 'ANG-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'Santo António II', matricula: 'ANG-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Praia da Vitória I', matricula: 'PDV-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'Costela da Boca II', matricula: 'CDB-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Graciosa I', matricula: 'GRC-001-2021', tipo: 'pesca', anos: 2024 },
      { nome: 'Pico Bravo I', matricula: 'PCB-001-2020', tipo: 'pesca', anos: 2024 },
      { nome: 'Faial Star II', matricula: 'FLS-002-2019', tipo: 'pesca', anos: 2024 },
      { nome: 'Velha Azul I', matricula: 'VZL-001-2018', tipo: 'pesca', anos: 2024 },
      { nome: 'Mar Bravo II', matricula: 'MBR-002-2020', tipo: 'pesca', anos: 2024 }
    ]

    // Obter clientes armadores para associar as embarcações
    const clientesArmadores = await prisma.cliente.findMany({
      where: { tipo: 'armador' }
    })

    let contador = 0
    for (const embarcacao of embarcacoesPesca) {
      const clienteAleatorio = clientesArmadores[contador % clientesArmadores.length]
      await prisma.navio.create({
        data: {
          nome: embarcacao.nome,
          tipo: embarcacao.tipo,
          matricula: embarcacao.matricula,
          bandeira: 'Portugal',
          comprimento: 25 + Math.random() * 30,
          largura: 8 + Math.random() * 8,
          calado: 2 + Math.random() * 3,
          capacidade: 50 + Math.floor(Math.random() * 150),
          anoConstrucao: embarcacao.anos - 5 + Math.floor(Math.random() * 8),
          status: Math.random() > 0.2 ? 'ativo' : 'manutencao',
          dataInspecao: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          dataProximaInspecao: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          clienteId: clienteAleatorio.id,
          delegacao: 'Açores',
          tecnico: 'Julio Correia'
        }
      })
      contador++
    }
    console.log(`✅ ${embarcacoesPesca.length} embarcações de pesca criadas`)

    // ========== EMBARCAÇÕES DE TURISMO MARÍTIMO ==========
    console.log('\n🌊 Criando Embarcações de Turismo Marítimo...')
    const embarcacoesTurismo = [
      { nome: 'Whale Watcher I', matricula: 'WW-001-2020', operador: 'Futurismo Azores Adventures' },
      { nome: 'Dolphin Explorer', matricula: 'DX-002-2019', operador: 'Terra Azul' },
      { nome: 'Ocean Cruiser', matricula: 'OC-003-2021', operador: 'Picos de Aventura' },
      { nome: 'Adventure Quest', matricula: 'AQ-004-2018', operador: 'Azores Whale Watching' },
      { nome: 'Nautilus One', matricula: 'NT-005-2020', operador: 'Nautilus Diving & Whale Watching' },
      { nome: 'Dive Master', matricula: 'DM-006-2019', operador: 'Ocean Emotion Azores' },
      { nome: 'Talassa Explorer', matricula: 'TE-007-2021', operador: 'Espaço Talassa' },
      { nome: 'Blue Waters', matricula: 'BW-008-2020', operador: 'CW Azores' },
      { nome: 'Aqua Adventure', matricula: 'AA-009-2019', operador: 'Aqua Açores' },
      { nome: 'Diver Paradise', matricula: 'DP-010-2022', operador: 'Norberto Diver' },
      { nome: 'Horta Explorer', matricula: 'HE-011-2020', operador: 'Horta Diving' },
      { nome: 'Nature Discovery', matricula: 'ND-012-2021', operador: 'Azores Nature Tours' },
      { nome: 'Island Hopper', matricula: 'IH-013-2019', operador: 'Santa Maria Diving' },
      { nome: 'West Explorer', matricula: 'WE-014-2020', operador: 'West Coast Tours' },
      { nome: 'Moby Quest', matricula: 'MQ-015-2021', operador: 'Moby Dick Tours' }
    ]

    const clientesOperadores = await prisma.cliente.findMany({
      where: { tipo: 'operador' }
    })

    contador = 0
    for (const embarcacao of embarcacoesTurismo) {
      const clienteAleatorio = clientesOperadores[contador % clientesOperadores.length]
      await prisma.navio.create({
        data: {
          nome: embarcacao.nome,
          tipo: 'maritimo-turistica',
          matricula: embarcacao.matricula,
          bandeira: 'Portugal',
          comprimento: 30 + Math.random() * 40,
          largura: 10 + Math.random() * 12,
          calado: 2 + Math.random() * 2,
          capacidade: 50 + Math.floor(Math.random() * 200),
          anoConstrucao: 2015 + Math.floor(Math.random() * 9),
          status: 'ativo',
          dataInspecao: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          dataProximaInspecao: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          clienteId: clienteAleatorio.id,
          delegacao: 'Açores',
          tecnico: 'Julio Correia'
        }
      })
      contador++
    }
    console.log(`✅ ${embarcacoesTurismo.length} embarcações de turismo criadas`)

    // ========== OBRAS ==========
    console.log('\n🔨 Criando Obras/Projetos...')
    const todosOsNavios = await prisma.navio.findMany()
    
    const obras = [
      { titulo: 'Inspeção Periódica - Bom Jesus I', descricao: 'Inspeção de segurança periódica', status: 'em-curso' },
      { titulo: 'Manutenção - Atlânticoline Fleet', descricao: 'Manutenção preventiva da frota', status: 'em-curso' },
      { titulo: 'Certificação - Futurismo', descricao: 'Recertificação de navios turísticos', status: 'em-curso' },
      { titulo: 'Inspeção Especial - Whale Watcher I', descricao: 'Inspeção técnica especializada', status: 'concluida' },
      { titulo: 'Manutenção Emergencial', descricao: 'Reparação de equipamento navios Transmaçor', status: 'em-curso' },
      { titulo: 'Renovação de Jangadas', descricao: 'Substituição de jangadas antigas', status: 'concluida' },
      { titulo: 'Atualização de Equipamentos', descricao: 'Upgrade de sistemas de navegação', status: 'planejada' },
      { titulo: 'Inspeção Ambiental', descricao: 'Verificação de conformidade ambiental', status: 'em-curso' },
    ]

    let obraContador = 0
    for (const obra of obras) {
      const navioAleatorio = todosOsNavios[obraContador % todosOsNavios.length]
      const clienteAleatorio = clientesArmadores[obraContador % clientesArmadores.length]
      
      await prisma.obra.create({
        data: {
          titulo: `${obra.titulo} #${obraContador}`,
          descricao: obra.descricao,
          status: obra.status as any,
          clienteId: clienteAleatorio.id,
          dataInicio: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          dataFim: Math.random() > 0.5 ? new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : null,
          responsavel: 'Julio Correia',
          orcamento: 5000 + Math.random() * 50000
        }
      })
      obraContador++
    }
    console.log(`✅ ${obras.length} obras criadas`)

    // ========== INSPEÇÕES ==========
    console.log('\n✅ Criando Inspeções...')
    const todasAsObras = await prisma.obra.findMany()
    
    const resultados = ['aprovada', 'reprovada', 'pendente']
    const tipos = ['anual', 'extraordinaria', 'inicial', 'final']
    
    for (let i = 0; i < 15; i++) {
      const obra = todasAsObras[i % todasAsObras.length]
      const navio = todosOsNavios[i % todosOsNavios.length]
      
      await prisma.inspecao.create({
        data: {
          numero: `INS-2024-${String(i + 1).padStart(5, '0')}`,
          tipoInspecao: tipos[Math.floor(Math.random() * tipos.length)],
          dataInspecao: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          dataProxima: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          resultado: resultados[Math.floor(Math.random() * resultados.length)] as any,
          status: 'realizada',
          tecnico: 'Julio Correia',
          observacoes: `Inspeção técnica realizada conforme procedimentos`,
          navioId: navio.id,
          obraId: obra.id
        }
      })
    }
    console.log('✅ 15 inspeções criadas')

    // ========== ESTATÍSTICAS FINAIS ==========
    const statsClientes = await prisma.cliente.count()
    const statsNavios = await prisma.navio.count()
    const statsObras = await prisma.obra.count()
    const statsInspecoes = await prisma.inspecao.count()
    const statsJangadas = await prisma.jangada.count()

    console.log('\n📊 RESUMO FINAL:')
    console.log(`   ✅ ${statsClientes} Clientes (armadores, operadores turísticos e outros)`)
    console.log(`   ✅ ${statsNavios} Navios (embarcações de pesca e turismo marítimo)`)
    console.log(`   ✅ ${statsJangadas} Jangadas de Salvação`)
    console.log(`   ✅ ${statsObras} Obras/Projetos`)
    console.log(`   ✅ ${statsInspecoes} Inspeções`)
    console.log('\n🌱 População de dados dos Açores concluída com sucesso!\n')

  } catch (error) {
    console.error('❌ Erro ao popular dados:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })

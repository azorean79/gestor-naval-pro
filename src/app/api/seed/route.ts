import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EXEMPLOS_JANGADAS } from '@/lib/exemplos-jangadas'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando estado da base de dados...')

    // Verificar se já existem dados
    const clienteCount = await prisma.cliente.count()
    const navioCount = await prisma.navio.count()
    const jangadaCount = await prisma.jangada.count()

    if (clienteCount > 0 || navioCount > 0 || jangadaCount > 0) {
      return NextResponse.json({
        success: false,
        message: 'Base de dados já contém dados. Seed não executado.',
        dados: { clientes: clienteCount, navios: navioCount, jangadas: jangadaCount, stock: 0 }
      })
    }

    console.log('🌱 Iniciando seeding da base de dados via API...')

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
    const clientesCriados = []
    for (const cliente of clientes) {
      const clienteCriado = await prisma.cliente.upsert({
        where: { email: cliente.email },
        update: {},
        create: cliente
      })
      clientesCriados.push(clienteCriado)
    }

    // Criar navios de exemplo
    const navios = [
      {
        nome: 'Santa Maria Express',
        tipo: 'Ferry de Passageiros',
        matricula: 'PT-SME-001',
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
    const naviosCriados = []
    for (const navio of navios) {
      const navioCriado = await prisma.navio.create({
        data: navio
      })
      naviosCriados.push(navioCriado)
    }

    // Criar jangadas usando os exemplos
    console.log('🛟 Criando jangadas...')
    const jangadasCriadas = []
    for (let i = 0; i < Math.min(EXEMPLOS_JANGADAS.length, 10); i++) {
      const exemplo = EXEMPLOS_JANGADAS[i]
      const clienteAleatorio = clientesCriados[Math.floor(Math.random() * clientesCriados.length)]
      const navioAleatorio = naviosCriados[Math.floor(Math.random() * naviosCriados.length)]

      const statusPossiveis = ['Instalada', 'Em Inspeção', 'Aguardando Inspeção', 'Em Manutenção', 'Defeituosa']
      const status = statusPossiveis[Math.floor(Math.random() * statusPossiveis.length)]

      const jangadaCriada = await prisma.jangada.upsert({
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
      jangadasCriadas.push(jangadaCriada)
    }

    // Criar alguns itens de stock
    console.log('📦 Criando itens de stock...')
    const itensStock = [
      {
        nome: 'ZODIAC-TO-SR-25',
        descricao: 'Balsa Salva-Vidas Zodiac TO SR 25P',
        categoria: 'Balsas Infláveis',
        quantidade: 5,
        quantidadeMinima: 2,
        precoUnitario: 25000.00,
        fornecedor: 'Zodiac Maritime',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'VIKING-20P-SOLAS',
        descricao: 'Balsa Salva-Vidas Viking 20P SOLAS A',
        categoria: 'Balsas Infláveis',
        quantidade: 3,
        quantidadeMinima: 1,
        precoUnitario: 22000.00,
        fornecedor: 'Viking Life-Saving Equipment',
        localizacao: 'Armazém Principal',
        status: 'ativo'
      },
      {
        nome: 'COLETE-SALVA-VIDAS-ADULTO',
        descricao: 'Colete Salva-Vidas Adulto SOLAS',
        categoria: 'Equipamentos Individuais',
        quantidade: 50,
        quantidadeMinima: 10,
        precoUnitario: 85.00,
        fornecedor: 'Secumar',
        localizacao: 'Armazém Secundário',
        status: 'ativo'
      },
      {
        nome: 'RACAO-EMERGENCIA-24H',
        descricao: 'Ração de Emergência 24h (500kcal)',
        categoria: 'Viveres',
        quantidade: 100,
        quantidadeMinima: 20,
        precoUnitario: 12.50,
        fornecedor: 'Survitec',
        localizacao: 'Armazém Alimentar',
        status: 'ativo'
      }
    ]

    const stockCriado = []
    for (const item of itensStock) {
      // Check if item already exists
      const itemExistente = await prisma.stock.findFirst({
        where: {
          nome: item.nome,
          categoria: item.categoria
        }
      })

      if (itemExistente) {
        stockCriado.push(itemExistente)
      } else {
        const itemCriado = await prisma.stock.create({
          data: item
        })
        stockCriado.push(itemCriado)
      }
    }

    console.log('✅ Seeding concluído com sucesso via API!')
    const resultado = {
      success: true,
      message: 'Seeding concluído com sucesso!',
      dados: {
        clientes: clientesCriados.length,
        navios: naviosCriados.length,
        jangadas: jangadasCriadas.length,
        stock: stockCriado.length
      }
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('❌ Erro durante o seeding:', error)
    return NextResponse.json(
      { error: 'Erro durante o seeding', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const clienteCount = await prisma.cliente.count()
    const navioCount = await prisma.navio.count()
    const jangadaCount = await prisma.jangada.count()
    const stockCount = await prisma.stock.count()

    return NextResponse.json({
      success: true,
      message: 'Status da base de dados',
      data: {
        clientes: clienteCount,
        navios: navioCount,
        jangadas: jangadaCount,
        stock: stockCount,
        total: clienteCount + navioCount + jangadaCount + stockCount
      }
    })
  } catch (error) {
    console.error('Erro ao verificar status da base de dados:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao verificar base de dados',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
import { PrismaClient } from '../prisma/app/generated-prisma-client'

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🚀 Consultando Base de Dados...\n')
    console.log('═'.repeat(80))
    
    // ============================================
    // CLIENTES
    // ============================================
    console.log('\n📋 CLIENTES\n')
    const clientes = await prisma.cliente.findMany({
      include: {
        navios: true,
        jangadas: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total de Clientes: ${clientes.length}\n`)
    
    if (clientes.length > 0) {
      clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nome}`)
        console.log(`   ID: ${cliente.id}`)
        console.log(`   Email: ${cliente.email || 'N/A'}`)
        console.log(`   Telefone: ${cliente.telefone || 'N/A'}`)
        console.log(`   Tipo: ${cliente.tipo}`)
        console.log(`   NIF: ${cliente.nif || 'N/A'}`)
        console.log(`   Delegação: ${cliente.delegacao}`)
        console.log(`   Técnico: ${cliente.tecnico}`)
        console.log(`   Navios: ${cliente.navios.length}`)
        console.log(`   Jangadas: ${cliente.jangadas.length}`)
        console.log(`   Criado em: ${new Date(cliente.createdAt).toLocaleString('pt-PT')}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  Nenhum cliente encontrado')
    }
    
    // ============================================
    // OBRAS
    // ============================================
    console.log('\n' + '═'.repeat(80))
    console.log('\n🏗️ OBRAS\n')
    
    const obras = await prisma.obra.findMany({
      include: {
        cliente: true,
        inspecoes: {
          orderBy: { dataInspecao: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total de Obras: ${obras.length}\n`)
    
    if (obras.length > 0) {
      obras.forEach((obra, index) => {
        console.log(`${index + 1}. ${obra.titulo}`)
        console.log(`   ID: ${obra.id}`)
        console.log(`   Descrição: ${obra.descricao || 'N/A'}`)
        console.log(`   Status: ${obra.status}`)
        console.log(`   Cliente: ${obra.cliente?.nome || 'N/A'}`)
        console.log(`   Responsável: ${obra.responsavel || 'N/A'}`)
        console.log(`   Data Início: ${obra.dataInicio ? new Date(obra.dataInicio).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Data Fim: ${obra.dataFim ? new Date(obra.dataFim).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Orçamento: ${obra.orcamento ? `${obra.orcamento.toFixed(2)}€` : 'N/A'}`)
        console.log(`   Inspeções: ${obra.inspecoes.length}`)
        if (obra.inspecoes.length > 0) {
          obra.inspecoes.forEach((inspecao, i) => {
            console.log(`     ${i + 1}. ${inspecao.numero} - ${inspecao.tipoInspecao} (${inspecao.resultado})`)
            console.log(`        Data: ${new Date(inspecao.dataInspecao).toLocaleDateString('pt-PT')}`)
            console.log(`        Técnico: ${inspecao.tecnico}`)
          })
        }
        console.log(`   Criado em: ${new Date(obra.createdAt).toLocaleString('pt-PT')}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  Nenhuma obra encontrada')
    }
    
    // ============================================
    // NAVIOS
    // ============================================
    console.log('\n' + '═'.repeat(80))
    console.log('\n⛵ NAVIOS\n')
    
    const navios = await prisma.navio.findMany({
      include: {
        cliente: true,
        proprietario: true,
        certificados: true,
        jangadas: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total de Navios: ${navios.length}\n`)
    
    if (navios.length > 0) {
      navios.forEach((navio, index) => {
        console.log(`${index + 1}. ${navio.nome}`)
        console.log(`   ID: ${navio.id}`)
        console.log(`   Tipo: ${navio.tipo}`)
        console.log(`   Matrícula: ${navio.matricula || 'N/A'}`)
        console.log(`   IMO: ${navio.imo || 'N/A'}`)
        console.log(`   MMSI: ${navio.mmsi || 'N/A'}`)
        console.log(`   Call Sign: ${navio.callSign || 'N/A'}`)
        console.log(`   Bandeira: ${navio.bandeira}`)
        console.log(`   Dimensões: ${navio.comprimento}m x ${navio.largura}m x ${navio.calado}m`)
        console.log(`   Capacidade: ${navio.capacidade || 'N/A'} t`)
        console.log(`   Ano de Construção: ${navio.anoConstrucao || 'N/A'}`)
        console.log(`   Status: ${navio.status}`)
        console.log(`   Cliente: ${navio.cliente?.nome || 'N/A'}`)
        console.log(`   Proprietário: ${navio.proprietario?.nome || 'N/A'}`)
        console.log(`   Certificados: ${navio.certificados.length}`)
        console.log(`   Jangadas: ${navio.jangadas.length}`)
        console.log(`   Inspeção: ${navio.dataInspecao ? new Date(navio.dataInspecao).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Próxima Inspeção: ${navio.dataProximaInspecao ? new Date(navio.dataProximaInspecao).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Delegação: ${navio.delegacao}`)
        console.log(`   Ilha: ${navio.ilha || 'N/A'}`)
        console.log(`   Técnico: ${navio.tecnico}`)
        console.log(`   Criado em: ${new Date(navio.createdAt).toLocaleString('pt-PT')}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  Nenhum navio encontrado')
    }
    
    // ============================================
    // INSPEÇÕES
    // ============================================
    console.log('\n' + '═'.repeat(80))
    console.log('\n🔍 INSPEÇÕES\n')
    
    const inspecoes = await prisma.inspecao.findMany({
      include: {
        navio: true,
        jangada: true,
        cilindro: true,
        obra: true
      },
      orderBy: { dataInspecao: 'desc' }
    })
    
    console.log(`Total de Inspeções: ${inspecoes.length}\n`)
    
    if (inspecoes.length > 0) {
      inspecoes.forEach((inspecao, index) => {
        console.log(`${index + 1}. ${inspecao.numero}`)
        console.log(`   ID: ${inspecao.id}`)
        console.log(`   Tipo: ${inspecao.tipoInspecao}`)
        console.log(`   Resultado: ${inspecao.resultado}`)
        console.log(`   Status: ${inspecao.status}`)
        console.log(`   Data: ${new Date(inspecao.dataInspecao).toLocaleDateString('pt-PT')}`)
        console.log(`   Próxima: ${inspecao.dataProxima ? new Date(inspecao.dataProxima).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Técnico: ${inspecao.tecnico}`)
        console.log(`   Navio: ${inspecao.navio?.nome || 'N/A'}`)
        console.log(`   Jangada: ${inspecao.jangada?.numeroSerie || 'N/A'}`)
        console.log(`   Cilindro: ${inspecao.cilindro?.numeroSerie || 'N/A'}`)
        console.log(`   Obra: ${inspecao.obra?.titulo || 'N/A'}`)
        console.log(`   Observações: ${inspecao.observacoes || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  Nenhuma inspeção encontrada')
    }
    
    // ============================================
    // JANGADAS
    // ============================================
    console.log('\n' + '═'.repeat(80))
    console.log('\n🛥️ JANGADAS\n')
    
    const jangadas = await prisma.jangada.findMany({
      include: {
        cliente: true,
        proprietario: true,
        navio: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`Total de Jangadas: ${jangadas.length}\n`)
    
    if (jangadas.length > 0) {
      jangadas.forEach((jangada, index) => {
        console.log(`${index + 1}. ${jangada.tipo}`)
        console.log(`   ID: ${jangada.id}`)
        console.log(`   Número de Série: ${jangada.numeroSerie}`)
        console.log(`   Tipo Pack: ${jangada.tipoPack || 'N/A'}`)
        console.log(`   Data de Fabricação: ${jangada.dataFabricacao ? new Date(jangada.dataFabricacao).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Capacidade: ${jangada.capacidade || 'N/A'} pessoas`)
        console.log(`   Peso: ${jangada.peso || 'N/A'} kg`)
        console.log(`   Dimensões: ${jangada.dimensoes || 'N/A'}`)
        console.log(`   Status: ${jangada.status}`)
        console.log(`   Estado: ${jangada.estado}`)
        console.log(`   HRU Nº Série: ${jangada.hruNumeroSerie || 'N/A'}`)
        console.log(`   Cliente: ${jangada.cliente?.nome || 'N/A'}`)
        console.log(`   Proprietário: ${jangada.proprietario?.nome || 'N/A'}`)
        console.log(`   Navio: ${jangada.navio?.nome || 'N/A'}`)
        console.log(`   Próxima Inspeção: ${jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao).toLocaleDateString('pt-PT') : 'N/A'}`)
        console.log(`   Criado em: ${new Date(jangada.createdAt).toLocaleString('pt-PT')}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  Nenhuma jangada encontrada')
    }
    
    // ============================================
    // RESUMO
    // ============================================
    console.log('\n' + '═'.repeat(80))
    console.log('\n📊 RESUMO GERAL\n')
    console.log(`   Total de Clientes: ${clientes.length}`)
    console.log(`   Total de Navios: ${navios.length}`)
    console.log(`   Total de Jangadas: ${jangadas.length}`)
    console.log(`   Total de Obras: ${obras.length}`)
    console.log(`   Total de Inspeções: ${inspecoes.length}`)
    
    const certificados = await prisma.certificado.count()
    console.log(`   Total de Certificados: ${certificados}`)
    
    console.log('\n✨ Consulta concluída!\n')
    
  } catch (erro) {
    console.error('❌ Erro ao consultar base de dados:', erro)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

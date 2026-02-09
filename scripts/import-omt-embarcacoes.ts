import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

interface EmbarcacaoData {
  nome: string
  matricula?: string
  tipo: string
  operador: string
  comprimento?: number
  capacidade?: number
  anoConstrucao?: number
}

async function extrairDadosPDF(pdfPath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(pdfPath)
  const pdfModule = (await import('pdf-parse')) as unknown as {
    default?: (data: Buffer) => Promise<{ text: string }>
  }
  const pdfParse = pdfModule.default || (pdfModule as unknown as (data: Buffer) => Promise<{ text: string }>)
  const data = await pdfParse(dataBuffer)
  return data.text
}

function processarTexto(texto: string): EmbarcacaoData[] {
  const embarcacoes: EmbarcacaoData[] = []
  
  // Dividir o texto em linhas
  const linhas = texto.split('\n').filter(linha => linha.trim() !== '')
  
  console.log('📄 Processando PDF...')
  console.log(`Total de linhas: ${linhas.length}`)
  
  // Processar cada linha para extrair dados das embarcações
  // Formato esperado pode variar - vamos tentar identificar padrões
  for (const linha of linhas) {
    console.log('Linha:', linha.substring(0, 100))
  }
  
  return embarcacoes
}

async function importarDados() {
  try {
    console.log('🚢 Iniciando importação de embarcações OMT...\n')
    
    const pdfPath = path.join(process.cwd(), 'public', 'templates', 'OMT - Lista Embarcações.pdf')
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Ficheiro não encontrado: ${pdfPath}`)
    }
    
    console.log('📖 A ler PDF...')
    const textoPDF = await extrairDadosPDF(pdfPath)
    
    console.log('\n📊 Texto extraído do PDF:')
    console.log('─'.repeat(80))
    console.log(textoPDF.substring(0, 2000)) // Mostrar primeiros 2000 caracteres
    console.log('─'.repeat(80))
    console.log(`\nTotal de caracteres: ${textoPDF.length}\n`)
    
    const embarcacoes = processarTexto(textoPDF)
    
    console.log(`\n✅ Encontradas ${embarcacoes.length} embarcações para importar\n`)
    
    let clientesCriados = 0
    let naviosCriados = 0
    
    for (const emb of embarcacoes) {
      console.log(`\n📌 Processando: ${emb.nome}`)
      
      // 1. Criar ou buscar cliente/operador
      let cliente = await prisma.cliente.findFirst({
        where: { nome: emb.operador }
      })
      
      if (!cliente) {
        console.log(`  ➕ Criando cliente: ${emb.operador}`)
        cliente = await prisma.cliente.create({
          data: {
            nome: emb.operador,
            tipo: 'armador',
            delegacao: 'Açores',
            tecnico: 'Julio Correia',
          }
        })
        clientesCriados++
      } else {
        console.log(`  ✓ Cliente existente: ${emb.operador}`)
      }
      
      // 2. Verificar se o navio já existe
      const navioExistente = await prisma.navio.findFirst({
        where: {
          OR: [
            { nome: emb.nome },
            ...(emb.matricula ? [{ matricula: emb.matricula }] : [])
          ]
        }
      })
      
      if (navioExistente) {
        console.log(`  ⚠️  Navio já existe: ${emb.nome}`)
        continue
      }
      
      // 3. Criar navio
      console.log(`  ➕ Criando navio: ${emb.nome}`)
      await prisma.navio.create({
        data: {
          nome: emb.nome,
          tipo: emb.tipo,
          matricula: emb.matricula,
          bandeira: 'Portugal',
          comprimento: emb.comprimento,
          capacidade: emb.capacidade,
          anoConstrucao: emb.anoConstrucao,
          status: 'ativo',
          clienteId: cliente.id,
          delegacao: 'Açores',
          tecnico: 'Julio Correia',
        }
      })
      naviosCriados++
    }
    
    console.log('\n' + '='.repeat(80))
    console.log('✅ IMPORTAÇÃO CONCLUÍDA')
    console.log('='.repeat(80))
    console.log(`📊 Clientes criados: ${clientesCriados}`)
    console.log(`🚢 Navios criados: ${naviosCriados}`)
    console.log('='.repeat(80) + '\n')
    
  } catch (error) {
    console.error('❌ Erro durante a importação:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Executar importação
importarDados()
  .then(() => {
    console.log('✅ Script concluído com sucesso!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Falha na execução:', error)
    process.exit(1)
  })

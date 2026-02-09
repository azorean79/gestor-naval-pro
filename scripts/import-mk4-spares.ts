import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Carregar .env.local se existir
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

async function main() {
  console.log('\n🔧 Importando spare parts do MK IV com referências e imagens...\n')

  // Tentar arquivo com detalhes completos primeiro
  let sparesFile = path.join(__dirname, '..', 'MK_IV_spares_detailed.json')
  if (!fs.existsSync(sparesFile)) {
    // Fallback para arquivo antigo
    sparesFile = path.join(__dirname, '..', 'MK_IV_spare_parts_complete.json')
  }
  
  if (!fs.existsSync(sparesFile)) {
    console.error('❌ Arquivo de spares não encontrado!')
    process.exit(1)
  }

  // Set direct database URL for this script
  process.env.DATABASE_URL = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL ou PRISMA_DATABASE_URL não configurada')
    process.exit(1)
  }

  console.log(`📄 Usando: ${path.basename(sparesFile)}`)
  console.log('✅ Conectando ao PostgreSQL...')
  
  // Create PrismaClient without accelerate for CLI operations
  const prisma = new PrismaClient()

  try {
    const sparesData = JSON.parse(fs.readFileSync(sparesFile, 'utf-8'))
    const categoria = 'SPARE_PARTS_MK_IV'

    // Estratégia 1: Importar referências encontradas (Part Numbers)
    const referencias = sparesData.referencias_encontradas || []
    let refAdicionadas = 0
    let refExistentes = 0

    console.log(`\n📦 Processando ${referencias.length} referências de fabricante...\n`)

    for (const ref of referencias) {
      // Pular referências inválidas
      if (!ref || ref === '.' || ref.length < 3) {
        continue
      }

      // Verificar se já existe
      const existente = await prisma.stock.findFirst({
        where: {
          // ...existing code...
          categoria: categoria,
        },
      })

      if (existente) {
        refExistentes++
        continue
      }

      // Gerar nome a partir da referência
      const nome = `MK IV Spare Part - ${ref.toUpperCase()}`
      
      // Tentar mapear para uma página de imagem
      const imagemPages = sparesData.imagens_por_pagina || {}
      const paginas = Object.keys(imagemPages)
      const imagemPath = paginas.length > 0 
        ? `/api/spares/mk4/${paginas[Math.floor(Math.random() * paginas.length)]}`
        : null

      // Criar item no stock
      await prisma.stock.create({
        data: {
          nome: nome,
          descricao: `MK IV Spare Part - Referência do fabricante: ${ref}`,
          categoria: categoria,
          quantidade: 0,
          quantidadeMinima: 0,
          // ...existing code...
          // ...existing code...
          // lote property removed
          status: 'ativo',
        },
      })

      refAdicionadas++

      if (refAdicionadas % 10 === 0) {
        console.log(`   ✓ ${refAdicionadas} referências processadas`)
      }
    }

    console.log(`\n✅ Importação de referências completa!`)
    console.log(`   ${refAdicionadas} novas referências adicionadas ao stock`)
    console.log(`   ${refExistentes} referências já existiam\n`)

    // Estratégia 2: Importar componentes baseados em spares extraídos
    const componentes = sparesData.spares || []
    let compAdicionados = 0

    console.log(`📦 Processando ${componentes.length} componentes específicos...\n`)

    for (const spare of componentes) {
      if (!spare.descricao && !spare.refFabricante) {
        continue
      }

      const existente = await prisma.stock.findFirst({
        where: {
          // ...existing code...
          categoria: categoria,
        },
      })

      if (existente) {
        continue
      }

      const imagemPath = spare.pagina 
        ? `/api/spares/mk4/page_${spare.pagina.toString().padStart(3, '0')}.png`
        : null

      await prisma.stock.create({
        data: {
          nome: spare.descricao || `MK IV - ${spare.refFabricante}`,
          descricao: `${spare.descricao || 'MK IV Spare Part'} - Ref: ${spare.refFabricante}`,
          categoria: categoria,
          quantidade: 0,
          quantidadeMinima: 0,
          // ...existing code...
          // imagem and lote properties removed
          status: 'ativo',
        },
      })

      compAdicionados++
    }

    console.log(`✅ Importação de componentes completa!`)
    console.log(`   ${compAdicionados} componentes adicionados\n`)

    // Resumo final
    const totalAdicionados = refAdicionadas + compAdicionados
    console.log(`🎯 RESUMO FINAL - MK IV SPARE PARTS:`)
    console.log(`   Total de itens adicionados: ${totalAdicionados}`)
    console.log(`   Referências do fabricante: ${refAdicionadas}`)
    console.log(`   Componentes específicos: ${compAdicionados}`)
    console.log(`   Itens já existentes: ${refExistentes}`)
    if (sparesData.imagens_por_pagina) {
      console.log(`   Páginas/imagens disponíveis: ${Object.keys(sparesData.imagens_por_pagina).length}`)
    }
    console.log(`\n✨ Catálogo MK IV atualizado!\n`)

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)

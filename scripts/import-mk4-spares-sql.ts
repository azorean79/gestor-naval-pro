import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

// Carregar .env.local se existir
import dotenv from 'dotenv'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// Usar driver SQL direto - sem Prisma
import pkg from 'pg'
const { Client } = pkg

async function main() {
  console.log('\n🔧 Importando spare parts do MK IV com referências e imagens...\n')

  // Tentar arquivo com detalhes completos primeiro
  let sparesFile = path.join(__dirname, '..', 'MK_IV_spares_detailed.json')
  if (!fs.existsSync(sparesFile)) {
    sparesFile = path.join(__dirname, '..', 'MK_IV_spare_parts_complete.json')
  }
  
  if (!fs.existsSync(sparesFile)) {
    console.error('❌ Arquivo de spares não encontrado!')
    process.exit(1)
  }

  const prismaUrl = process.env.POSTGRES_URL || process.env.PRISMA_DATABASE_URL
  if (!prismaUrl) {
    console.error('❌ POSTGRES_URL ou PRISMA_DATABASE_URL não configurada')
    process.exit(1)
  }

  console.log(`📄 Usando: ${path.basename(sparesFile)}`)
  console.log('✅ Conectando ao PostgreSQL...')

  const client = new Client({
    connectionString: prismaUrl,
  })

  try {
    await client.connect()
    
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
      const existeResult = await client.query(
        'SELECT id FROM stock WHERE "refFabricante" = $1 AND categoria = $2',
        [ref.trim(), categoria]
      )

      if (existeResult.rows.length > 0) {
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
      await client.query(
        `INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          nome,
          `MK IV Spare Part - Referência do fabricante: ${ref}`,
          categoria,
          0,
          0,
          ref.trim(),
          imagemPath,
          'MK_IV_SPARES',
          'ativo'
        ]
      )

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

      const existeResult = await client.query(
        'SELECT id FROM stock WHERE "refFabricante" = $1 AND categoria = $2',
        [spare.refFabricante, categoria]
      )

      if (existeResult.rows.length > 0) {
        continue
      }

      const imagemPath = spare.pagina 
        ? `/api/spares/mk4/page_${spare.pagina.toString().padStart(3, '0')}.png`
        : null

      await client.query(
        `INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          spare.descricao || `MK IV - ${spare.refFabricante}`,
          `${spare.descricao || 'MK IV Spare Part'} - Ref: ${spare.refFabricante}`,
          categoria,
          0,
          0,
          spare.refFabricante,
          imagemPath,
          'MK_IV_SPARES',
          'ativo'
        ]
      )

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
    await client.end()
  }
}

main().catch(console.error)

#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ler o arquivo JSON de spares
const sparesFile = path.join(__dirname, '..', 'MK_IV_spares_detailed.json')

if (!fs.existsSync(sparesFile)) {
  console.error('❌ Arquivo MK_IV_spares_detailed.json não encontrado!')
  process.exit(1)
}

const sparesData = JSON.parse(fs.readFileSync(sparesFile, 'utf-8'))
const categoria = 'SPARE_PARTS_MK_IV'

// Gerar SQL INSERT statements
let sql = `-- Importação de Spare Parts do MK IV\n`
sql += `-- Gerado automaticamente\n\n`
sql += `BEGIN;\n\n`

const referencias = sparesData.referencias_encontradas || []
let count = 0

console.log('🔧 Gerando SQL para import de spares do MK IV...\n')

for (const ref of referencias) {
  if (!ref || ref === '.' || ref.length < 3) {
    continue
  }

  const nome = `MK IV Spare Part - ${ref.toUpperCase()}`.replace(/'/g, "''")
  const descricao = `MK IV Spare Part - Referência do fabricante: ${ref}`.replace(/'/g, "''")
  
  const imagemPages = sparesData.imagens_por_pagina || {}
  const paginas = Object.keys(imagemPages)
  const imagemPath = paginas.length > 0 
    ? `/api/spares/mk4/${paginas[Math.floor(Math.random() * paginas.length)]}`
    : null

  const refEscaped = ref.trim().replace(/'/g, "''")
  const imagemEscaped = imagemPath ? `'${imagemPath}'` : 'NULL'

  sql += `INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")\n`
  sql += `VALUES ('${nome}', '${descricao}', '${categoria}', 0, 0, '${refEscaped}', ${imagemEscaped}, 'MK_IV_SPARES', 'ativo', NOW(), NOW())\n`
  sql += `ON CONFLICT ("refFabricante") DO NOTHING;\n\n`

  count++
}

// Componentes específicos
const componentes = sparesData.spares || []
for (const spare of componentes) {
  if (!spare.descricao && !spare.refFabricante) {
    continue
  }

  const nome = (spare.descricao || `MK IV - ${spare.refFabricante}`).replace(/'/g, "''")
  const descricao = (`${spare.descricao || 'MK IV Spare Part'} - Ref: ${spare.refFabricante}`).replace(/'/g, "''")
  const imagemPath = spare.pagina 
    ? `/api/spares/mk4/page_${spare.pagina.toString().padStart(3, '0')}.png`
    : null

  const refEscaped = spare.refFabricante.replace(/'/g, "''")
  const imagemEscaped = imagemPath ? `'${imagemPath}'` : 'NULL'

  sql += `INSERT INTO stock (nome, descricao, categoria, quantidade, "quantidadeMinima", "refFabricante", imagem, lote, status, "createdAt", "updatedAt")\n`
  sql += `VALUES ('${nome}', '${descricao}', '${categoria}', 0, 0, '${refEscaped}', ${imagemEscaped}, 'MK_IV_SPARES', 'ativo', NOW(), NOW())\n`
  sql += `ON CONFLICT ("refFabricante") DO NOTHING;\n\n`

  count++
}

sql += `COMMIT;\n`
sql += `\n-- Total de inserts: ${count}\n`

// Salvar arquivo SQL
const sqlFile = path.join(__dirname, '..', 'import-mk4-spares.sql')
fs.writeFileSync(sqlFile, sql, 'utf-8')

console.log(`✅ Arquivo SQL gerado: ${sqlFile}`)
console.log(`   Total de declarações INSERT: ${count}`)
console.log(`   Tamanho do arquivo: ${(sql.length / 1024).toFixed(2)} KB\n`)
console.log(`Próximos passos:`)
console.log(`1. Execute no seu banco de dados:`)
console.log(`   psql -f import-mk4-spares.sql`)
console.log(`   ou copie o conteúdo e execute no pgAdmin/DBeaver\n`)

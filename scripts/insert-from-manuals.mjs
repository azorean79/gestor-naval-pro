#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { prisma } from '../src/lib/prisma.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function insertSpecifications() {
  try {
    console.log('\n📊 Inserindo marcas e modelos dos manuais...\n')

    // Ler arquivo de especificações
    const specFile = path.join(__dirname, '..', 'manual_specifications.json')
    const specs = JSON.parse(fs.readFileSync(specFile, 'utf-8'))

    let marcasCount = 0
    let modelosCount = 0

    for (const [key, data] of Object.entries(specs)) {
      const { marca: marcaNome, modelo: modeloNome } = data

      console.log(`📝 Processando: ${marcaNome} ${modeloNome}`)

      try {
        // 1. Encontrar ou criar marca
        let marca = await prisma.marcaJangada.findFirst({
          where: { nome: marcaNome },
        })

        if (!marca) {
          marca = await prisma.marcaJangada.create({
            data: {
              nome: marcaNome,
              ativo: true,
            },
          })
          console.log(`   ✅ Marca criada: ${marca.nome}`)
          marcasCount++
        } else {
          console.log(`   ⚙️  Marca encontrada`)
        }

        // 2. Encontrar ou criar modelo
        let modelo = await prisma.modeloJangada.findFirst({
          where: {
            nome: modeloNome,
            marcaId: marca.id,
          },
        })

        if (!modelo) {
          modelo = await prisma.modeloJangada.create({
            data: {
              nome: modeloNome,
              marcaId: marca.id,
              ativo: true,
            },
          })
          console.log(`   ✅ Modelo criado`)
          modelosCount++
        } else {
          console.log(`   ⚙️  Modelo encontrado`)
        }

        console.log()
      } catch (error) {
        console.error(`   ❌ Erro:`, error)
      }
    }

    console.log(`✅ Inserção completa!`)
    console.log(`   ${marcasCount} novas marcas criadas`)
    console.log(`   ${modelosCount} novos modelos criados\n`)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

insertSpecifications().catch(console.error)

import { prisma } from '../src/lib/prisma'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  console.log('📦 Adicionando especificações de contentores, cilindros e cintas MKIV...\n')

  // Read extracted data
  const jsonPath = path.join(process.cwd(), 'mkiv-technical-specs.json')
  const mkivData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  // Get RFD SURVIVA MKIV modelo ID
  const modelo = await prisma.modeloJangada.findFirst({
    where: { nome: 'SURVIVA MKIV' },
    include: { marca: true }
  })

  if (!modelo) {
    console.error('❌ Modelo SURVIVA MKIV não encontrado')
    return
  }

  console.log(`✅ Modelo encontrado: ${modelo.marca.nome} ${modelo.nome} (${modelo.id})`)

  // Map capacity names to numbers
  const capacityMap: Record<string, number> = {
    '4p': 4, '6p': 6, '8p': 8, '10p': 10, '12p': 12, 
    '16p': 16, '20p': 20, '25p': 25
  }

  let updated = 0
  let skipped = 0

  for (const [capKey, capData] of Object.entries(mkivData.capacities)) {
    const capacidade = capacityMap[capKey as keyof typeof capacityMap]
    if (!capacidade) continue

    // Find lotacao
    const lotacao = await prisma.lotacaoJangada.findFirst({
      where: { capacidade }
    })

    if (!lotacao) {
      console.log(`⚠️  Lotação ${capacidade}p não encontrada`)
      skipped++
      continue
    }

    // Find existing spec
    const existingSpec = await prisma.especificacaoTecnica.findFirst({
      where: {
        marcaId: modelo.marcaId,
        modeloId: modelo.id,
        lotacaoId: lotacao.id
      }
    })

    if (!existingSpec) {
      console.log(`⚠️  Especificação ${capacidade}p não encontrada`)
      skipped++
      continue
    }

    // Parse existing referenciaCilindro
    const existingRef = existingSpec.referenciaCilindro 
      ? JSON.parse(existingSpec.referenciaCilindro) 
      : {}

    // Build enhanced data
    const data: any = capData as any
    
    // Add container details
    const contentoresDetalhados = []
    if (data.contentores) {
      for (const [contKey, contData] of Object.entries(data.contentores)) {
        const cont: any = contData
        if (cont.pack_a) {
          contentoresDetalhados.push({
            tipo: contKey,
            pack_solas: 'A',
            dimensoes_mm: cont.pack_a.dimensoes_mm || 'N/D',
            peso_kg: cont.pack_a.peso_kg || 0,
            cintas_fecho_quantidade: cont.pack_a.cintas_quantidade || 0,
            part_number: cont.pack_a.part_number || null
          })
        }
        if (cont.pack_b) {
          contentoresDetalhados.push({
            tipo: contKey,
            pack_solas: 'B',
            dimensoes_mm: cont.pack_b.dimensoes_mm || 'N/D',
            peso_kg: cont.pack_b.peso_kg || 0,
            cintas_fecho_quantidade: cont.pack_b.cintas_quantidade || 0,
            part_number: cont.pack_b.part_number || null
          })
        }
      }
    }

    // Add cylinder details
    const cilindrosDetalhados = []
    if (data.cilindros?.throwover) {
      cilindrosDetalhados.push({
        tipo: 'throwover',
        co2_kg: data.cilindros.throwover.co2_kg || 0,
        n2_kg: data.cilindros.throwover.n2_kg || 0,
        pressao_bar: data.cilindros.throwover.pressao_bar || 'TPED',
        observacao: data.cilindros.throwover.observacao || null
      })
    }
    if (data.cilindros?.davit_launch) {
      cilindrosDetalhados.push({
        tipo: 'davit_launch',
        co2_kg: data.cilindros.davit_launch.co2_kg || 0,
        n2_kg: data.cilindros.davit_launch.n2_kg || 0,
        pressao_bar: data.cilindros.davit_launch.pressao_bar || 'TPED',
        observacao: data.cilindros.davit_launch.observacao || null
      })
    }

    // Merge with existing data
    const updatedRef = {
      ...existingRef,
      contentores_detalhados: contentoresDetalhados,
      cilindros_detalhados: cilindrosDetalhados,
      cintas_fecho: {
        material: data.cintas_fecho?.material || 'Metal strap with crimp',
        torque_nm: data.cintas_fecho?.torque_nm || 'Crimping tool - no torque',
        observacoes: data.cintas_fecho?.observacoes || 'Quantity varies by container type',
        metodo_instalacao: 'Tensioning tool until base rests in lower container rim, then secure with crimp'
      },
      launch_type: data.launch_type || 'throwover_only',
      metadata_source: mkivData.metadata
    }

    // Update
    await prisma.especificacaoTecnica.update({
      where: { id: existingSpec.id },
      data: {
        referenciaCilindro: JSON.stringify(updatedRef)
      }
    })

    console.log(`✅ ${capacidade}p - ${contentoresDetalhados.length} contentores, ${cilindrosDetalhados.length} cilindros`)
    updated++
  }

  console.log(`\n📊 Resumo:`)
  console.log(`  ✅ Atualizadas: ${updated}`)
  console.log(`  ⚠️  Ignoradas: ${skipped}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

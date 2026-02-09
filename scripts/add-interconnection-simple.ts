import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('🔗 Adicionando interligações entre componentes...')

  try {
    const marcaRFD = await prisma.marcaJangada.findFirst({ where: { nome: 'RFD' } })
    const marcaDSB = await prisma.marcaJangada.findFirst({ where: { nome: 'DSB' } })
    const modeloMKIV = await prisma.modeloJangada.findFirst({ where: { nome: 'MKIV' } })
    const modeloLR07 = await prisma.modeloJangada.findFirst({ where: { nome: 'LR07' } })

    if (!marcaRFD || !marcaDSB || !modeloMKIV || !modeloLR07) {
      throw new Error('Marcas ou modelos não encontrados')
    }

    const lotacoes = [4, 6, 8, 10, 12, 16, 20, 25]

    const getConfig = (p: number) => ({
      tubo: p <= 10 ? '12mm' : p <= 16 ? '14mm' : '16mm',
      niplesInf: p <= 6 ? 4 : p <= 10 ? 6 : p <= 16 ? 10 : p <= 20 ? 14 : 18,
      niplesSup: p <= 6 ? 4 : p <= 10 ? 6 : p <= 16 ? 8 : p <= 20 ? 12 : 16,
      adaptInf: p <= 6 ? 2 : p <= 10 ? 3 : p <= 16 ? 4 : p <= 20 ? 5 : 6,
      adaptSup: p <= 6 ? 2 : p <= 10 ? 3 : p <= 16 ? 4 : p <= 20 ? 5 : 6,
      comprTubo: p <= 6 ? 3.5 : p <= 10 ? 5.0 : p <= 16 ? 7.5 : p <= 20 ? 10.0 : 12.5
    })

    for (const pessoas of lotacoes) {
      const lotacao = await prisma.lotacaoJangada.findFirst({ where: { capacidade: pessoas } })
      if (!lotacao) continue

      const cfg = getConfig(pessoas)
      const interligacao = JSON.stringify({
        interligacoes: {
          cilindro_valvula: `CO2 58bar → Válvula ${pessoas <= 10 ? 'OTS65/A10/B10' : 'OTS65'} (${pessoas <= 10 ? 'PN: LEAF-OTS65-001/HAMM-A10-V-002/HAMM-B10-V-003' : 'PN: LEAF-OTS65-001'}) | Torque: 25-60 Nm`,
          valvula_tubo: `Válvula → Tubo ${cfg.tubo} (PN: ${cfg.tubo === '12mm' ? 'LEAF-HP12-NYL-100' : cfg.tubo === '14mm' ? 'LEAF-HP14-NYL-101' : 'LEAF-HP16-NYL-102'}) | Adaptador: ${pessoas <= 10 ? 'LEAF-ADT-OTS65-VT-504 ou HAMM-ADT-AB10-VT-505' : 'LEAF-ADT-OTS65-VT-504'} | Torque: ${pessoas <= 10 ? '12-15' : '15'} Nm`,
          tubo_camara_inferior: `Tubo ${cfg.tubo} ${cfg.comprTubo}m → ${cfg.adaptInf} Adaptadores (PN: ${cfg.tubo === '12mm' ? 'LEAF-ADT-12-INF-500' : 'LEAF-ADT-14-INF-502'}) | Torque: ${cfg.tubo === '12mm' ? '25' : '28'} Nm | ${cfg.niplesInf} niples ${cfg.tubo}`,
          tubo_camara_superior: `Tubo ${cfg.tubo} → ${cfg.adaptSup} Adaptadores (PN: ${cfg.tubo === '12mm' ? 'LEAF-ADT-12-SUP-501' : 'LEAF-ADT-14-SUP-503'}) | Torque: ${cfg.tubo === '12mm' ? '25' : '28'} Nm | ${cfg.niplesSup} niples ${cfg.tubo}`,
          volumes: `Câmara Inferior: ${pessoas * 80}L | Câmara Superior: ${pessoas * 40}L`,
          diagrama: `CILINDRO→VÁLVULA→TUBO→[CÂMARA_INF(${cfg.adaptInf}adpt+${cfg.niplesInf}nip) + CÂMARA_SUP(${cfg.adaptSup}adpt+${cfg.niplesSup}nip)]`
        },
        testes_checklist: {
          T1_Estanquicidade_Valvula: '0.5bar 5min, queda<0.02bar | Ferramentas: WIKA-DG10-BAR-001',
          T2_Torques_Adaptadores: `Inferior:${cfg.tubo === '12mm' ? '25' : '28'}Nm Superior:${cfg.tubo === '12mm' ? '25' : '28'}Nm Válvula:${pessoas <= 10 ? '12-15' : '15'}Nm | Ferramenta: GEDO-TRQ-080-DIG`,
          T3_Pressao_Camara_Inferior: '0.5bar 5min, perda<0.025bar | Ferramentas: WIKA-DG10-BAR-001, UES-ULTRA-LEAK-9000',
          T4_Pressao_Camara_Superior: '0.5bar 5min, perda<0.025bar, sem deformação',
          T5_Insuflacao_Completa: `25-45s até 0.5bar, ${cfg.niplesInf + cfg.niplesSup} niples OK`,
          T6_Inspecao_Visual_Vedacoes: 'O-rings intactos, sem cortes/rachaduras, <2 anos | Substituir: PARK-NBR-12X2-OR100, PARK-FKM-14X2-OR101, LOCT-HP-SEAL-577'
        }
      })

      // RFD MKIV
      await prisma.$executeRaw`
        UPDATE especificacoes_tecnicas 
        SET "referenciaCilindro" = ${interligacao}::jsonb
        WHERE "marcaId" = ${marcaRFD.id} 
          AND "modeloId" = ${modeloMKIV.id} 
          AND "lotacaoId" = ${lotacao.id}
      `
      console.log(`✅ RFD MKIV ${pessoas}p: ${cfg.adaptInf + cfg.adaptSup} adaptadores, ${cfg.niplesInf + cfg.niplesSup} niples`)

      // DSB LR07
      await prisma.$executeRaw`
        UPDATE especificacoes_tecnicas 
        SET "referenciaCilindro" = ${interligacao}::jsonb
        WHERE "marcaId" = ${marcaDSB.id} 
          AND "modeloId" = ${modeloLR07.id} 
          AND "lotacaoId" = ${lotacao.id}
      `
      console.log(`✅ DSB LR07 ${pessoas}p: ${cfg.adaptInf + cfg.adaptSup} adaptadores, ${cfg.niplesInf + cfg.niplesSup} niples`)
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✨ INTERLIGAÇÕES ADICIONADAS!')
    console.log('═'.repeat(80))
    console.log('\n📋 Sistema: CILINDRO CO2 → VÁLVULA → TUBO ALTA PRESSÃO → CÂMARAS')
    console.log('\n✅ 6 Testes incluídos no checklist de inspeção')
    console.log('✅ Part Numbers de todos os componentes registrados')
    console.log('✅ Torques de aperto especificados')    
    console.log('═'.repeat(80))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

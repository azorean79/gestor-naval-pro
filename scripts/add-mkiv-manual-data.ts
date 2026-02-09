import { prisma } from '../src/lib/prisma'

type JsonObject = Record<string, unknown>

const parseReferencia = (value: string | null): JsonObject => {
  if (!value) return {}
  try {
    return JSON.parse(value) as JsonObject
  } catch {
    return { legacy_text: value }
  }
}

const manualData = {
  fonte: 'RFD Marine MKIV Service Manual M269-00 (Jan/17, Aug/21)',
  pressao_trabalho: {
    throwover: '2.8 psi / 77.5 in WG / 1970 mm WG / 193 mb',
    davit_launch: '3.5 psi / 97.0 in WG / 460 mm WG / 241 mb'
  },
  gas_charges_raw: {
    observacao: 'Tabela OCR parcialmente quebrada; valores mantidos conforme extracao.',
    linhas: [
      '4: 1.98 kg CO2 / 0.06 kg N2 (Throwover) | Davit: -',
      '6/8: 3.38 kg CO2 / 0.14 kg N2 (Throwover) | Davit: -',
      '10: 5.38 kg CO2 / 0.27 kg N2 (Throwover) | Davit: -',
      '12: 5.38 kg CO2 / 0.27 kg N2 (Throwover) | Davit: 5.38 / 0.27 e 6.85 / 0.212',
      '16: 8.80 kg CO2 / 0.44 kg N2 (Throwover) | Davit: 7.18 / 0.36',
      '20: 8.80 kg CO2 / 0.44 kg N2 (Throwover) | Davit: 10.77 / 0.54',
      '25: 10.77 kg CO2 / 0.54 kg N2 (Throwover) | Davit: 12.57 / 0.63'
    ]
  },
  overhaul_period: {
    liferaft: '12 months',
    inflation_system: 'See Associated Publications at the front of the manual'
  },
  torque_settings: [
    { item: 'M24 nut (inlet check valve)', nm: '30', ft_lb: '22', special_tool: 'Yes' },
    { item: 'M16 connector (inlet check valve)', nm: '10.5 +/- 1.5', ft_lb: '7.744 +/- 1.106', special_tool: 'No' },
    { item: 'Cylinder valve / gas cylinder', nm: '160', ft_lb: '118', special_tool: 'No' },
    { item: 'Union nut / cylinder valve', nm: '20', ft_lb: '14.75', special_tool: 'No' },
    { item: 'Cylinder valve / hose', nm: '12.2', ft_lb: '9.0', special_tool: 'No' },
    { item: 'Break stem seal assy. / valve body', nm: '40', ft_lb: '29.5', special_tool: 'Yes' },
    { item: 'Torque drive assy. / valve body', nm: '4', ft_lb: '2.95', special_tool: 'Yes' },
    { item: 'Operating head / cylinder valve (3 mm Hex)', nm: '1.12', ft_lb: '0.8', special_tool: 'No' },
    { item: 'A10 pressure relief valve (inner)', nm: '27', ft_lb: '19.9', special_tool: 'Yes' },
    { item: 'B10 pressure relief valve (inner) (alternative)', nm: '27', ft_lb: '19.9', special_tool: 'Yes' },
    { item: 'Valve, Topping-up', nm: '15', ft_lb: '11', special_tool: 'Yes' },
    { item: 'H-Pack nylon nut', nm: '9.5', ft_lb: '7.0', special_tool: 'Yes' },
    { item: 'Vacuum valve plug', nm: '6.5', ft_lb: '4.8', special_tool: 'Yes' },
    { item: 'Vacuum valve retaining nut', nm: '6.5', ft_lb: '4.8', special_tool: 'Yes' }
  ],
  battery_activation_cords: {
    rl5: {
      '8': '700 mm',
      '12': '700 mm',
      '20_throwover': '1000 mm',
      '20_davit': '1000 mm'
    },
    rl6: {
      '8': '400 mm',
      '12': '1200 mm',
      '16_throwover': '1300 mm',
      '16_davit': '1300 mm',
      '20': '1500 mm',
      '25': '1500 mm'
    }
  },
  painter_and_hru: {
    painter_min_length_rule: 'Painter line must be minimum 10 meters more than installation height',
    weak_link_breaking_strength: '1.8 - 2.6 kN',
    notes: [
      'Painter must be secured to a suitable strong point or HRU weak link',
      'Strong point must support pull to activate inflation system',
      'Slip link lashed to holding down straps recommended for manual quick release'
    ]
  },
  xtrem_containers_nominal_dimensions_mm_kg: [
    { capacity: '6', container: 'N137', length: 790, width: 555, height: 270, weight: 53 },
    { capacity: '6', container: 'N137H', length: 790, width: 555, height: 340, weight: 72 },
    { capacity: '8', container: 'N138', length: 840, width: 570, height: 294, weight: 55 },
    { capacity: '8', container: 'N138H', length: 840, width: 570, height: 340, weight: 75 },
    { capacity: '10', container: 'N139', length: 940, width: 640, height: 314, weight: 80 },
    { capacity: '10', container: 'N139H', length: 940, width: 640, height: 364, weight: 95 },
    { capacity: '12', container: 'N139', length: 940, width: 640, height: 314, weight: 85 },
    { capacity: '12', container: 'N139H', length: 940, width: 640, height: 364, weight: 104 },
    { capacity: '16', container: 'N140', length: 1100, width: 650, height: 340, weight: 99 },
    { capacity: '16', container: 'N140H', length: 1100, width: 650, height: 370, weight: 131 }
  ],
  xtrem_container_notes: 'Nominal dimensions from manual. Table shows A/B pack columns; OCR output only shows one set of values per container.'
}

async function upsertManualData(marcaNome: string, modeloNome: string) {
  const marca = await prisma.marcaJangada.findFirst({ where: { nome: marcaNome } })
  const modelo = await prisma.modeloJangada.findFirst({ where: { nome: modeloNome } })

  if (!marca || !modelo) {
    throw new Error(`Marca/modelo nao encontrados: ${marcaNome} / ${modeloNome}`)
  }

  const lotacoes = [4, 6, 8, 10, 12, 16, 20, 25]

  for (const pessoas of lotacoes) {
    const lotacao = await prisma.lotacaoJangada.findFirst({ where: { capacidade: pessoas } })
    if (!lotacao) continue

    const espec = await prisma.especificacaoTecnica.findFirst({
      where: {
        marcaId: marca.id,
        modeloId: modelo.id,
        lotacaoId: lotacao.id
      }
    })

    if (!espec) continue

    const current = parseReferencia(espec.referenciaCilindro || null)
    const merged = {
      ...current,
      manual_mkiv: manualData
    }

    await prisma.especificacaoTecnica.update({
      where: { id: espec.id },
      data: {
        referenciaCilindro: JSON.stringify(merged)
      }
    })

    console.log(`✅ ${marcaNome} ${modeloNome} ${pessoas}p: manual adicionado`) 
  }
}

async function main() {
  console.log('📘 Adicionando dados do manual MKIV a todas as especificacoes...')

  try {
    await upsertManualData('RFD', 'MKIV')
    await upsertManualData('DSB', 'LR07')

    console.log('\n' + '═'.repeat(80))
    console.log('✨ DADOS DO MANUAL ADICIONADOS COM SUCESSO')
    console.log('═'.repeat(80))
  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

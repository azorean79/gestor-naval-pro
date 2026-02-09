import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📦 Adicionando todos os componentes técnicos ao stock com Part Numbers...')

  try {
    const componentes = [
      // ============ VÁLVULAS COM TORQUES ============
      {
        nome: 'Válvula OTS65 LEAFIELD',
        descricao: 'Válvula de insuflação OTS65 sistema LEAFIELD',
        categoria: 'Válvulas e Acessórios',
        quantidade: 20,
        quantidadeMinima: 3,
        precoUnitario: 280.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Armário Válvulas - Caixa 1',
        refFabricante: 'LEAF-OTS65-001',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.4 bar | Torque instalação 12 Nm | Torque aperto 8 Nm | Material latão cromado'
      },
      {
        nome: 'Válvula A10 Sistema Tubo Pressão',
        descricao: 'Válvula A10 com regulador de pressão integrado',
        categoria: 'Válvulas e Acessórios',
        quantidade: 18,
        quantidadeMinima: 3,
        precoUnitario: 320.00,
        fornecedor: 'Zodiac / RFD / HAMMAR',
        localizacao: 'Armário Válvulas - Caixa 3',
        refFabricante: 'HAMM-A10-V-002',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.5 bar | Torque instalação 15 Nm | Torque aperto final 10 Nm | Rosca M12x1.5'
      },
      {
        nome: 'Válvula B10 Sistema Tubo Pressão',
        descricao: 'Válvula B10 com regulador de pressão integrado',
        categoria: 'Válvulas e Acessórios',
        quantidade: 18,
        quantidadeMinima: 3,
        precoUnitario: 320.00,
        fornecedor: 'Zodiac / RFD / HAMMAR',
        localizacao: 'Armário Válvulas - Caixa 3',
        refFabricante: 'HAMM-B10-V-003',
        status: 'ativo',
        especificacao: 'Pressão abertura 0.5 bar | Torque instalação 15 Nm | Torque aperto final 10 Nm | Rosca M12x1.5'
      },

      // ============ TUBOS DE ALTA PRESSÃO ============
      {
        nome: 'Tubo Alta Pressão 12mm LEAFIELD',
        descricao: 'Tubo alta pressão nylon reforçado 12mm para LEAFIELD (por metro)',
        categoria: 'Tubagem',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 12.50,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 1',
        refFabricante: 'LEAF-HP12-NYL-100',
        status: 'ativo',
        especificacao: 'Pressão máx 10 bar | Torque conexão 18 Nm | Material nylon PA12 reforçado | Diâmetro interno 12mm'
      },
      {
        nome: 'Tubo Alta Pressão 14mm LEAFIELD',
        descricao: 'Tubo alta pressão nylon reforçado 14mm para LEAFIELD (por metro)',
        categoria: 'Tubagem',
        quantidade: 40,
        quantidadeMinima: 5,
        precoUnitario: 15.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 2',
        refFabricante: 'LEAF-HP14-NYL-101',
        status: 'ativo',
        especificacao: 'Pressão máx 10 bar | Torque conexão 20 Nm | Material nylon PA12 reforçado | Diâmetro interno 14mm'
      },
      {
        nome: 'Tubo Alta Pressão 16mm LEAFIELD',
        descricao: 'Tubo alta pressão nylon reforçado 16mm para LEAFIELD (por metro)',
        categoria: 'Tubagem',
        quantidade: 30,
        quantidadeMinima: 3,
        precoUnitario: 18.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 3',
        refFabricante: 'LEAF-HP16-NYL-102',
        status: 'ativo',
        especificacao: 'Pressão máx 10 bar | Torque conexão 22 Nm | Material nylon PA12 reforçado | Diâmetro interno 16mm'
      },
      {
        nome: 'Tubo Pressão 6mm A10/B10',
        descricao: 'Tubo de pressão 6mm para válvulas A10/B10 (por metro)',
        categoria: 'Tubagem',
        quantidade: 80,
        quantidadeMinima: 10,
        precoUnitario: 4.50,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Tubagem - Rolo 4',
        refFabricante: 'HAMM-TP6-NYL-200',
        status: 'ativo',
        especificacao: 'Pressão máx 5 bar | Torque conexão 12 Nm | Material nylon reforçado 6mm | Para sistema A10/B10'
      },

      // ============ ADAPTADORES E CONECTORES ============
      {
        nome: 'Adaptador Tubo-Câmara Inferior 12mm',
        descricao: 'Adaptador ligação tubo 12mm à câmara de flutuação inferior',
        categoria: 'Adaptadores',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 22.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Gaveta Adaptadores - Compartimento 1',
        refFabricante: 'LEAF-ADT-12-INF-500',
        status: 'ativo',
        especificacao: 'Rosca M16x1.5 | Torque aperto 25 Nm | Material latão cromado | Com O-ring NBR'
      },
      {
        nome: 'Adaptador Tubo-Câmara Superior 12mm',
        descricao: 'Adaptador ligação tubo 12mm à câmara de flutuação superior (arco)',
        categoria: 'Adaptadores',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 22.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Gaveta Adaptadores - Compartimento 1',
        refFabricante: 'LEAF-ADT-12-SUP-501',
        status: 'ativo',
        especificacao: 'Rosca M16x1.5 | Torque aperto 25 Nm | Material latão cromado | Com O-ring NBR'
      },
      {
        nome: 'Adaptador Tubo-Câmara Inferior 14mm',
        descricao: 'Adaptador ligação tubo 14mm à câmara de flutuação inferior',
        categoria: 'Adaptadores',
        quantidade: 40,
        quantidadeMinima: 4,
        precoUnitario: 25.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Gaveta Adaptadores - Compartimento 2',
        refFabricante: 'LEAF-ADT-14-INF-502',
        status: 'ativo',
        especificacao: 'Rosca M18x1.5 | Torque aperto 28 Nm | Material latão cromado | Com O-ring NBR'
      },
      {
        nome: 'Adaptador Tubo-Câmara Superior 14mm',
        descricao: 'Adaptador ligação tubo 14mm à câmara de flutuação superior (arco)',
        categoria: 'Adaptadores',
        quantidade: 40,
        quantidadeMinima: 4,
        precoUnitario: 25.00,
        fornecedor: 'Zodiac / RFD',
        localizacao: 'Gaveta Adaptadores - Compartimento 2',
        refFabricante: 'LEAF-ADT-14-SUP-503',
        status: 'ativo',
        especificacao: 'Rosca M18x1.5 | Torque aperto 28 Nm | Material latão cromado | Com O-ring NBR'
      },
      {
        nome: 'Adaptador Válvula-Tubo OTS65',
        descricao: 'Adaptador de conexão entre válvula OTS65 e tubo principal',
        categoria: 'Adaptadores',
        quantidade: 60,
        quantidadeMinima: 6,
        precoUnitario: 18.00,
        fornecedor: 'Zodiac',
        localizacao: 'Gaveta Adaptadores - Compartimento 3',
        refFabricante: 'LEAF-ADT-OTS65-VT-504',
        status: 'ativo',
        especificacao: 'Torque aperto 15 Nm | Material alumínio anodizado | Vedação com O-ring FKM'
      },
      {
        nome: 'Adaptador Válvula-Tubo A10/B10',
        descricao: 'Adaptador de conexão entre válvula A10/B10 e tubo de pressão 6mm',
        categoria: 'Adaptadores',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 20.00,
        fornecedor: 'HAMMAR / Zodiac',
        localizacao: 'Gaveta Adaptadores - Compartimento 3',
        refFabricante: 'HAMM-ADT-AB10-VT-505',
        status: 'ativo',
        especificacao: 'Torque aperto 12 Nm | Material alumínio anodizado | Vedação dupla com O-ring FKM'
      },

      // ============ FERRAMENTAS ============
      {
        nome: 'Chave Torque Digital 5-80 Nm',
        descricao: 'Chave de torque digital com display LED para apertos precisos',
        categoria: 'Ferramentas',
        quantidade: 3,
        quantidadeMinima: 1,
        precoUnitario: 385.00,
        fornecedor: 'GEDORE / STAHLWILLE',
        localizacao: 'Armário Ferramentas - Gaveta 1',
        refFabricante: 'GEDO-TRQ-080-DIG',
        status: 'ativo',
        especificacao: 'Precisão ±2% | Range 5-80 Nm | Encaixe 1/2" | Certificado ISO 6789'
      },
      {
        nome: 'Chave Dinamométrica 10-50 Nm',
        descricao: 'Chave dinamométrica mecânica com clique',
        categoria: 'Ferramentas',
        quantidade: 5,
        quantidadeMinima: 2,
        precoUnitario: 195.00,
        fornecedor: 'GEDORE / STAHLWILLE',
        localizacao: 'Armário Ferramentas - Gaveta 1',
        refFabricante: 'GEDO-DYN-050-MEC',
        status: 'ativo',
        especificacao: 'Precisão ±3% | Range 10-50 Nm | Encaixe 3/8" | Com estojo'
      },
      {
        nome: 'Jogo Chaves Allen Torx (12 peças)',
        descricao: 'Jogo completo de chaves Allen e Torx para válvulas e adaptadores',
        categoria: 'Ferramentas',
        quantidade: 8,
        quantidadeMinima: 2,
        precoUnitario: 85.00,
        fornecedor: 'GEDORE / WERA',
        localizacao: 'Armário Ferramentas - Gaveta 2',
        refFabricante: 'WERA-ALLEN-TORX-12P',
        status: 'ativo',
        especificacao: 'Allen 1.5-10mm | Torx T10-T50 | Aço cromo-vanádio | Com suporte magnético'
      },
      {
        nome: 'Manómetro Digital 0-10 bar',
        descricao: 'Manómetro digital de alta precisão para testes de pressão',
        categoria: 'Ferramentas',
        quantidade: 4,
        quantidadeMinima: 2,
        precoUnitario: 245.00,
        fornecedor: 'WIKA / DRUCK',
        localizacao: 'Armário Ferramentas - Compartimento Medição',
        refFabricante: 'WIKA-DG10-BAR-001',
        status: 'ativo',
        especificacao: 'Precisão ±0.05% | Range 0-10 bar | Display LCD | Certificado calibração incluído'
      },
      {
        nome: 'Detector Vazamento Ultrassónico',
        descricao: 'Detector ultrassónico de vazamentos de ar comprimido',
        categoria: 'Ferramentas',
        quantidade: 2,
        quantidadeMinima: 1,
        precoUnitario: 1850.00,
        fornecedor: 'UE SYSTEMS',
        localizacao: 'Armário Ferramentas - Compartimento Eletrônica',
        refFabricante: 'UES-ULTRA-LEAK-9000',
        status: 'ativo',
        especificacao: 'Frequência 38-42 kHz | Sensibilidade ajustável | Com fones e sonda extensível'
      },
      {
        nome: 'Kit Instalação Válvulas',
        descricao: 'Kit completo para instalação de válvulas OTS65/A10/B10',
        categoria: 'Ferramentas',
        quantidade: 6,
        quantidadeMinima: 2,
        precoUnitario: 125.00,
        fornecedor: 'Zodiac',
        localizacao: 'Armário Ferramentas - Gaveta 3',
        refFabricante: 'ZODIAC-KIT-VALV-INS',
        status: 'ativo',
        especificacao: 'Inclui chaves especiais, pasta vedante, O-rings, parafusos calibrados'
      },
      {
        nome: 'Chave Específica OTS65',
        descricao: 'Chave de instalação/remoção específica para válvula OTS65',
        categoria: 'Ferramentas',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 45.00,
        fornecedor: 'Zodiac / LEAFIELD',
        localizacao: 'Armário Ferramentas - Gaveta 4',
        refFabricante: 'LEAF-KEY-OTS65-SP',
        status: 'ativo',
        especificacao: 'Encaixe hexagonal 19mm | Comprimento 180mm | Cromada'
      },
      {
        nome: 'Chave Específica A10/B10',
        descricao: 'Chave de instalação/remoção específica para válvulas A10/B10',
        categoria: 'Ferramentas',
        quantidade: 10,
        quantidadeMinima: 2,
        precoUnitario: 48.00,
        fornecedor: 'HAMMAR',
        localizacao: 'Armário Ferramentas - Gaveta 4',
        refFabricante: 'HAMM-KEY-AB10-SP',
        status: 'ativo',
        especificacao: 'Encaixe hexagonal 17mm | Comprimento 200mm | Com limitador de torque'
      },

      // ============ AUTOCOLANTES / ETIQUETAS ============
      {
        nome: 'Autocolante Pressão Trabalho 0.4 bar',
        descricao: 'Etiqueta de identificação de pressão de trabalho 0.4 bar',
        categoria: 'Etiquetas e Identificação',
        quantidade: 500,
        quantidadeMinima: 50,
        precoUnitario: 0.85,
        fornecedor: 'Brady / Zebra',
        localizacao: 'Armário Etiquetas - Caixa 1',
        refFabricante: 'BRADY-PRES-04-BAR-100',
        status: 'ativo',
        especificacao: 'Material poliéster | Resistente UV e água salgada | 50x30mm | Adesivo permanente'
      },
      {
        nome: 'Autocolante SOLAS A-Pack',
        descricao: 'Etiqueta de identificação SOLAS A-Pack',
        categoria: 'Etiquetas e Identificação',
        quantidade: 400,
        quantidadeMinima: 40,
        precoUnitario: 1.20,
        fornecedor: 'Brady / Zebra',
        localizacao: 'Armário Etiquetas - Caixa 1',
        refFabricante: 'BRADY-SOLAS-A-PACK-101',
        status: 'ativo',
        especificacao: 'Material vinil | Resistente UV | 80x50mm | Norma IMO'
      },
      {
        nome: 'Autocolante SOLAS B-Pack',
        descricao: 'Etiqueta de identificação SOLAS B-Pack',
        categoria: 'Etiquetas e Identificação',
        quantidade: 200,
        quantidadeMinima: 20,
        precoUnitario: 1.20,
        fornecedor: 'Brady / Zebra',
        localizacao: 'Armário Etiquetas - Caixa 1',
        refFabricante: 'BRADY-SOLAS-B-PACK-102',
        status: 'ativo',
        especificacao: 'Material vinil | Resistente UV | 80x50mm | Norma IMO'
      },
      {
        nome: 'Etiqueta Data Inspeção',
        descricao: 'Etiqueta para marcação de data de inspeção',
        categoria: 'Etiquetas e Identificação',
        quantidade: 1000,
        quantidadeMinima: 100,
        precoUnitario: 0.65,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 2',
        refFabricante: 'BRADY-INSP-DATE-103',
        status: 'ativo',
        especificacao: 'Material papel sintético | 60x40mm | Espaço para escrita manual'
      },
      {
        nome: 'Etiqueta Próxima Inspeção',
        descricao: 'Etiqueta para marcação de próxima inspeção (2.5 anos)',
        categoria: 'Etiquetas e Identificação',
        quantidade: 1000,
        quantidadeMinima: 100,
        precoUnitario: 0.65,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 2',
        refFabricante: 'BRADY-NEXT-INSP-104',
        status: 'ativo',
        especificacao: 'Material papel sintético | 60x40mm | Pré-impresso "NEXT INSPECTION"'
      },
      {
        nome: 'Autocolante Válvula OTS65',
        descricao: 'Etiqueta de identificação tipo de válvula OTS65',
        categoria: 'Etiquetas e Identificação',
        quantidade: 300,
        quantidadeMinima: 30,
        precoUnitario: 0.75,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 3',
        refFabricante: 'BRADY-VALVE-OTS65-105',
        status: 'ativo',
        especificacao: 'Material poliéster | 40x25mm | Texto "VALVE OTS65"'
      },
      {
        nome: 'Autocolante Válvula A10',
        descricao: 'Etiqueta de identificação tipo de válvula A10',
        categoria: 'Etiquetas e Identificação',
        quantidade: 200,
        quantidadeMinima: 20,
        precoUnitario: 0.75,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 3',
        refFabricante: 'BRADY-VALVE-A10-106',
        status: 'ativo',
        especificacao: 'Material poliéster | 40x25mm | Texto "VALVE A10"'
      },
      {
        nome: 'Autocolante Válvula B10',
        descricao: 'Etiqueta de identificação tipo de válvula B10',
        categoria: 'Etiquetas e Identificação',
        quantidade: 200,
        quantidadeMinima: 20,
        precoUnitario: 0.75,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 3',
        refFabricante: 'BRADY-VALVE-B10-107',
        status: 'ativo',
        especificacao: 'Material poliéster | 40x25mm | Texto "VALVE B10"'
      },
      {
        nome: 'Etiqueta Torque Aperto',
        descricao: 'Etiqueta indicadora de torque de aperto (valores variáveis)',
        categoria: 'Etiquetas e Identificação',
        quantidade: 600,
        quantidadeMinima: 60,
        precoUnitario: 0.55,
        fornecedor: 'Brady',
        localizacao: 'Armário Etiquetas - Caixa 4',
        refFabricante: 'BRADY-TORQUE-VAR-108',
        status: 'ativo',
        especificacao: 'Material vinil | 50x20mm | Valores 8-35 Nm disponíveis'
      },
      {
        nome: 'Autocolante RFD MKIV',
        descricao: 'Etiqueta de identificação de modelo RFD MKIV',
        categoria: 'Etiquetas e Identificação',
        quantidade: 300,
        quantidadeMinima: 30,
        precoUnitario: 1.50,
        fornecedor: 'RFD',
        localizacao: 'Armário Etiquetas - Caixa 5',
        refFabricante: 'RFD-MODEL-MKIV-200',
        status: 'ativo',
        especificacao: 'Material metalizado | 100x60mm | Logo RFD + "MKIV"'
      },
      {
        nome: 'Autocolante DSB LR07',
        descricao: 'Etiqueta de identificação de modelo DSB LR07',
        categoria: 'Etiquetas e Identificação',
        quantidade: 300,
        quantidadeMinima: 30,
        precoUnitario: 1.50,
        fornecedor: 'DSB',
        localizacao: 'Armário Etiquetas - Caixa 5',
        refFabricante: 'DSB-MODEL-LR07-201',
        status: 'ativo',
        especificacao: 'Material metalizado | 100x60mm | Logo DSB + "LR07"'
      },
      {
        nome: 'Código QR Rastreabilidade',
        descricao: 'Etiqueta com QR Code para rastreamento de jangada',
        categoria: 'Etiquetas e Identificação',
        quantidade: 500,
        quantidadeMinima: 50,
        precoUnitario: 1.80,
        fornecedor: 'Brady / Zebra',
        localizacao: 'Armário Etiquetas - Caixa 6',
        refFabricante: 'BRADY-QR-TRACE-300',
        status: 'ativo',
        especificacao: 'Material poliéster | 50x50mm | QR dinâmico + número série'
      },

      // ============ VEDANTES E O-RINGS ============
      {
        nome: 'O-Ring NBR 12x2mm (pack 10)',
        descricao: 'Anel de vedação NBR para adaptadores 12mm',
        categoria: 'Vedantes',
        quantidade: 50,
        quantidadeMinima: 5,
        precoUnitario: 8.50,
        fornecedor: 'Parker / Trelleborg',
        localizacao: 'Gaveta O-Rings - Compartimento 1',
        refFabricante: 'PARK-NBR-12X2-OR100',
        status: 'ativo',
        especificacao: 'Material NBR 70 Shore A | Temperatura -40°C a +100°C | Pack 10 unidades'
      },
      {
        nome: 'O-Ring FKM 14x2mm (pack 10)',
        descricao: 'Anel de vedação FKM para válvulas alta temperatura',
        categoria: 'Vedantes',
        quantidade: 40,
        quantidadeMinima: 4,
        precoUnitario: 15.00,
        fornecedor: 'Parker / Trelleborg',
        localizacao: 'Gaveta O-Rings - Compartimento 2',
        refFabricante: 'PARK-FKM-14X2-OR101',
        status: 'ativo',
        especificacao: 'Material FKM (Viton) 75 Shore A | Temperatura -20°C a +200°C | Pack 10 unidades'
      },
      {
        nome: 'Pasta Vedante Alta Pressão',
        descricao: 'Pasta vedante para roscas de alta pressão',
        categoria: 'Vedantes',
        quantidade: 30,
        quantidadeMinima: 3,
        precoUnitario: 12.00,
        fornecedor: 'Loctite / Three Bond',
        localizacao: 'Armário Químicos - Prateleira 1',
        refFabricante: 'LOCT-HP-SEAL-577',
        status: 'ativo',
        especificacao: 'Resistência 10 bar | Temperatura -55°C a +150°C | Tubo 50ml'
      }
    ]

    console.log(`📦 Inserindo ${componentes.length} componentes técnicos com Part Numbers...`)

    for (const comp of componentes) {
      const descricaoCompleta = comp.especificacao 
        ? `${comp.descricao} | ${comp.especificacao}`
        : comp.descricao

      await prisma.stock.upsert({
        where: { 
          nome_categoria: {
            nome: comp.nome,
            categoria: comp.categoria
          }
        },
        update: {
          quantidade: comp.quantidade,
          quantidadeMinima: comp.quantidadeMinima,
          precoUnitario: comp.precoUnitario,
          status: comp.status,
          localizacao: comp.localizacao,
          fornecedor: comp.fornecedor,
          refFabricante: comp.refFabricante
        },
        create: {
          nome: comp.nome,
          descricao: descricaoCompleta,
          categoria: comp.categoria,
          quantidade: comp.quantidade,
          quantidadeMinima: comp.quantidadeMinima,
          precoUnitario: comp.precoUnitario,
          fornecedor: comp.fornecedor,
          localizacao: comp.localizacao,
          refFabricante: comp.refFabricante,
          status: comp.status
        }
      })
    }

    console.log('\n' + '═'.repeat(80))
    console.log('✨ TODOS OS COMPONENTES TÉCNICOS ADICIONADOS COM SUCESSO!')
    console.log('═'.repeat(80))
    console.log('\n📊 RESUMO DO STOCK (com Part Numbers):')
    console.log('\n🔧 VÁLVULAS (com torques):')
    console.log('  PN: LEAF-OTS65-001    | OTS65 LEAFIELD        - 20 un | Torque: 12/8 Nm')
    console.log('  PN: HAMM-A10-V-002    | A10 Tubo Pressão      - 18 un | Torque: 15/10 Nm')
    console.log('  PN: HAMM-B10-V-003    | B10 Tubo Pressão      - 18 un | Torque: 15/10 Nm')
    console.log('\n📏 TUBOS ALTA PRESSÃO (com torques conexão):')
    console.log('  PN: LEAF-HP12-NYL-100 | Tubo 12mm LEAFIELD    - 50 m  | Torque: 18 Nm')
    console.log('  PN: LEAF-HP14-NYL-101 | Tubo 14mm LEAFIELD    - 40 m  | Torque: 20 Nm')
    console.log('  PN: LEAF-HP16-NYL-102 | Tubo 16mm LEAFIELD    - 30 m  | Torque: 22 Nm')
    console.log('  PN: HAMM-TP6-NYL-200  | Tubo 6mm A10/B10      - 80 m  | Torque: 12 Nm')
    console.log('\n🔌 ADAPTADORES (Tubo-Câmara / Válvula-Tubo):')
    console.log('  PN: LEAF-ADT-12-INF-500    | 12mm Câmara Inferior   - 50 un | Torque: 25 Nm')
    console.log('  PN: LEAF-ADT-12-SUP-501    | 12mm Câmara Superior   - 50 un | Torque: 25 Nm')
    console.log('  PN: LEAF-ADT-14-INF-502    | 14mm Câmara Inferior   - 40 un | Torque: 28 Nm')
    console.log('  PN: LEAF-ADT-14-SUP-503    | 14mm Câmara Superior   - 40 un | Torque: 28 Nm')
    console.log('  PN: LEAF-ADT-OTS65-VT-504  | Válvula-Tubo OTS65     - 60 un | Torque: 15 Nm')
    console.log('  PN: HAMM-ADT-AB10-VT-505   | Válvula-Tubo A10/B10   - 50 un | Torque: 12 Nm')
    console.log('\n🛠️  FERRAMENTAS:')
    console.log('  PN: GEDO-TRQ-080-DIG       | Chave Torque Digital 5-80 Nm    - 3 un')
    console.log('  PN: GEDO-DYN-050-MEC       | Chave Dinamométrica 10-50 Nm    - 5 un')
    console.log('  PN: WIKA-DG10-BAR-001      | Manómetro Digital 0-10 bar      - 4 un')
    console.log('  PN: UES-ULTRA-LEAK-9000    | Detector Vazamento Ultrassónico - 2 un')
    console.log('  PN: LEAF-KEY-OTS65-SP      | Chave Específica OTS65          - 10 un')
    console.log('  PN: HAMM-KEY-AB10-SP       | Chave Específica A10/B10        - 10 un')
    console.log('\n🏷️  AUTOCOLANTES / ETIQUETAS:')
    console.log('  PN: BRADY-PRES-04-BAR-100  | Pressão Trabalho 0.4 bar     - 500 un')
    console.log('  PN: BRADY-SOLAS-A-PACK-101 | SOLAS A-Pack                 - 400 un')
    console.log('  PN: BRADY-SOLAS-B-PACK-102 | SOLAS B-Pack                 - 200 un')
    console.log('  PN: BRADY-INSP-DATE-103    | Data Inspeção                - 1000 un')
    console.log('  PN: BRADY-NEXT-INSP-104    | Próxima Inspeção             - 1000 un')
    console.log('  PN: BRADY-VALVE-OTS65-105  | Válvula OTS65                - 300 un')
    console.log('  PN: BRADY-VALVE-A10-106    | Válvula A10                  - 200 un')
    console.log('  PN: BRADY-VALVE-B10-107    | Válvula B10                  - 200 un')
    console.log('  PN: RFD-MODEL-MKIV-200     | Modelo RFD MKIV              - 300 un')
    console.log('  PN: DSB-MODEL-LR07-201     | Modelo DSB LR07              - 300 un')
    console.log('  PN: BRADY-QR-TRACE-300     | QR Code Rastreabilidade      - 500 un')
    console.log('\n🔩 VEDANTES:')
    console.log('  PN: PARK-NBR-12X2-OR100    | O-Ring NBR 12x2mm (pk 10)    - 50 packs')
    console.log('  PN: PARK-FKM-14X2-OR101    | O-Ring FKM 14x2mm (pk 10)    - 40 packs')
    console.log('  PN: LOCT-HP-SEAL-577       | Pasta Vedante Alta Pressão   - 30 un')
    console.log('\n✅ Total de itens adicionados: ' + componentes.length)
    console.log('✅ Todos com Part Numbers de fabricante')
    console.log('✅ Torques de instalação especificados')
    console.log('═'.repeat(80))

  } catch (error) {
    console.error('❌ Erro:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()

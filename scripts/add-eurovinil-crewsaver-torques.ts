import { prisma } from '../src/lib/prisma';

function parseReferencia(raw: string | null) {
  if (!raw) return { current: {}, pn: null };
  try {
    const parsed = JSON.parse(raw);
    return { current: parsed, pn: null };
  } catch {
    return { current: {}, pn: raw };
  }
}

function getValveList(modelName: string) {
  const upper = modelName.toUpperCase();
  const isLeisureLike = upper.includes('LEISURE') || upper.includes('MARINER');
  if (isLeisureLike) {
    return [
      { modelo: 'SUPERNOVA', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } },
      { modelo: 'BRAVO 2005', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } },
      { modelo: 'PRV VA70', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } }
    ];
  }

  return [
    { modelo: 'SUPERNOVA', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } },
    { modelo: 'PRV VA70', fabricante: 'Eurovinil', torques: { aperto: 25, desaperto: 25 } }
  ];
}

function getSystemInfo(modelName: string, sistemaInsuflacao: string | null, threadHint: string | null) {
  const upper = modelName.toUpperCase();
  const sistema = (sistemaInsuflacao || '').toUpperCase();
  const isVte99 = upper.includes('SYNTESY') || upper.includes('ISO') || sistema.includes('VTE/99');

  if (isVte99) {
    return {
      tipo: 'VTE/99-ISO',
      thread: threadHint || null,
      wrench_torque_nm: 130,
      operating_head_torque_nm: null
    };
  }

  return {
    tipo: 'VTE/87-PED',
    thread: threadHint || null,
    wrench_torque_nm: 100,
    operating_head_torque_nm: 40
  };
}

async function main() {
  console.log('🔧 Adicionando torques para EUROVINIL e CREWSAVER...');

  const marcas = await prisma.marcaJangada.findMany({
    where: { nome: { in: ['EUROVINIL', 'CREWSAVER'] } }
  });

  if (marcas.length === 0) {
    console.log('⚠️  Marcas EUROVINIL/CREWSAVER não encontradas.');
    return;
  }

  const marcaIds = marcas.map((m) => m.id);

  const especificacoes = await prisma.especificacaoTecnica.findMany({
    where: { marcaId: { in: marcaIds } },
    include: { modelo: true, lotacao: true, marca: true }
  });

  if (especificacoes.length === 0) {
    console.log('⚠️  Nenhuma especificação encontrada para EUROVINIL/CREWSAVER.');
    return;
  }

  for (const spec of especificacoes) {
    const { current, pn } = parseReferencia(spec.referenciaCilindro);
    const valves = getValveList(spec.modelo.nome);

    const threadHint = spec.sistemaInsuflacao
      ? spec.sistemaInsuflacao.includes('25E')
        ? '25E'
        : spec.sistemaInsuflacao.includes('17E')
        ? '17E'
        : spec.sistemaInsuflacao.includes('1 NGT')
        ? '1 NGT'
        : null
      : null;

    const systemInfo = getSystemInfo(spec.modelo.nome, spec.sistemaInsuflacao, threadHint);

    const existingCilindros = Array.isArray(current.cilindros) ? current.cilindros : [];
    const cilindroRef =
      existingCilindros[0]?.referencia || pn || (typeof current.referencia === 'string' ? current.referencia : null);

    const cilindros = existingCilindros.length > 0
      ? existingCilindros
      : [
          {
            referencia: cilindroRef,
            capacidade: `${spec.lotacao.capacidade}P`,
            peso_co2: spec.pesoCO2,
            peso_n2: spec.pesoN2,
            pressao_enchimento: 200
          }
        ];

    const merged = {
      ...current,
      cilindros,
      valvulas: valves,
      sistema_insuflacao: systemInfo
    };

    await prisma.especificacaoTecnica.update({
      where: { id: spec.id },
      data: { referenciaCilindro: JSON.stringify(merged) }
    });

    console.log(
      `✅ ${spec.marca.nome} ${spec.modelo.nome} ${spec.lotacao.capacidade}P: torques adicionados`
    );
  }

  console.log('✅ Torques aplicados em todas as especificações EUROVINIL/CREWSAVER.');
}

main()
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });

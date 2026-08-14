import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { buildVerificacaoPayload, computeNextServiceDate } from "@/lib/fatos-imersao-service";

async function syncInspectionCycle(
  fatoImersaoId: number,
  opts?: { dataProxInspecao?: string; intervaloServicoMeses?: number; dataVerificacao?: Date }
) {
  const fato = await prisma.fatoImersao.findUnique({
    where: { id: fatoImersaoId },
    select: { dataFabrico: true, intervaloServicoMeses: true },
  });

  const latest = await prisma.verificacaoFatoImersao.findFirst({
    where: { fatoImersaoId },
    orderBy: [{ dataVerificacao: "desc" }, { id: "desc" }],
    select: { dataVerificacao: true, resultadoGeral: true, codigoBER: true },
  });
  if (!latest?.dataVerificacao) return;

  const dataInspecaoIso = latest.dataVerificacao.toISOString().slice(0, 10);
  let dataProx = opts?.dataProxInspecao;
  let meses = opts?.intervaloServicoMeses ?? fato?.intervaloServicoMeses ?? undefined;

  if (!dataProx) {
    const computed = computeNextServiceDate(dataInspecaoIso, fato?.dataFabrico, false, meses);
    dataProx = computed.dataProx;
    meses = computed.meses;
  }

  const estado =
    latest.codigoBER || latest.resultadoGeral === "BER"
      ? "Condenado"
      : latest.resultadoGeral === "REPARAR"
        ? "Manutenção"
        : undefined;

  await prisma.fatoImersao.update({
    where: { id: fatoImersaoId },
    data: {
      dataInspecao: dataInspecaoIso,
      dataProxInspecao: dataProx,
      ...(meses ? { intervaloServicoMeses: meses } : {}),
      ...(estado ? { estado } : {}),
    },
  });
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const fatoImersaoId = parseInt(id, 10);
    const verificacoes = await prisma.verificacaoFatoImersao.findMany({
      where: { fatoImersaoId },
      orderBy: { dataVerificacao: "desc" },
    });
    return NextResponse.json(verificacoes);
  } catch (error) {
    console.error("Error fetching verificacoes fato imersao:", error);
    return NextResponse.json({ message: "Erro ao listar verificações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const fatoImersaoId = parseInt(id, 10);
    const body = await req.json();

    const exists = await prisma.fatoImersao.findUnique({
      where: { id: fatoImersaoId },
      select: { id: true },
    });
    if (!exists) return NextResponse.json({ message: "Fato de imersão não encontrado" }, { status: 404 });

    const checklist =
      body.checklist && typeof body.checklist === "object"
        ? body.checklist
        : {
            tecidoExterior: body.tecidoExterior,
            costuras: body.costuras,
            fecho: body.fecho,
            fitasReflectoras: body.fitasReflectoras,
            capuz: body.capuz,
            botas: body.botas,
            luvas: body.luvas,
            luz: body.luz,
            apito: body.apito,
            impermeabilidade: body.impermeabilidade || body.leakResultado,
          };

    const payload = buildVerificacaoPayload({
      checklist,
      leakMetodo: body.leakMetodo,
      leakPressaoInicial: body.leakPressaoInicial,
      leakPressaoFinal: body.leakPressaoFinal,
      leakDeltaP: body.leakDeltaP,
      leakUnidade: body.leakUnidade,
      leakDuracaoMin: body.leakDuracaoMin,
      leakResultado: body.leakResultado || body.impermeabilidade,
      leakReTest: body.leakReTest,
      zonasFuga: Array.isArray(body.zonasFuga) ? body.zonasFuga : undefined,
      codigoBER: body.codigoBER,
      motivoBER: body.motivoBER,
      dataVerificacao: body.dataVerificacao,
      inspectorNome: body.inspectorNome,
      observacoes: body.observacoes,
    }) as ReturnType<typeof buildVerificacaoPayload> & Record<string, string | null>;

    const dataVerificacao = body.dataVerificacao ? new Date(body.dataVerificacao) : new Date();

    const verificacao = await prisma.verificacaoFatoImersao.create({
      data: {
        fatoImersaoId,
        tecidoExterior: payload.tecidoExterior,
        costuras: payload.costuras,
        fecho: payload.fecho,
        fitasReflectoras: payload.fitasReflectoras,
        capuz: payload.capuz,
        botas: payload.botas,
        luvas: payload.luvas,
        luz: payload.luz,
        apito: payload.apito,
        impermeabilidade: payload.impermeabilidade,
        checklistJson: payload.checklistJson,
        leakMetodo: payload.leakMetodo,
        leakPressaoInicial: payload.leakPressaoInicial,
        leakPressaoFinal: payload.leakPressaoFinal,
        leakDeltaP: payload.leakDeltaP,
        leakUnidade: payload.leakUnidade,
        leakDuracaoMin: payload.leakDuracaoMin,
        leakResultado: payload.leakResultado,
        leakReTest: payload.leakReTest,
        zonasFugaJson: payload.zonasFugaJson,
        resultadoGeral: payload.resultadoGeral,
        codigoBER: payload.codigoBER,
        motivoBER: payload.motivoBER,
        dataVerificacao,
        inspectorNome: payload.inspectorNome,
        observacoes: payload.observacoes,
      },
    });

    await syncInspectionCycle(fatoImersaoId, {
      dataProxInspecao: body.dataProxInspecao,
      intervaloServicoMeses: body.intervaloServicoMeses,
      dataVerificacao,
    });

    return NextResponse.json(verificacao, { status: 201 });
  } catch (error) {
    console.error("Error creating verificacao fato imersao:", error);
    return NextResponse.json({ message: (error as Error).message || "Erro ao criar verificação" }, { status: 500 });
  }
}

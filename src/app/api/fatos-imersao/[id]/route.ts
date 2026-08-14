import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { canonicalizeDateFields } from "@/lib/date-display";

const COMPONENT_FIELDS = [
  "luzRef",
  "luzLote",
  "luzValidade",
  "apitoRef",
  "apitoLote",
  "apitoValidade",
  "fechoTipo",
  "fechoEstado",
  "botasEstado",
  "luvasEstado",
  "capuzEstado",
  "wristSealsEstado",
  "buddyLineEstado",
  "liftingStropEstado",
  "buoyancyEstado",
  "testeImpermeabilidade",
  "testeFlutuabilidade",
  "testeFecho",
  "leakMetodo",
  "leakPressaoKpa",
  "leakResultado",
  "codigoBER",
  "designNo",
] as const;

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const item = await prisma.fatoImersao.findUnique({
      where: { id },
      include: {
        certificado: true,
        verificacoes: {
          orderBy: { dataVerificacao: "desc" },
        },
      },
    });

    if (!item) return NextResponse.json({ error: "Fato de imersão não encontrado" }, { status: 404 });

    let navio: { id: number; nome: string; matricula: string | null } | null = null;
    if (item.shipId) {
      navio = await prisma.navio.findUnique({
        where: { id: item.shipId },
        select: { id: true, nome: true, matricula: true },
      });
    }

    const history = await prisma.fatoImersaoComponentHistory.findMany({
      where: { fatoImersaoId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      ...item,
      navio,
      componentHistory: history,
    });
  } catch (err) {
    console.error("[API /fatos-imersao/:id] GET:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro ao buscar fato de imersão" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = canonicalizeDateFields(await req.json(), [
      "dataFabrico",
      "dataInspecao",
      "dataProxInspecao",
      "luzValidade",
      "apitoValidade",
    ]);
    const current = await prisma.fatoImersao.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Fato de imersão não encontrado" }, { status: 404 });

    const newShipId =
      body.shipId === null || body.shipId === "" || body.shipId === undefined
        ? null
        : Number(body.shipId);

    if (newShipId !== current.shipId) {
      let origemNome: string | null = null;
      let destinoNome: string | null = null;
      if (current.shipId) {
        const s = await prisma.navio.findUnique({ where: { id: current.shipId }, select: { nome: true } });
        origemNome = s?.nome || null;
      }
      if (newShipId) {
        const s = await prisma.navio.findUnique({ where: { id: newShipId }, select: { nome: true } });
        destinoNome = s?.nome || null;
      }
      await prisma.movimentoEquipamento.create({
        data: {
          tipoEquipamento: "FatoImersao",
          equipamentoId: id,
          serial: current.serial || body.serial || "",
          origemShipId: current.shipId,
          origemShipNome: origemNome,
          destinoShipId: newShipId,
          destinoShipNome: destinoNome,
          motivo: "Alteração de Navio",
        },
      });
    }

    const historyRows: Array<{
      fatoImersaoId: number;
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
      changedByName: string | null;
    }> = [];

    for (const field of COMPONENT_FIELDS) {
      if (!(field in body)) continue;
      const oldVal = (current as Record<string, unknown>)[field] ?? null;
      const newVal = body[field] ?? null;
      if (String(oldVal ?? "") !== String(newVal ?? "")) {
        historyRows.push({
          fatoImersaoId: id,
          fieldName: field,
          oldValue: oldVal != null ? String(oldVal) : null,
          newValue: newVal != null ? String(newVal) : null,
          changedByName: body.changedByName || null,
        });
      }
    }

    if (historyRows.length > 0) {
      await prisma.fatoImersaoComponentHistory.createMany({ data: historyRows });
    }

    const updated = await prisma.fatoImersao.update({
      where: { id },
      data: {
        serial: body.serial !== undefined ? String(body.serial).trim() : undefined,
        shipId: body.shipId !== undefined ? newShipId : undefined,
        marca: body.marca !== undefined ? body.marca : undefined,
        modelo: body.modelo !== undefined ? body.modelo : undefined,
        designNo: body.designNo !== undefined ? body.designNo : undefined,
        tamanho: body.tamanho !== undefined ? body.tamanho : undefined,
        tipo: body.tipo !== undefined ? body.tipo : undefined,
        material: body.material !== undefined ? body.material : undefined,
        estado: body.estado !== undefined ? body.estado : undefined,
        dataFabrico: body.dataFabrico !== undefined ? body.dataFabrico : undefined,
        dataInspecao: body.dataInspecao !== undefined ? body.dataInspecao : undefined,
        dataProxInspecao: body.dataProxInspecao !== undefined ? body.dataProxInspecao : undefined,
        intervaloServicoMeses:
          body.intervaloServicoMeses !== undefined
            ? body.intervaloServicoMeses === null || body.intervaloServicoMeses === ""
              ? null
              : Number(body.intervaloServicoMeses)
            : undefined,
        observacoes: body.observacoes !== undefined ? body.observacoes : undefined,
        luzRef: body.luzRef !== undefined ? body.luzRef : undefined,
        luzLote: body.luzLote !== undefined ? body.luzLote : undefined,
        luzValidade: body.luzValidade !== undefined ? body.luzValidade : undefined,
        apitoRef: body.apitoRef !== undefined ? body.apitoRef : undefined,
        apitoLote: body.apitoLote !== undefined ? body.apitoLote : undefined,
        apitoValidade: body.apitoValidade !== undefined ? body.apitoValidade : undefined,
        fechoTipo: body.fechoTipo !== undefined ? body.fechoTipo : undefined,
        fechoEstado: body.fechoEstado !== undefined ? body.fechoEstado : undefined,
        botasEstado: body.botasEstado !== undefined ? body.botasEstado : undefined,
        luvasEstado: body.luvasEstado !== undefined ? body.luvasEstado : undefined,
        capuzEstado: body.capuzEstado !== undefined ? body.capuzEstado : undefined,
        wristSealsEstado: body.wristSealsEstado !== undefined ? body.wristSealsEstado : undefined,
        buddyLineEstado: body.buddyLineEstado !== undefined ? body.buddyLineEstado : undefined,
        liftingStropEstado: body.liftingStropEstado !== undefined ? body.liftingStropEstado : undefined,
        buoyancyEstado: body.buoyancyEstado !== undefined ? body.buoyancyEstado : undefined,
        testeImpermeabilidade: body.testeImpermeabilidade !== undefined ? body.testeImpermeabilidade : undefined,
        testeFlutuabilidade: body.testeFlutuabilidade !== undefined ? body.testeFlutuabilidade : undefined,
        testeFecho: body.testeFecho !== undefined ? body.testeFecho : undefined,
        leakMetodo: body.leakMetodo !== undefined ? body.leakMetodo : undefined,
        leakPressaoKpa: body.leakPressaoKpa !== undefined ? body.leakPressaoKpa : undefined,
        leakResultado: body.leakResultado !== undefined ? body.leakResultado : undefined,
        codigoBER: body.codigoBER !== undefined ? body.codigoBER : undefined,
      },
      include: {
        certificado: true,
        verificacoes: { orderBy: { dataVerificacao: "desc" }, take: 5 },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[API /fatos-imersao/:id] PUT:", err);
    return NextResponse.json({ error: (err as Error).message || "Erro ao atualizar fato de imersão" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: rawId } = await context.params;
    const id = parseInt(rawId, 10);
    await prisma.fatoImersao.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "Erro ao eliminar" }, { status: 500 });
  }
}

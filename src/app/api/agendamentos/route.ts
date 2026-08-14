import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface AgendamentoDelegate {
  create: (args: { data: Record<string, unknown> }) => Promise<unknown>
  createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>
  findMany: () => Promise<unknown>
}

const agendamentoDelegate = (prisma as unknown as { agendamento?: AgendamentoDelegate }).agendamento;

function unsupportedModelResponse() {
  return NextResponse.json(
    { error: "Modelo 'agendamento' indisponível no Prisma Client atual." },
    { status: 501 }
  );
}

// Criação de agendamento individual ou em massa
export async function POST(req: NextRequest) {
  if (!agendamentoDelegate) return unsupportedModelResponse();

  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await agendamentoDelegate.createMany({ data: body });
      return NextResponse.json({ count: created.count });
    } else {
      const created = await agendamentoDelegate.create({ data: body });
      return NextResponse.json(created);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar agendamento', details: error }, { status: 500 });
  }
}

// Listagem de agendamentos
export async function GET() {
  if (!agendamentoDelegate) return unsupportedModelResponse();

  try {
    const agendamentos = await agendamentoDelegate.findMany();
    return NextResponse.json(agendamentos);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar agendamentos', details: error }, { status: 500 });
  }
}

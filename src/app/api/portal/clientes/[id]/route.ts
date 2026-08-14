import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthSession } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão obrigatória." }, { status: 401 });
    }
    if (session.user.role === "CLIENTE") {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "ID de cliente inválido." }, { status: 400 });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      select: { id: true, nome: true },
    });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }

    const [ordens, navios] = await Promise.all([
      prisma.ordemServico.findMany({
        where: { clienteId: id },
        include: {
          jangada: {
            select: {
              id: true,
              brand: true,
              model: true,
              serial: true,
            },
          },
        },
        orderBy: { dataAbertura: "desc" },
      }),
      prisma.navio.findMany({
        where: { clienteId: id },
        select: { id: true, nome: true, ilha: true },
      }),
    ]);

    const shipIds = navios.map((navio) => navio.id);
    const jangadas = await prisma.jangada.findMany({
      where: { shipId: { in: shipIds } },
      select: {
        id: true,
        brand: true,
        model: true,
        serial: true,
        shipId: true,
      },
    });

    return NextResponse.json({
      cliente,
      ordens,
      navios,
      jangadas: jangadas.map((jangada) => ({
        ...jangada,
        shipId: jangada.shipId ?? 0,
      })),
    });
  } catch (error: unknown) {
    console.error("Erro ao obter dados do cliente:", error);
    const message = error instanceof Error ? error.message : "Erro ao obter dados do cliente.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
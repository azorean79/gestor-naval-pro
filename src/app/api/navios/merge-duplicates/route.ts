import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET — lista navios duplicados (case-insensitive)
// POST — faz merge dos duplicados (mantém o que tem mais jangadas)
export async function GET() {
  try {
    const allShips = await prisma.navio.findMany({
      select: {
        id: true,
        nome: true,
        matricula: true,
        ilha: true,
        tipoPesca: true,
        clienteId: true,
        ativo: true,
      },
      orderBy: { nome: "asc" },
    });

    // Agrupar por nome normalizado (case-insensitive, trim, normalize accents)
    const groups: Record<string, typeof allShips> = {};
    for (const ship of allShips) {
      const key = ship.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      if (!groups[key]) groups[key] = [];
      groups[key].push(ship);
    }

    // Filtrar apenas os que têm duplicados
    const duplicates = Object.entries(groups)
      .filter(([, ships]) => ships.length > 1)
      .map(([key, ships]) => ({
        normalizedName: key,
        count: ships.length,
        ships,
      }));

    return NextResponse.json({
      totalShips: allShips.length,
      duplicateGroups: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error("Error finding duplicate ships:", error);
    return NextResponse.json({ error: "Erro ao procurar navios duplicados." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dryRun = true } = body || {};

    const allShips = await prisma.navio.findMany({
      orderBy: { nome: "asc" },
    });

    // Agrupar por nome normalizado
    const groups: Record<string, typeof allShips> = {};
    for (const ship of allShips) {
      const key = ship.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      if (!groups[key]) groups[key] = [];
      groups[key].push(ship);
    }

    const duplicateGroups = Object.entries(groups).filter(([, ships]) => ships.length > 1);

    if (duplicateGroups.length === 0) {
      return NextResponse.json({ message: "Nenhum navio duplicado encontrado.", merged: 0 });
    }

    const mergeResults: Array<{
      kept: { id: number; nome: string };
      merged: Array<{ id: number; nome: string }>;
      updates: Record<string, number>;
    }> = [];

    for (const [, ships] of duplicateGroups) {
      // Para cada grupo, contar as dependências de cada navio
      const shipStats = await Promise.all(
        ships.map(async (ship) => {
          const [jangadasCount, coleteCount, epirbCount, inspecaoCount, ordemCount] = await Promise.all([
            prisma.jangada.count({ where: { shipId: ship.id } }),
            prisma.colete.count({ where: { shipId: ship.id } }),
            prisma.epirb.count({ where: { shipId: ship.id } }),
            prisma.inspecao.count({ where: { navioId: ship.id } }),
            prisma.ordemServico.count({ where: { shipId: ship.id } }),
          ]);
          return {
            ...ship,
            totalDeps: jangadasCount + coleteCount + epirbCount + inspecaoCount + ordemCount,
            jangadasCount,
            coleteCount,
            epirbCount,
            inspecaoCount,
            ordemCount,
          };
        })
      );

      // Manter o que tem mais dependências (ou o primeiro por ID se iguais)
      shipStats.sort((a, b) => b.totalDeps - a.totalDeps || a.id - b.id);
      const keeper = shipStats[0];
      const toMerge = shipStats.slice(1);

      if (!dryRun) {
        // Escolher o melhor nome: preferir a versão com capitalização mista (tem acentos correctos)
        // Ex: preferir "Vilaçor" sobre "VILAÇOR", "Três Pastorinhos" sobre "TRES PASTORINHOS"
        const allNames = shipStats.map((s) => s.nome);
        const mixedCaseName = allNames.find((n) => n !== n.toUpperCase() && n !== n.toLowerCase());
        const bestName = mixedCaseName || keeper.nome;

        for (const dup of toMerge) {
          // Mover todas as referências para o keeper
          await prisma.jangada.updateMany({ where: { shipId: dup.id }, data: { shipId: keeper.id } });
          // Também atualizar shipNameManual nas jangadas que referenciam o nome antigo
          await prisma.jangada.updateMany({ 
            where: { shipNameManual: dup.nome }, 
            data: { shipNameManual: bestName } 
          });
          await prisma.colete.updateMany({ where: { shipId: dup.id }, data: { shipId: keeper.id } });
          await prisma.epirb.updateMany({ where: { shipId: dup.id }, data: { shipId: keeper.id } });
          await prisma.inspecao.updateMany({ where: { navioId: dup.id }, data: { navioId: keeper.id, navioNome: bestName } });
          await prisma.ordemServico.updateMany({ where: { shipId: dup.id }, data: { shipId: keeper.id } });

          // Copiar dados úteis do duplicado (matricula, clienteId) se o keeper não os tem
          if ((!keeper.matricula || keeper.matricula === "N/D") && dup.matricula && dup.matricula !== "N/D") {
            await prisma.navio.update({ where: { id: keeper.id }, data: { matricula: dup.matricula } });
          }
          if (!keeper.clienteId && dup.clienteId) {
            await prisma.navio.update({ where: { id: keeper.id }, data: { clienteId: dup.clienteId } });
          }
          if ((!keeper.tipoPesca || keeper.tipoPesca === "N/D") && dup.tipoPesca && dup.tipoPesca !== "N/D") {
            await prisma.navio.update({ where: { id: keeper.id }, data: { tipoPesca: dup.tipoPesca } });
          }

          // Apagar o navio duplicado
          await prisma.navio.delete({ where: { id: dup.id } });
        }

        // Atualizar o nome do keeper com a versão correcta (acentos preservados)
        await prisma.navio.update({
          where: { id: keeper.id },
          data: { nome: bestName },
        });
      }

      mergeResults.push({
        kept: { id: keeper.id, nome: keeper.nome },
        merged: toMerge.map((dup) => ({ id: dup.id, nome: dup.nome })),
        updates: {
          jangadas: toMerge.reduce((a, d) => a + d.jangadasCount, 0),
          coletes: toMerge.reduce((a, d) => a + d.coleteCount, 0),
          epirbs: toMerge.reduce((a, d) => a + d.epirbCount, 0),
          inspecoes: toMerge.reduce((a, d) => a + d.inspecaoCount, 0),
          ordensServico: toMerge.reduce((a, d) => a + d.ordemCount, 0),
        },
      });
    }

    return NextResponse.json({
      dryRun,
      message: dryRun
        ? "Simulação completa. Envie { dryRun: false } para aplicar."
        : `Merge concluído! ${mergeResults.length} grupo(s) unificado(s).`,
      merged: mergeResults.length,
      details: mergeResults,
    });
  } catch (error) {
    console.error("Error merging duplicate ships:", error);
    return NextResponse.json({ error: "Erro ao fazer merge de navios." }, { status: 500 });
  }
}

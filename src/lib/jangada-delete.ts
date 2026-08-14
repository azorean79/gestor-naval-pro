import prisma from "@/lib/prisma";

export async function deleteJangadaById(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("ID de jangada inválido.");
  }

  return prisma.$transaction(async (tx) => {
    const jangada = await tx.jangada.findUnique({
      where: { id },
      select: { id: true, serial: true },
    });

    if (!jangada) {
      throw new Error("Jangada não encontrada.");
    }

    const ordemRows = await tx.ordemServico.findMany({
      where: { jangadaId: id },
      select: { id: true },
    });
    const ordemIds = ordemRows.map((row) => row.id);

    if (ordemIds.length > 0) {
      await tx.serviceStationQueue.deleteMany({
        where: {
          OR: [
            { jangadaId: id },
            { ordemServicoId: { in: ordemIds } },
          ],
        },
      });

      await tx.ordemServicoJangada.deleteMany({ where: { jangadaId: id } });
      await tx.ordemServico.deleteMany({ where: { id: { in: ordemIds } } });
    } else {
      await tx.serviceStationQueue.deleteMany({ where: { jangadaId: id } });
    }

    await tx.artigoJangada.deleteMany({ where: { jangadaId: id } });

    await tx.inspecao.updateMany({
      where: {
        OR: [
          { jangadaId: id },
          ...(jangada.serial ? [{ jangadaSerial: jangada.serial }] : []),
        ],
      },
      data: {
        jangadaId: null,
        jangadaSerial: null,
      },
    });

    if (jangada.serial) {
      await tx.certificadoExtraido.updateMany({
        where: { raftSerial: jangada.serial },
        data: { raftSerial: null },
      });
    }

    await tx.jangada.delete({ where: { id } });

    return { success: true, id };
  });
}

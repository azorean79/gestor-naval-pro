import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
try {
  const j = await p.jangada.findFirst({ where: { id: 1 } });
  const order = await p.ordemServico.create({
    data: {
      numeroOrdem: "E2E-TEST-" + Date.now(),
      serviceStationId: j?.serviceStationId ?? null,
      jangadaId: 1,
      shipId: j?.shipId ?? null,
      tipo: "inspecao",
      prioridade: "normal",
      status: "pendente",
      descricao: "probe",
      tecnicoResponsavel: "E2E",
      durationMinutes: 210,
      metadados: JSON.stringify({ origem: "e2e" }),
    },
  });
  console.log("created", order.id, order.numeroOrdem);
  try {
    const c = await p.ordemServicoChecklistItem.createMany({
      data: [{ ordemServicoId: order.id, phase: "pre", label: "test", done: false }],
    });
    console.log("checklist", c);
  } catch (e) {
    console.log("checklist err", e.message?.slice(0,300));
  }
  try {
    const l = await p.ordemServicoLog.create({
      data: { ordemServicoId: order.id, type: "CREATE", message: "probe", user: "e2e" },
    });
    console.log("log", l.id);
  } catch (e) {
    console.log("log err", e.message?.slice(0,300));
  }
  try {
    await p.ordemServicoJangada.create({ data: { ordemServicoId: order.id, jangadaId: 1 } });
    console.log("link ok");
  } catch (e) {
    console.log("link err", e.message?.slice(0,300));
  }
} catch (e) {
  console.error("CREATE ERR", e.message?.slice(0,500));
} finally {
  await p.$disconnect();
}

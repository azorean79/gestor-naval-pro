import React from "react";
import prisma from "@/lib/prisma";
import InspecoesClient from "./InspecoesClient";

export default async function InspecoesPage() {
  const inspecoes = await prisma.inspecao.findMany({
    orderBy: {
      dataInspecao: "desc",
    },
    select: {
      id: true,
      certificadoNumero: true,
      navioNome: true,
      jangadaSerial: true,
      jangadaId: true,
      dataInspecao: true,
      status: true,
      createdAt: true,
      artigos: {
        select: {
          id: true,
          name: true,
          quantidade: true,
          validade: true,
          referencia: true,
        }
      }
    },
  });

  // Convert dates to strings for the client
  const safeInspecoes = inspecoes.map((insp) => ({
    ...insp,
    createdAt: insp.createdAt.toISOString(),
    artigos: insp.artigos.map(a => ({
      ...a,
      validade: a.validade ? a.validade.toISOString().slice(0, 10) : null
    }))
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Registo de Inspeções</h1>
          <p className="text-slate-500 mt-1">Histórico completo de todas as inspeções realizadas organizadas por mês.</p>
        </div>
      </div>
      
      <InspecoesClient initialData={safeInspecoes} />
    </div>
  );
}

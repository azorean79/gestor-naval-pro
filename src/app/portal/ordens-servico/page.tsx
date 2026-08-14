import React, { Suspense } from "react";
import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import PortalOrdensList from "./PortalOrdensList";

export default async function PortalOrdensPage() {
  const session = await getAuthSession();
  if (!session?.user) {
    redirect("/login");
  }

  // Visto internamente por ADMIN/USER: mostra todas as ordens.
  // O papel CLIENTE (portal externo) deixa de ter acesso a este ecrã.
  if (session.user.role === "CLIENTE") {
    redirect("/");
  }

  const clienteId = session.user.clienteId ? Number(session.user.clienteId) : undefined;

  const clientes = session.user.clienteId
    ? []
    : await prisma.cliente.findMany({
        select: { id: true, nome: true, numeroCliente: true },
        orderBy: { nome: "asc" },
      });

  // Fetch service orders with associated equipment
  const ordens = await prisma.ordemServico.findMany({
    where: clienteId ? { clienteId } : undefined,
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
  });

  // Quando visto internamente (sem cliente específico), carrega todos os navios e jangadas.
  const navios = clienteId
    ? await prisma.navio.findMany({
        where: { clienteId },
        select: {
          id: true,
          nome: true,
          ilha: true,
        },
      })
    : await prisma.navio.findMany({
        select: {
          id: true,
          nome: true,
          ilha: true,
        },
        orderBy: { nome: "asc" },
      });

  const shipIds = navios.map(n => n.id);

  const jangadas = await prisma.jangada.findMany({
    where: { shipId: { in: shipIds } },
    select: {
      id: true,
      brand: true,
      model: true,
      serial: true,
      shipId: true,
    },
    orderBy: { serial: "asc" },
  });

  const serializedJangadas = jangadas.map(j => ({
    ...j,
    shipId: j.shipId ?? 0,
  }));

  return (
    <div className="py-4 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ordens de Serviço</h1>
        <p className="text-sm text-slate-500">
          Gestão das inspeções técnicas e serviços solicitados para o equipamento dos clientes.
        </p>
      </div>

      <Suspense fallback={<div className="text-slate-500 text-xs py-4">A carregar ordens de serviço...</div>}>
        <PortalOrdensList ordens={ordens} navios={navios} jangadas={serializedJangadas} clientes={clientes} />
      </Suspense>
    </div>
  );
}

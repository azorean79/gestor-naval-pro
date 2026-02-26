import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/formatDate';
import React from 'react';

export default async function DashboardPage() {
  const now = new Date();
  const in30 = new Date();
  in30.setDate(now.getDate() + 30);

  // Fetch stock items and filter low stock in-memory (Prisma can't compare two columns directly)
  const allStock = await prisma.itemStock.findMany({
    select: { id: true, nome: true, quantidadeAtual: true, quantidadeMinima: true, status: true }
  });

  const lowStock = allStock.filter(item => {
    if (item.quantidadeMinima === null || item.quantidadeMinima === undefined) return false;
    return (item.quantidadeAtual ?? 0) <= (item.quantidadeMinima ?? 0);
  });

  // Fetch inspections
  let expiredInspections: any[] = [];
  let upcomingInspections: any[] = [];
  try {
    expiredInspections = await prisma.inspecao.findMany({
      where: {
        dataInspecao: { lt: now },
        NOT: { status: 'concluida' }
      },
      orderBy: { dataInspecao: 'asc' },
      take: 50
    });

    upcomingInspections = await prisma.inspecao.findMany({
      where: {
        dataInspecao: { gte: now, lte: in30 },
        NOT: { status: 'concluida' }
      },
      orderBy: { dataInspecao: 'asc' },
      take: 50
    });
  } catch (err) {
    console.warn('Prisma error fetching inspections for dashboard:', err);
    expiredInspections = [];
    upcomingInspections = [];
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
            <CardDescription>Itens com stock abaixo do mínimo</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p>Nenhum item com stock baixo.</p>
            ) : (
              <ul className="space-y-2">
                {lowStock.map(item => (
                  <li key={item.id} className="flex justify-between items-center">
                    <Link href={`/stock/${item.id}/editar`} className="text-blue-600">{item.nome}</Link>
                    <span className="text-sm text-gray-600">{(item.quantidadeAtual ?? 0)} / {(item.quantidadeMinima ?? 0)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <Link href="/stock">
                <Button variant="secondary">Ver Stock</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspeções Caducadas</CardTitle>
            <CardDescription>Inspeções com data passada e não concluídas</CardDescription>
          </CardHeader>
          <CardContent>
            {expiredInspections.length === 0 ? (
              <p>Nenhuma inspeção caducada.</p>
            ) : (
              <ul className="space-y-2">
                {expiredInspections.map(i => (
                  <li key={i.id} className="flex justify-between items-center">
                    <Link href={`/agenda/inspecao/${i.id}`} className="text-red-600">{i.equipamentoNome} — {i.tipoInspecao}</Link>
                    <span className="text-sm text-gray-600">{formatDate(i.dataInspecao)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <Link href="/agenda">
                <Button variant="secondary">Ir para Agenda</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inspeções Próximas (30 dias)</CardTitle>
            <CardDescription>Inspeções agendadas nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingInspections.length === 0 ? (
              <p>Sem inspeções nos próximos 30 dias.</p>
            ) : (
              <ul className="space-y-2">
                {upcomingInspections.map(i => (
                  <li key={i.id} className="flex justify-between items-center">
                    <Link href={`/agenda/inspecao/${i.id}`} className="text-amber-600">{i.equipamentoNome} — {i.tipoInspecao}</Link>
                    <span className="text-sm text-gray-600">{formatDate(i.dataInspecao)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4">
              <Link href="/agenda">
                <Button variant="secondary">Ver Agenda</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
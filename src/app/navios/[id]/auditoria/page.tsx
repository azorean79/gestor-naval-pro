import React from "react";
import prisma from "@/lib/prisma";
import { getAuthSession } from "@/auth";
import { redirect } from "next/navigation";
import AuditoriaCaisClient from "./AuditoriaCaisClient";

export default async function AuditoriaCaisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) redirect("/navios");

  const session = await getAuthSession();
  if (!session) redirect("/api/auth/signin");

  const navio = await prisma.navio.findUnique({
    where: { id },
    include: {
      cliente: true
    }
  });

  if (!navio) redirect("/navios");

  const jangadas = await prisma.jangada.findMany({ where: { shipId: id } });
  const coletes = await prisma.colete.findMany({ where: { shipId: id } });
  const epirbs = await prisma.epirb.findMany({ where: { shipId: id } });

  const navioWithEquip = {
    ...navio,
    jangadas,
    coletes,
    epirbs
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6">
      <div className="max-w-4xl mx-auto px-4">
        <AuditoriaCaisClient navio={navioWithEquip} />
      </div>
    </div>
  );
}

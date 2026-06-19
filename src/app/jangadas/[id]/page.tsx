import React from 'react';
import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import JangadaDetailPageClient from './JangadaDetailPageClient';

export default async function JangadaInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();

  if (!session) {
    redirect('/api/auth/signin');
  }

  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) {
    redirect('/jangadas');
  }

  // Build absolute URL for server-side fetch
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${baseUrl}/api/jangadas/${id}`, {
    cache: 'no-store',
    headers: {
      Cookie: cookieHeader,
    },
  });
  const jangada = res.ok ? await res.json() : null;

  // Retrieve the list of navios for the dropdown list in editing mode
  const ships = await prisma.navio.findMany({
    select: {
      id: true,
      nome: true,
      matricula: true,
    },
    orderBy: {
      nome: 'asc',
    },
  });

  return (
    <JangadaDetailPageClient
      jangadaId={numericId}
      initialData={jangada}
      ships={ships}
    />
  );
}

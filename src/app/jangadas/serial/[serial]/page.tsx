import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

type Jangada = any;

function normalizeCapacityValue(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Math.trunc(numeric);
}

function formatCapacityValue(value: unknown): string {
  const normalized = normalizeCapacityValue(value);
  return normalized === null ? '-' : String(normalized);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ serial: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { serial } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') || 'http';
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host');

  if (!host) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold">Erro ao carregar jangada</h2>
        <p>Não foi possível resolver o endereço do servidor para abrir a ficha.</p>
      </div>
    );
  }

  const apiUrl = `${protocol}://${host}/api/jangadas/serial/${encodeURIComponent(serial)}`;
  const res = await fetch(apiUrl, { cache: 'no-store' });
  const jangada: Jangada = await res.json();

  if (!res.ok) return (
    <div className="p-8">
      <h2 className="text-xl font-bold">Jangada não encontrada</h2>
      <p>{jangada?.error || 'Erro ao carregar'}</p>
    </div>
  );

  const startInspectionParam = resolvedSearchParams?.startInspection;
  const shouldStartInspection = Array.isArray(startInspectionParam)
    ? startInspectionParam[0] === '1'
    : startInspectionParam === '1';

  if (jangada?.id) {
    if (shouldStartInspection) {
      redirect(`/jangadas/${jangada.id}?startInspection=1&fromSerial=1`);
    }
    redirect(`/jangadas/${jangada.id}`);
  }

  const artigos = (() => {
    try {
      const a = jangada.artigos;
      if (!a) return [];
      return typeof a === 'string' ? JSON.parse(a) : a;
    } catch (e) { return []; }
  })();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Ficha Jangada — {jangada.serial}</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><b>Marca / Modelo:</b> {jangada.brand} / {jangada.model}</div>
          <div><b>Lotação:</b> {formatCapacityValue(jangada.capacity)}</div>
          <div><b>Tipo Pack:</b> {jangada.packType}</div>
          <div><b>Proprietário:</b> {jangada.owner || '-'}</div>
          <div><b>Data Fabrico:</b> {jangada.dataFabrico || '-'}</div>
          <div><b>Data Inspeção:</b> {jangada.dataInspecao || '-'}</div>
          <div><b>Próx. Insp.:</b> {jangada.dataProxInspecao || '-'}</div>
          <div><b>Navio:</b> {jangada.shipNameManual || '-'}</div>
        </div>

        <section className="mt-6">
          <h3 className="font-semibold">Cilindro</h3>
          <ul className="ml-4 list-disc text-sm">
            <li>Serial: {jangada.cylinderSerial || '-'}</li>
            <li>Tara: {jangada.cylinderTara || '-'}</li>
            <li>Peso Bruto: {jangada.cylinderPesoBruto || '-'}</li>
            <li>CO2: {jangada.cylinderCo2 || '-'}</li>
            <li>N2: {jangada.cylinderN2 || '-'}</li>
            <li>Data Teste: {jangada.cylinderDataTeste || '-'}</li>
            <li>Próx. Teste: {jangada.cylinderDataProxTeste || '-'}</li>
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold">Artigos</h3>
          <ul className="ml-4 list-disc text-sm">
            {artigos.length === 0 && <li>Nenhum artigo associado.</li>}
            {artigos.map((a: any, i: number) => (
              <li key={i}>{a.name || a.item || JSON.stringify(a)} — Qtd: {a.quantidade ?? a.qtd ?? '-'} — Validade: {a.validade || a.validity || '-'}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h3 className="font-semibold">Certificados extraídos</h3>
          <ul className="ml-4 list-disc text-sm">
            {(jangada.certificadosExtraidos || []).length === 0 && <li>Nenhum certificado extraído.</li>}
            {(jangada.certificadosExtraidos || []).map((c: any) => (
              <li key={c.id}>{c.fileName} — Inspecão: {c.dataInspecao || '-'} — Validades: {c.validities?.length || 0}</li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex gap-2">
          <a href="/jangadas" className="px-3 py-2 bg-gray-200 rounded">Voltar</a>
          <button onClick={() => window.print()} className="px-3 py-2 bg-blue-600 text-white rounded">Imprimir</button>
        </div>
      </div>
    </div>
  );
}

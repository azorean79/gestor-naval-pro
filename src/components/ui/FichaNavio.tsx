"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Select } from "./select";

import { useProprietarios } from "@/hooks/use-proprietarios";
import { useJangadas } from "@/hooks/use-jangadas";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

import type { Navio } from "@/lib/types";

interface FichaNavioProps {
  navio: Navio;
  onSave?: (navio: Navio) => void;
}

export function FichaNavio({ navio, onSave }: FichaNavioProps) {
  const { data: proprietarios = [], isLoading: loadingProprietarios } = useProprietarios();
  const { data: jangadas = [] } = useJangadas();
  const jangadasDoNavio = jangadas.filter((j: any) => j.navioId === navio.id);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    ...navio,
    certificados: navio.certificados ? [...navio.certificados] : [],
    equipamentos: navio.equipamentos ? [...navio.equipamentos] : [],
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f: any) => {
      const updated = { ...f, [name]: value };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f: any) => {
      const updated = { ...f, [name]: value === '' ? undefined : Number(value) };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleCertChange(idx: number, field: string, value: string) {
    setForm((f: any) => {
      const certificados = [...(f.certificados || [])];
      certificados[idx] = { ...certificados[idx], [field]: value };
      const updated = { ...f, certificados };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleAddCert() {
    setForm((f: any) => {
      const updated = {
        ...f,
        certificados: [
          ...(f.certificados || []),
          {
            id: Math.random().toString(36).substring(2),
            tipo: '',
            numero: '',
            emissor: '',
            dataEmissao: new Date(),
            dataValidade: new Date(),
            status: "valido" as "valido" | "expirando" | "expirado",
          },
        ],
      };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleRemoveCert(idx: number) {
    setForm((f: any) => {
      const certificados = [...(f.certificados || [])];
      certificados.splice(idx, 1);
      const updated = { ...f, certificados };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleEquipChange(idx: number, field: string, value: string) {
    setForm((f: any) => {
      const equipamentos = [...(f.equipamentos || [])];
      equipamentos[idx] = { ...equipamentos[idx], [field]: value };
      const updated = { ...f, equipamentos };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleAddEquip() {
    setForm((f: any) => {
      const novoEquipamento = {
        id: Math.random().toString(36).substring(2),
        nome: '',
        tipo: '',
        fabricante: '',
        modelo: '',
        numeroSerie: '',
        dataInstalacao: new Date(),
        status: 'operacional' as const,
      };
      const updated = {
        ...f,
        equipamentos: [
          ...(f.equipamentos || []),
          novoEquipamento,
        ],
      };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleRemoveEquip(idx: number) {
    setForm((f: any) => {
      const equipamentos = [...(f.equipamentos || [])];
      equipamentos.splice(idx, 1);
      const updated = { ...f, equipamentos };
      if (onSave) onSave(updated);
      return updated;
    });
  }

  function handleSave() {
    setEdit(false);
    if (onSave) onSave(form);
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          {edit ? (
            <Input name="nome" value={form.nome || ''} onChange={handleChange} placeholder="Nome do navio" className="text-2xl font-bold mb-1" />
          ) : (
            <CardTitle className="text-2xl font-bold">{navio.nome || '-'}</CardTitle>
          )}
          <CardDescription className="text-gray-500">{navio.tipo || "Tipo não informado"}</CardDescription>
        </div>
        <Button variant="outline" onClick={() => setEdit((v) => !v)}>
          {edit ? "Cancelar" : "Editar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {edit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="imo" value={form.imo || ''} onChange={handleChange} placeholder="IMO" />
            <Input name="mmsi" value={form.mmsi || ''} onChange={handleChange} placeholder="MMSI" />
            <Input name="matricula" value={form.matricula || ''} onChange={handleChange} placeholder="Matrícula" />
            <Input name="bandeira" value={form.bandeira || ''} onChange={handleChange} placeholder="Bandeira" />
            <Input name="tipo" value={form.tipo || ''} onChange={handleChange} placeholder="Tipo" />
            <Input name="comprimento" type="number" value={form.comprimento ?? ''} onChange={handleNumberChange} placeholder="Comprimento (m)" />
            <Input name="largura" type="number" value={form.largura ?? ''} onChange={handleNumberChange} placeholder="Largura (m)" />
            <Input name="calado" type="number" value={form.calado ?? ''} onChange={handleNumberChange} placeholder="Calado (m)" />
            <Input name="capacidade" type="number" value={form.capacidade ?? ''} onChange={handleNumberChange} placeholder="Capacidade (t)" />
            <div className="space-y-2">
              <label className="text-sm font-medium">Proprietário</label>
              <Input name="proprietario" value={form.proprietario || ''} onChange={handleChange} placeholder="Proprietário" />
            </div>
            <Input name="armador" value={form.armador || ''} onChange={handleChange} placeholder="Armador" />
            <Input name="ultimaInspecao" type="date" value={form.ultimaInspecao ? (typeof form.ultimaInspecao === 'string' ? form.ultimaInspecao : form.ultimaInspecao.toISOString().slice(0, 10)) : ''} onChange={handleChange} placeholder="Última Inspeção" />
            <Input name="proximaInspecao" type="date" value={form.proximaInspecao ? (typeof form.proximaInspecao === 'string' ? form.proximaInspecao : form.proximaInspecao.toISOString().slice(0, 10)) : ''} onChange={handleChange} placeholder="Próxima Inspeção" />
            <Textarea name="observacoes" value={form.observacoes || ''} onChange={handleChange} placeholder="Observações" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><b>IMO:</b> {navio.imo || "-"}</div>
            <div><b>MMSI:</b> {navio.mmsi || "-"}</div>
            <div><b>Matrícula:</b> {navio.matricula || "-"}</div>
            <div><b>Bandeira:</b> {navio.bandeira || "-"}</div>
            <div><b>Tipo:</b> {navio.tipo || "-"}</div>
            <div><b>Comprimento:</b> {navio.comprimento ?? "-"}</div>
            <div><b>Largura:</b> {navio.largura ?? "-"}</div>
            <div><b>Calado:</b> {navio.calado ?? "-"}</div>
            <div><b>Capacidade:</b> {navio.capacidade ?? "-"}</div>
            <div><b>Proprietário:</b> {navio.proprietario ? (
              <Link href={`/clientes/${navio.proprietario}`} className="text-blue-600 hover:underline">{navio.proprietario}</Link>
            ) : "-"}</div>
            <div><b>Armador:</b> {navio.armador || "-"}</div>
            <div><b>Última Inspeção:</b> {navio.ultimaInspecao ? formatDate(navio.ultimaInspecao) : "-"}</div>
            <div><b>Próxima Inspeção:</b> {navio.proximaInspecao ? formatDate(navio.proximaInspecao) : "-"}</div>
            <div className="md:col-span-2"><b>Observações:</b> {navio.observacoes || "-"}</div>
          </div>
        )}

        {/* Certificados */}
        <div className="mt-4">
          <b>Certificados:</b>
          {edit ? (
            <div>
              {(form.certificados || []).map((c: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input value={c.tipo || ''} onChange={e => handleCertChange(i, 'tipo', e.target.value)} placeholder="Tipo" className="w-32" />
                  <Input value={c.numero || ''} onChange={e => handleCertChange(i, 'numero', e.target.value)} placeholder="Número" className="w-24" />
                  <Input value={c.status || ''} onChange={e => handleCertChange(i, 'status', e.target.value)} placeholder="Status" className="w-24" />
                  <Button variant="ghost" onClick={() => handleRemoveCert(i)} title="Remover">🗑️</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={handleAddCert}>Adicionar certificado</Button>
            </div>
          ) : (
            <ul className="list-disc ml-6">
              {navio.certificados && navio.certificados.length > 0 ? (
                navio.certificados.map((c: any, i: number) => (
                  <li key={i}>{c.tipo} - {c.numero} ({c.status})</li>
                ))
              ) : (
                <li>Nenhum certificado cadastrado</li>
              )}
            </ul>
          )}
        </div>

        {/* Equipamentos */}
        <div className="mt-2">
          <b>Equipamentos:</b>
          {edit ? (
            <div>
              {(form.equipamentos || []).map((e: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input value={e.nome || ''} onChange={ev => handleEquipChange(i, 'nome', ev.target.value)} placeholder="Nome" className="w-32" />
                  <Input value={e.tipo || ''} onChange={ev => handleEquipChange(i, 'tipo', ev.target.value)} placeholder="Tipo" className="w-24" />
                  <Input value={e.status || ''} onChange={ev => handleEquipChange(i, 'status', ev.target.value)} placeholder="Status" className="w-24" />
                  <Button variant="ghost" onClick={() => handleRemoveEquip(i)} title="Remover">🗑️</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={handleAddEquip}>Adicionar equipamento</Button>
            </div>
          ) : (
            <ul className="list-disc ml-6">
              {navio.equipamentos && navio.equipamentos.length > 0 ? (
                navio.equipamentos.map((e: any, i: number) => (
                  <li key={i}>{e.nome} - {e.tipo} ({e.status})</li>
                ))
              ) : (
                <li>Nenhum equipamento cadastrado</li>
              )}
            </ul>
          )}
        </div>

        {edit && (
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setEdit(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        )}

        {/* Jangadas deste Navio */}
        <div className="mt-6">
          <b>Jangadas deste navio:</b>
          <ul className="list-disc ml-6">
            {jangadasDoNavio.length > 0 ? jangadasDoNavio.map((j: any) => (
              <li key={j.id}>
                <Link href={`/jangadas/${j.id}`} className="text-blue-600 hover:underline">{j.nome} (Nº: {j.numero})</Link>
              </li>
            )) : <li>Nenhuma jangada cadastrada</li>}
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}

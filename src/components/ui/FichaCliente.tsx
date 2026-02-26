"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { useJangadas } from "@/hooks/use-jangadas";
import Link from "next/link";

export interface FichaClienteProps {
  cliente: {
    nome?: string;
    nif?: string;
    telefone?: string;
    email?: string;
    morada?: string;
    status?: string;
    observacoes?: string;
    portoRegisto?: string;
    ilha?: string;
    portoEscala?: string;
    contactosEmergencia?: { nome: string; parentesco: string; telefone: string; email?: string }[];
    documentos?: { tipo: string; numero: string; emissor: string; dataEmissao: string; dataValidade: string }[];
  };
  onSave?: (cliente: any) => void;
}

export function FichaCliente({ cliente, onSave }: FichaClienteProps) {
    // Buscar jangadas associadas ao cliente
    const { data: jangadas = [] } = useJangadas();
    const jangadasDoCliente = jangadas.filter((j: any) => j.proprietario === cliente.nome);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...cliente });
  // ...existing code...

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      onSave?.(updated);
      return updated;
    });
  }

  function handleSave() {
    setEdit(false);
    onSave?.(form);
  }

  // Contatos de emergência
  function handleEmergChange(idx: number, field: string, value: string) {
    setForm((f) => {
      const contactosEmergencia = [...(f.contactosEmergencia || [])];
      contactosEmergencia[idx] = { ...contactosEmergencia[idx], [field]: value };
      const updated = { ...f, contactosEmergencia };
      onSave?.(updated);
      return updated;
    });
  }
  function handleAddEmerg() {
    setForm((f) => {
      const updated = { ...f, contactosEmergencia: [...(f.contactosEmergencia || []), { nome: '', parentesco: '', telefone: '', email: '' }] };
      onSave?.(updated);
      return updated;
    });
  }
  function handleRemoveEmerg(idx: number) {
    setForm((f) => {
      const contactosEmergencia = [...(f.contactosEmergencia || [])];
      contactosEmergencia.splice(idx, 1);
      const updated = { ...f, contactosEmergencia };
      onSave?.(updated);
      return updated;
    });
  }

  // Documentos
  function handleDocChange(idx: number, field: string, value: string) {
    setForm((f) => {
      const documentos = [...(f.documentos || [])];
      documentos[idx] = { ...documentos[idx], [field]: value };
      const updated = { ...f, documentos };
      onSave?.(updated);
      return updated;
    });
  }
  function handleAddDoc() {
    setForm((f) => {
      const updated = { ...f, documentos: [...(f.documentos || []), { tipo: '', numero: '', emissor: '', dataEmissao: '', dataValidade: '' }] };
      onSave?.(updated);
      return updated;
    });
  }
  function handleRemoveDoc(idx: number) {
    setForm((f) => {
      const documentos = [...(f.documentos || [])];
      documentos.splice(idx, 1);
      const updated = { ...f, documentos };
      onSave?.(updated);
      return updated;
    });
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          {edit ? (
            <Input name="nome" value={form.nome || ''} onChange={handleChange} placeholder="Nome do cliente" className="text-2xl font-bold mb-1" />
          ) : (
            <CardTitle className="text-2xl font-bold">{cliente.nome || '-'}</CardTitle>
          )}
          <CardDescription className="text-gray-500">{cliente.email || "Email não informado"}</CardDescription>
        </div>
        <Button variant="outline" onClick={() => setEdit((v) => !v)}>
          {edit ? "Cancelar" : "Editar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {edit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="nif" value={form.nif || ''} onChange={handleChange} placeholder="NIF" />
            <Input name="telefone" value={form.telefone || ''} onChange={handleChange} placeholder="Telefone" />
            <Input name="morada" value={form.morada || ''} onChange={handleChange} placeholder="Morada" />
            {/* campo portoRegisto removido */}
            <Input name="ilha" value={form.ilha || ''} onChange={handleChange} placeholder="Ilha" />
            <Input name="portoEscala" value={form.portoEscala || ''} onChange={handleChange} placeholder="Porto de escala" />
            <Input name="status" value={form.status || ''} onChange={handleChange} placeholder="Status" />
            <Textarea name="observacoes" value={form.observacoes || ''} onChange={handleChange} placeholder="Observações" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><b>NIF:</b> {cliente.nif || "-"}</div>
            <div><b>Telefone:</b> {cliente.telefone || "-"}</div>
            <div><b>Morada:</b> {cliente.morada || "-"}</div>
            <div><b>Porto de registo:</b> {cliente.portoRegisto || "-"}</div>
            <div><b>Ilha:</b> {cliente.ilha || "-"}</div>
            <div><b>Porto de escala:</b> {cliente.portoEscala || "-"}</div>
            <div><b>Status:</b> {cliente.status || "-"}</div>
            <div className="md:col-span-2"><b>Observações:</b> {cliente.observacoes || "-"}</div>
          </div>
        )}

        {/* Contatos de Emergência */}
        <div className="mt-4">
          <b>Contatos de Emergência:</b>
          {edit ? (
            <div>
              {(form.contactosEmergencia || []).map((c: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input value={c.nome || ''} onChange={e => handleEmergChange(i, 'nome', e.target.value)} placeholder="Nome" className="w-32" />
                  <Input value={c.parentesco || ''} onChange={e => handleEmergChange(i, 'parentesco', e.target.value)} placeholder="Parentesco" className="w-24" />
                  <Input value={c.telefone || ''} onChange={e => handleEmergChange(i, 'telefone', e.target.value)} placeholder="Telefone" className="w-24" />
                  <Input value={c.email || ''} onChange={e => handleEmergChange(i, 'email', e.target.value)} placeholder="Email" className="w-32" />
                  <Button variant="ghost" onClick={() => handleRemoveEmerg(i)} title="Remover">🗑️</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={handleAddEmerg}>Adicionar contato</Button>
            </div>
          ) : (
            <ul className="list-disc ml-6">
              {cliente.contactosEmergencia && cliente.contactosEmergencia.length > 0 ? (
                cliente.contactosEmergencia.map((c: any, i: number) => (
                  <li key={i}>{c.nome} ({c.parentesco}) - {c.telefone} {c.email && `- ${c.email}`}</li>
                ))
              ) : (
                <li>Nenhum contato cadastrado</li>
              )}
            </ul>
          )}
        </div>

        {/* Documentos */}
        <div className="mt-4">
          <b>Documentos:</b>
          {edit ? (
            <div>
              {(form.documentos || []).map((d: any, i: number) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <Input value={d.tipo || ''} onChange={e => handleDocChange(i, 'tipo', e.target.value)} placeholder="Tipo" className="w-24" />
                  <Input value={d.numero || ''} onChange={e => handleDocChange(i, 'numero', e.target.value)} placeholder="Número" className="w-24" />
                  <Input value={d.emissor || ''} onChange={e => handleDocChange(i, 'emissor', e.target.value)} placeholder="Emissor" className="w-24" />
                  <Input value={d.dataEmissao || ''} onChange={e => handleDocChange(i, 'dataEmissao', e.target.value)} placeholder="Data Emissão" className="w-24" type="date" />
                  <Input value={d.dataValidade || ''} onChange={e => handleDocChange(i, 'dataValidade', e.target.value)} placeholder="Data Validade" className="w-24" type="date" />
                  <Button variant="ghost" onClick={() => handleRemoveDoc(i)} title="Remover">🗑️</Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={handleAddDoc}>Adicionar documento</Button>
            </div>
          ) : (
            <ul className="list-disc ml-6">
              {cliente.documentos && cliente.documentos.length > 0 ? (
                cliente.documentos.map((d: any, i: number) => (
                  <li key={i}>{d.tipo} - {d.numero} ({d.emissor})</li>
                ))
              ) : (
                <li>Nenhum documento cadastrado</li>
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
        {/* Jangadas do Cliente */}
        <div className="mt-6">
          <b>Jangadas deste cliente:</b>
          <ul className="list-disc ml-6">
            {jangadasDoCliente.length > 0 ? jangadasDoCliente.map((j: any) => (
              <li key={j.id}>
                <Link href={`/jangadas/${j.id}`} className="text-blue-600 hover:underline">{j.numero} - {j.marca} {j.modelo}</Link>
                {j.navioNome && (
                  <span className="ml-2 text-sm text-gray-500">Navio: {j.navioNome}</span>
                )}
              </li>
            )) : <li>Nenhuma jangada cadastrada</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

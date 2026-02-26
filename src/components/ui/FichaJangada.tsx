
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { toast } from "sonner";
import Link from "next/link";

export interface FichaJangadaProps {
  jangada: {
    numero?: string;
    navioNome?: string;
    marca?: string;
    modelo?: string;
    lotacao?: number;
    status?: string;
    ultimaInspecao?: string;
    proximaInspecao?: string;
    observacoes?: string;
    // ...campo portoRegisto removido
    ilha?: string;
    portoEscala?: string;
    hruInstalado?: boolean;
    hruTipo?: string;
    hruDataInstalacao?: string;
    hruValidade?: string;
    documentos?: { tipo: string; numero: string; emissor: string; dataEmissao: string; dataValidade: string }[];
  };
  onSave?: (jangada: any) => void;
}

export function FichaJangada({ jangada, onSave }: FichaJangadaProps) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...jangada });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  function validateForm() {
    const newErrors: { [key: string]: string } = {};
    if (!form.numero) newErrors.numero = "Obrigatório";
    if (!form.marca) newErrors.marca = "Obrigatório";
    if (!form.modelo) newErrors.modelo = "Obrigatório";
    if (!form.lotacao) newErrors.lotacao = "Obrigatório";
    return newErrors;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      onSave?.(updated);
      return updated;
    });
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value === '' ? undefined : Number(value) };
      onSave?.(updated);
      return updated;
    });
  }

  function handleSave() {
    const validation = validateForm();
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setIsSaving(true);
    try {
      onSave?.(form);
      setEdit(false);
      toast.success("Jangada salva com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar jangada.");
    } finally {
      setIsSaving(false);
    }
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
    <>
      <Card className="max-w-xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          {edit ? (
            <Input name="navioNome" value={form.navioNome || ''} onChange={handleChange} placeholder="Navio" className="text-2xl font-bold mb-1" />
          ) : (
            <CardTitle className="text-2xl font-bold">
              {jangada.navioNome ? (
                <>
                  <span className="text-blue-600">{jangada.navioNome}</span>
                  <span className="text-base font-normal text-gray-400"> (Jangada {jangada.numero})</span>
                </>
              ) : (
                <>Jangada {jangada.numero}</>
              )}
            </CardTitle>
          )}
          <CardDescription className="text-gray-500">{jangada.marca || "Marca não informada"} {jangada.modelo && `- ${jangada.modelo}`}</CardDescription>
        </div>
        <Button variant="outline" onClick={() => setEdit((v) => !v)}>
          {edit ? "Cancelar" : "Editar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {edit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Input name="numero" value={form.numero || ''} onChange={handleChange} placeholder="Número *" className={errors.numero ? 'border-red-500' : ''} />
              {errors.numero && <span className="text-xs text-red-500">{errors.numero}</span>}
            </div>
            <div>
              <Input name="marca" value={form.marca || ''} onChange={handleChange} placeholder="Marca *" className={errors.marca ? 'border-red-500' : ''} />
              {errors.marca && <span className="text-xs text-red-500">{errors.marca}</span>}
            </div>
            <div>
              <Input name="modelo" value={form.modelo || ''} onChange={handleChange} placeholder="Modelo *" className={errors.modelo ? 'border-red-500' : ''} />
              {errors.modelo && <span className="text-xs text-red-500">{errors.modelo}</span>}
            </div>
            <div>
              <Input name="lotacao" type="number" value={form.lotacao ?? ''} onChange={handleNumberChange} placeholder="Lotação *" className={errors.lotacao ? 'border-red-500' : ''} />
              {errors.lotacao && <span className="text-xs text-red-500">{errors.lotacao}</span>}
            </div>
            <Input name="ilha" value={form.ilha || ''} onChange={handleChange} placeholder="Ilha" />
            <Input name="portoEscala" value={form.portoEscala || ''} onChange={handleChange} placeholder="Porto de escala" />
            <Input name="status" value={form.status || ''} onChange={handleChange} placeholder="Status" />
            <Input name="ultimaInspecao" type="date" value={form.ultimaInspecao || ''} onChange={handleChange} placeholder="Última Inspeção" />
            <Input name="proximaInspecao" type="date" value={form.proximaInspecao || ''} onChange={handleChange} placeholder="Próxima Inspeção" />
            {/* HRU */}
            <div className="md:col-span-2 flex items-center gap-2">
              <label className="font-medium">Possui HRU?</label>
              <input
                type="checkbox"
                name="hruInstalado"
                checked={!!form.hruInstalado}
                onChange={e => {
                  setForm(f => {
                    const updated = { ...f, hruInstalado: e.target.checked };
                    onSave?.(updated);
                    return updated;
                  });
                }}
              />
              <span className="text-xs text-gray-500">(Hammar H20)</span>
            </div>
            {form.hruInstalado && (
              <>
                <Input name="hruTipo" value={form.hruTipo || 'Hammar H20'} onChange={handleChange} placeholder="Tipo HRU" />
                <Input name="hruDataInstalacao" type="date" value={form.hruDataInstalacao || ''} onChange={handleChange} placeholder="Data de Instalação HRU" />
                <Input name="hruValidade" type="date" value={form.hruValidade || ''} onChange={handleChange} placeholder="Validade HRU (2 anos)" />
              </>
            )}
            <Textarea name="observacoes" value={form.observacoes || ''} onChange={handleChange} placeholder="Observações" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><b>Número:</b> {jangada.numero || "-"}</div>
            <div><b>Marca:</b> {jangada.marca || "-"}</div>
            <div><b>Modelo:</b> {jangada.modelo || "-"}</div>
            <div><b>Lotação:</b> {jangada.lotacao ?? "-"}</div>
            
            <div><b>Ilha:</b> {jangada.ilha || "-"}</div>
            <div><b>Porto de escala:</b> {jangada.portoEscala || "-"}</div>
            <div><b>Status:</b> {jangada.status || "-"}</div>
            <div><b>Última Inspeção:</b> {jangada.ultimaInspecao || "-"}</div>
            <div><b>Próxima Inspeção:</b> {jangada.proximaInspecao || "-"}</div>
            {/* HRU VISUALIZAÇÃO */}
            <div className="md:col-span-2"><b>HRU Instalado:</b> {jangada.hruInstalado ? 'Sim' : 'Não'}</div>
            {jangada.hruInstalado && (
              <>
                <div><b>Tipo HRU:</b> {jangada.hruTipo || 'Hammar H20'}</div>
                <div><b>Data de Instalação HRU:</b> {jangada.hruDataInstalacao || '-'}</div>
                <div><b>Validade HRU:</b> {jangada.hruValidade || '-'}</div>
              </>
            )}
            <div className="md:col-span-2"><b>Observações:</b> {jangada.observacoes || "-"}</div>
          </div>
        )}

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
              {jangada.documentos && jangada.documentos.length > 0 ? (
                jangada.documentos.map((d: any, i: number) => (
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
            <Button variant="outline" onClick={() => setEdit(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}

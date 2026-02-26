"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { Button } from "./button";
import Link from "next/link";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { useJangadas } from "@/hooks/use-jangadas";
import { toast } from "sonner";

export interface FichaItemStockProps {
  item: {
    nome?: string;
    categoria?: string;
    descricao?: string;
    unidade?: string;
    quantidadeAtual?: number;
    quantidadeMinima?: number;
    quantidadeMaxima?: number;
    precoUnitario?: number;
    precoCompra?: number;
    precoVenda?: number;
    fornecedor?: string;
    localizacao?: string;
    status?: string;
    dataUltimaEntrada?: string;
    dataUltimaSaida?: string;
    observacoes?: string;
  };
  onSave?: (item: any) => void;
}

export function FichaItemStock({ item, onSave }: FichaItemStockProps) {
    const { data: jangadas = [] } = useJangadas();
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ ...item });
  // ...existing code...

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
    if (
      form.quantidadeMinima !== undefined &&
      form.quantidadeAtual !== undefined &&
      Number(form.quantidadeAtual) < Number(form.quantidadeMinima)
    ) {
      toast.warning("Atenção: quantidade atual está abaixo do mínimo!");
    }
    setEdit(false);
    onSave?.(form);
  }

  return (
    <Card className="max-w-xl mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          {edit ? (
            <Input name="nome" value={form.nome || ''} onChange={handleChange} placeholder="Nome do item" className="text-2xl font-bold mb-1" />
          ) : (
            <CardTitle className="text-2xl font-bold">{item.nome || '-'}</CardTitle>
          )}
          <CardDescription className="text-gray-500">{item.categoria || "Categoria não informada"}</CardDescription>
        </div>
        <Button variant="outline" onClick={() => setEdit((v) => !v)}>
          {edit ? "Cancelar" : "Editar"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {edit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input name="categoria" value={form.categoria || ''} onChange={handleChange} placeholder="Categoria" />
            <Input name="unidade" value={form.unidade || ''} onChange={handleChange} placeholder="Unidade" />
            <Input name="quantidadeAtual" type="number" value={form.quantidadeAtual ?? ''} onChange={handleNumberChange} placeholder="Quantidade Atual" />
            <Input name="quantidadeMinima" type="number" value={form.quantidadeMinima ?? ''} onChange={handleNumberChange} placeholder="Quantidade Mínima" />
            <Input name="quantidadeMaxima" type="number" value={form.quantidadeMaxima ?? ''} onChange={handleNumberChange} placeholder="Quantidade Máxima" />
            <Input name="precoUnitario" type="number" value={form.precoUnitario ?? ''} onChange={handleNumberChange} placeholder="Preço Unitário" />
            <Input name="precoCompra" type="number" value={form.precoCompra ?? ''} onChange={handleNumberChange} placeholder="Preço de Compra" />
            <Input name="precoVenda" type="number" value={form.precoVenda ?? ''} onChange={handleNumberChange} placeholder="Preço de Venda" />
            <Input name="fornecedor" value={form.fornecedor || ''} onChange={handleChange} placeholder="Fornecedor" />
            <Input name="localizacao" value={form.localizacao || ''} onChange={handleChange} placeholder="Localização" />
            <Input name="status" value={form.status || ''} onChange={handleChange} placeholder="Status" />
            <Input name="dataUltimaEntrada" type="date" value={form.dataUltimaEntrada || ''} onChange={handleChange} placeholder="Data Última Entrada" />
            <Input name="dataUltimaSaida" type="date" value={form.dataUltimaSaida || ''} onChange={handleChange} placeholder="Data Última Saída" />
            <Textarea name="descricao" value={form.descricao || ''} onChange={handleChange} placeholder="Descrição" />
            <Textarea name="observacoes" value={form.observacoes || ''} onChange={handleChange} placeholder="Observações" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><b>Categoria:</b> {item.categoria || "-"}</div>
            <div><b>Unidade:</b> {item.unidade || "-"}</div>
            <div><b>Quantidade Atual:</b> {item.quantidadeAtual ?? "-"}</div>
            <div><b>Quantidade Mínima:</b> {item.quantidadeMinima ?? "-"}</div>
            <div><b>Quantidade Máxima:</b> {item.quantidadeMaxima ?? "-"}</div>
            <div><b>Preço Unitário:</b> {item.precoUnitario ?? "-"}</div>
            <div><b>Preço de Compra:</b> {item.precoCompra ?? "-"}</div>
            <div><b>Preço de Venda:</b> {item.precoVenda ?? "-"}</div>
            <div><b>Fornecedor:</b> {item.fornecedor || "-"}</div>
            <div><b>Localização:</b> {item.localizacao || "-"}</div>
            <div><b>Status:</b> {item.status || "-"}</div>
            <div><b>Data Última Entrada:</b> {item.dataUltimaEntrada || "-"}</div>
            <div><b>Data Última Saída:</b> {item.dataUltimaSaida || "-"}</div>
            <div className="md:col-span-2"><b>Descrição:</b> {item.descricao || "-"}</div>
            <div className="md:col-span-2"><b>Observações:</b> {item.observacoes || "-"}</div>
          </div>
        )}
        {edit && (
          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setEdit(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

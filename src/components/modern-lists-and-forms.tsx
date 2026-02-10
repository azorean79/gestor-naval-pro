export type Jangada = {
  id: string;
  numeroSerie: string;
  tipo?: string;
  marca?: { nome?: string };
  modelo?: { nome?: string };
  dataProximaInspecao?: string;
  // Adicione outros campos conforme necessário
};
type NavioFormProps = {
  navio: Navio;
  onSubmit: (navio: Navio) => void;
};
export type Navio = {
  id: string;
  nome: string;
  tipo?: string;
  matricula?: string;
  imo?: string;
  ilha?: string;
  mmsi?: string;
  bandeira?: string;
  comprimento?: string;
  largura?: string;
  calado?: string;
  capacidade?: string;
  observacoes?: string;
};

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Edit, Save, Trash2, Plus, Eye, Calendar, Users, Ship, LifeBuoy, Package, Info } from 'lucide-react';


interface NaviosListProps {
  navios: Navio[];
  onView: (navio: Navio) => void;
  onEdit: (navio: Navio) => void;
  onDelete: (navio: Navio) => void;
  onAdd: () => void;
}

export function NaviosList({ navios, onView, onEdit, onDelete, onAdd }: NaviosListProps) {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Navios</h2>
        <Button variant="default" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" /> Novo Navio
        </Button>
      </div>
      <ul className="space-y-4">
        {navios.map((navio) => (
          <Card key={navio.id} className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                {navio.nome}
              </CardTitle>
              <CardDescription>{navio.tipo} - {navio.matricula}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onView(navio)}>
                <Eye className="h-4 w-4 mr-1" /> Ver
              </Button>
              <Button size="sm" variant="default" onClick={() => onEdit(navio)}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(navio)}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </CardContent>
          </Card>
        ))}
      </ul>
    </div>
  );
}

interface JangadasListProps {
  jangadas: Jangada[];
  onView: (jangada: Jangada) => void;
  onEdit: (jangada: Jangada) => void;
  onDelete: (jangada: Jangada) => void;
  onAdd: () => void;
  onAddComponente: (jangada: Jangada) => void;
}

export function JangadasList({
  jangadas,
  onView,
  onEdit,
  onDelete,
  onAdd,
  onAddComponente
}: JangadasListProps) {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Jangadas</h2>
        <Button variant="default" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-2" /> Nova Jangada
        </Button>
      </div>
      <ul className="space-y-4">
        {jangadas.map((jangada: Jangada) => (
          <Card key={jangada.id} className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-green-600" />
                {jangada.numeroSerie}
              </CardTitle>
              <CardDescription>{jangada.tipo} - {jangada.marca?.nome} - {jangada.modelo?.nome}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => onView(jangada)}>
                <Eye className="h-4 w-4 mr-1" /> Ver
              </Button>
              <Button size="sm" variant="default" onClick={() => onEdit(jangada)}>
                <Edit className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(jangada)}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
              <Button size="sm" variant="default" onClick={() => onAddComponente(jangada)}>
                <Package className="h-4 w-4 mr-1" /> Adicionar Componente
              </Button>
            </CardContent>
          </Card>
        ))}
      </ul>
    </div>
  );
}

// ...existing code...


export function NavioForm({ navio, onSubmit }: NavioFormProps) {
  const [form, setForm] = useState<Navio>(navio || {} as Navio);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  return (
    <form className="max-w-xl mx-auto mt-8 space-y-4" onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <Input name="nome" value={form.nome || ''} onChange={handleChange} placeholder="Nome do navio" />
      <Input name="tipo" value={form.tipo || ''} onChange={handleChange} placeholder="Tipo" />
      <Input name="matricula" value={form.matricula || ''} onChange={handleChange} placeholder="Matrícula" />
      <Input name="imo" value={form.imo || ''} onChange={handleChange} placeholder="IMO" />
      <Input name="mmsi" value={form.mmsi || ''} onChange={handleChange} placeholder="MMSI" />
      <Input name="bandeira" value={form.bandeira || ''} onChange={handleChange} placeholder="Bandeira" />
      <Input name="comprimento" value={form.comprimento || ''} onChange={handleChange} placeholder="Comprimento (m)" />
      <Input name="largura" value={form.largura || ''} onChange={handleChange} placeholder="Largura (m)" />
      <Input name="calado" value={form.calado || ''} onChange={handleChange} placeholder="Calado (m)" />
      <Input name="capacidade" value={form.capacidade || ''} onChange={handleChange} placeholder="Capacidade (pessoas)" />
      <Textarea name="observacoes" value={form.observacoes || ''} onChange={handleChange} placeholder="Observações" />
      <Button type="submit" variant="default">
        <Save className="h-4 w-4 mr-2" /> Salvar
      </Button>
    </form>
  );
}

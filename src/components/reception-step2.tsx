"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ship, Plus, Search } from "lucide-react";
import { useMarcas, useModelos } from "@/hooks/use-marcas-modelos";
import { useJangadas } from "@/hooks/use-jangadas";

interface ReceptionStep2Props {
  data: any;
  updateData: (key: string, value: any) => void;
}

export function ReceptionStep2({ data, updateData }: ReceptionStep2Props) {
  const [showNewJangadaForm, setShowNewJangadaForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { data: jangadasResponse } = useJangadas();
  const { data: marcasResponse } = useMarcas();
  const { data: modelosResponse } = useModelos();

  const jangadas = jangadasResponse?.data || [];
  const marcas = marcasResponse?.data || [];
  const modelos = modelosResponse?.data || [];

  const filteredJangadas = jangadas.filter((jangada: any) =>
    jangada.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jangada.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectJangada = (jangada: any) => {
    updateData("jangada", jangada);
  };

  return (
    <div className="space-y-6">
      {/* Navio Selecionado */}
      {data.navio && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Ship className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">Navio Selecionado: {data.navio.nome}</h4>
                <p className="text-sm text-blue-600">
                  IMO: {data.navio.imo} • A jangada será associada a este navio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-5 h-5" />
            Registrar Jangada
          </CardTitle>
          <CardDescription>
            Selecione uma jangada existente ou registre uma nova recebida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar jangada por número de série ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowNewJangadaForm(!showNewJangadaForm)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Jangada
              </Button>
            </div>

            {showNewJangadaForm && (
              <NewJangadaForm
                marcas={marcas}
                modelos={modelos}
                navio={data.navio}
                onSuccess={(jangada) => {
                  handleSelectJangada(jangada);
                  setShowNewJangadaForm(false);
                }}
              />
            )}

            {data.jangada && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Jangada {data.jangada.numeroSerie}</h4>
                      <p className="text-sm text-gray-600">
                        {data.jangada.marca?.nome} - {data.jangada.modelo?.nome}
                      </p>
                      <p className="text-sm text-gray-600">Tipo: {data.jangada.tipo}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Alterar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!data.jangada && !showNewJangadaForm && (
              <div className="space-y-2">
                <h4 className="font-medium">Jangadas Disponíveis</h4>
                {filteredJangadas.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma jangada encontrada
                  </div>
                ) : (
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {filteredJangadas.slice(0, 10).map((jangada: any) => (
                      <Card
                        key={jangada.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleSelectJangada(jangada)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{jangada.numeroSerie}</h5>
                              <p className="text-sm text-gray-600">
                                {jangada.marca?.nome} - {jangada.modelo?.nome}
                              </p>
                              <p className="text-sm text-gray-600">Tipo: {jangada.tipo}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              Selecionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewJangadaForm({ marcas, modelos, navio, onSuccess }: {
  marcas: any[],
  modelos: any[],
  navio: any,
  onSuccess: (jangada: any) => void
}) {
  const [formData, setFormData] = useState({
    numeroSerie: "",
    tipo: "",
    marcaId: "",
    modeloId: "",
    tipoPack: "",
    capacidade: "",
    dataFabricacao: "",
    dataValidade: "",
    status: "ativo",
    observacoes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const jangadaData = {
        ...formData,
        navioId: navio?.id,
        clienteId: navio?.clienteId
      };

      const response = await fetch("/api/jangadas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jangadaData)
      });

      if (response.ok) {
        const newJangada = await response.json();
        onSuccess(newJangada);
      }
    } catch (error) {
      console.error("Erro ao criar jangada:", error);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Cadastrar Nova Jangada</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numeroSerie">Número de Série *</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vida">Vida</SelectItem>
                  <SelectItem value="resgate">Resgate</SelectItem>
                  <SelectItem value="sobrevivencia">Sobrevivência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marcaId">Marca</Label>
              <Select value={formData.marcaId} onValueChange={(value) => setFormData(prev => ({ ...prev, marcaId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="modeloId">Modelo</Label>
              <Select value={formData.modeloId} onValueChange={(value) => setFormData(prev => ({ ...prev, modeloId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      {modelo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoPack">Tipo de Pack</Label>
              <Input
                id="tipoPack"
                value={formData.tipoPack}
                onChange={(e) => setFormData(prev => ({ ...prev, tipoPack: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="capacidade">Capacidade</Label>
              <Input
                id="capacidade"
                type="number"
                value={formData.capacidade}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidade: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataFabricacao">Data de Fabricação</Label>
              <Input
                id="dataFabricacao"
                type="date"
                value={formData.dataFabricacao}
                onChange={(e) => setFormData(prev => ({ ...prev, dataFabricacao: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="dataValidade">Data de Validade</Label>
              <Input
                id="dataValidade"
                type="date"
                value={formData.dataValidade}
                onChange={(e) => setFormData(prev => ({ ...prev, dataValidade: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit">
              Criar Jangada
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
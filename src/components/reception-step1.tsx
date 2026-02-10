"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, Plus, Search, Ship, ArrowRight } from "lucide-react";
import { useClientes } from "@/hooks/use-clientes";
import { useNavios } from "@/hooks/use-navios";

interface ReceptionStep1Props {
  data: any;
  updateData: (key: string, value: any) => void;
  onNext?: () => void;
}

export function ReceptionStep1({ data, updateData, onNext }: ReceptionStep1Props) {
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"clientes" | "navios">("clientes");

  const { data: clientesResponse, isLoading: clientesLoading } = useClientes();
  const { data: naviosResponse, isLoading: naviosLoading } = useNavios();

  const clientes = clientesResponse?.data || [];
  const navios = naviosResponse?.data || [];

  const filteredClientes = clientes.filter((cliente: any) =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.nif?.includes(searchTerm)
  );

  const filteredNavios = navios.filter((navio: any) =>
    navio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    navio.imo?.includes(searchTerm) ||
    navio.mmsi?.includes(searchTerm)
  );

  const handleSelectClient = (cliente: any) => {
    updateData("client", cliente);
  };

  const handleSelectNavio = (navio: any) => {
    updateData("navio", navio);
  };

  return (
    <div className="space-y-6">
      {/* Cliente Selecionado */}
      {data.client && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">Cliente: {data.client.nome}</h4>
                  <p className="text-sm text-green-600">
                    {data.client.email} • NIF: {data.client.nif}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateData("client", null)}
              >
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navio Selecionado */}
      {data.navio && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ship className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-800">Navio: {data.navio.nome}</h4>
                  <p className="text-sm text-blue-600">
                    IMO: {data.navio.imo} • MMSI: {data.navio.mmsi}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateData("navio", null)}
              >
                Alterar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Selecionar Cliente e Navio
          </CardTitle>
          <CardDescription>
            Escolha o cliente e o navio relacionados à jangada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Abas para Cliente/Navio */}
            <div className="flex border-b">
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === "clientes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("clientes")}
              >
                <User className="w-4 h-4 inline mr-2" />
                Clientes
              </button>
              <button
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === "navios"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("navios")}
              >
                <Ship className="w-4 h-4 inline mr-2" />
                Navios
              </button>
            </div>

            {/* Barra de busca */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={
                    activeTab === "clientes"
                      ? "Buscar cliente por nome, email ou NIF..."
                      : "Buscar navio por nome, IMO ou MMSI..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {activeTab === "clientes" && (
                <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                      <DialogDescription>
                        Preencha os dados do novo cliente
                      </DialogDescription>
                    </DialogHeader>
                    <NewClientForm
                      onSuccess={(cliente) => {
                        handleSelectClient(cliente);
                        setShowNewClientDialog(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Conteúdo das abas */}
            {activeTab === "clientes" && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {clientesLoading ? (
                  <div className="text-center py-4">Carregando clientes...</div>
                ) : filteredClientes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                ) : (
                  filteredClientes.map((cliente: any) => (
                    <Card
                      key={cliente.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelectClient(cliente)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{cliente.nome}</h4>
                            <p className="text-sm text-gray-600">
                              {cliente.email} • NIF: {cliente.nif}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Selecionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === "navios" && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {naviosLoading ? (
                  <div className="text-center py-4">Carregando navios...</div>
                ) : filteredNavios.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhum navio encontrado
                  </div>
                ) : (
                  filteredNavios.map((navio: any) => (
                    <Card
                      key={navio.id}
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleSelectNavio(navio)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{navio.nome}</h4>
                            <p className="text-sm text-gray-600">
                              IMO: {navio.imo} • MMSI: {navio.mmsi}
                            </p>
                            {navio.cliente && (
                              <p className="text-sm text-gray-500">
                                Cliente: {navio.cliente.nome}
                              </p>
                            )}
                          </div>
                          <Button size="sm" variant="outline">
                            Selecionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Seguinte quando cliente e navio estiverem selecionados */}
      {data.client && data.navio && (
        <div className="flex justify-end">
          <Button
            onClick={onNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Seguinte: Registrar Jangada
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

function NewClientForm({ onSuccess }: { onSuccess: (cliente: any) => void }) {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    nif: "",
    endereco: "",
    tipo: "cliente",
    delegacao: "Açores"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newClient = await response.json();
        onSuccess(newClient);
      }
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={formData.telefone}
            onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="nif">NIF</Label>
          <Input
            id="nif"
            value={formData.nif}
            onChange={(e) => setFormData(prev => ({ ...prev, nif: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="endereco">Endereço</Label>
        <Input
          id="endereco"
          value={formData.endereco}
          onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          Criar Cliente
        </Button>
      </div>
    </form>
  );
}
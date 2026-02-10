"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wrench, Plus, Trash2, Calculator } from "lucide-react";

interface ReceptionStep4Props {
  data: any;
  updateData: (key: string, value: any) => void;
}

export function ReceptionStep4({ data, updateData }: ReceptionStep4Props) {
  const [services, setServices] = useState(data.services || []);
  const [newService, setNewService] = useState({
    descricao: "",
    tipo: "",
    preco: "",
    quantidade: 1,
    urgente: false
  });

  const serviceTypes = [
    { value: "inspecao", label: "Inspeção", precoBase: 150 },
    { value: "manutencao", label: "Manutenção", precoBase: 200 },
    { value: "reparacao", label: "Reparação", precoBase: 300 },
    { value: "teste", label: "Teste de Pressão", precoBase: 100 },
    { value: "certificacao", label: "Certificação", precoBase: 250 },
    { value: "equipamento", label: "Substituição de Equipamento", precoBase: 180 },
    { value: "limpeza", label: "Limpeza e Descontaminação", precoBase: 80 }
  ];

  const handleAddService = () => {
    if (newService.descricao && newService.preco) {
      const service = {
        ...newService,
        id: Date.now().toString(),
        preco: parseFloat(newService.preco),
        total: parseFloat(newService.preco) * newService.quantidade
      };
      const updatedServices = [...services, service];
      setServices(updatedServices);
      updateData("services", updatedServices);
      setNewService({
        descricao: "",
        tipo: "",
        preco: "",
        quantidade: 1,
        urgente: false
      });
    }
  };

  const handleRemoveService = (serviceId: string) => {
    const updatedServices = services.filter((s: any) => s.id !== serviceId);
    setServices(updatedServices);
    updateData("services", updatedServices);
  };

  const handleServiceTypeChange = (tipo: string) => {
    const serviceType = serviceTypes.find(st => st.value === tipo);
    setNewService(prev => ({
      ...prev,
      tipo,
      preco: serviceType?.precoBase.toString() || "",
      descricao: serviceType?.label || ""
    }));
  };

  const totalValue = services.reduce((sum: number, service: any) => sum + service.total, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Serviços Necessários
          </CardTitle>
          <CardDescription>
            Defina os serviços a serem realizados na jangada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Add Service Form */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Adicionar Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="tipo">Tipo de Serviço</Label>
                    <Select value={newService.tipo} onValueChange={handleServiceTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} - €{type.precoBase}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      value={newService.quantidade}
                      onChange={(e) => setNewService(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="preco">Preço Unitário (€)</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      value={newService.preco}
                      onChange={(e) => setNewService(prev => ({ ...prev, preco: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="urgente"
                      checked={newService.urgente}
                      onChange={(e) => setNewService(prev => ({ ...prev, urgente: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="urgente">Serviço Urgente</Label>
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={newService.descricao}
                    onChange={(e) => setNewService(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição detalhada do serviço"
                  />
                </div>

                <Button onClick={handleAddService} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardContent>
            </Card>

            {/* Services List */}
            <div className="space-y-4">
              <h4 className="font-medium">Serviços Selecionados</h4>

              {services.length === 0 ? (
                <Card className="p-8 text-center text-gray-500">
                  <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum serviço adicionado ainda</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {services.map((service: any) => (
                    <Card key={service.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{service.descricao}</h5>
                            {service.urgente && (
                              <Badge variant="destructive">Urgente</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Quantidade: {service.quantidade} × €{service.preco.toFixed(2)} = €{service.total.toFixed(2)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Total Summary */}
            {services.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Total dos Serviços</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-800">
                        €{totalValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-600">
                        {services.length} serviço(s)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inspection Issues to Services */}
            {data.inspection?.issues?.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Serviços Recomendados pela Inspeção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.inspection.issues.map((issue: any, index: number) => (
                      <div key={index} className="p-3 bg-white rounded border border-orange-200">
                        <p className="text-sm text-orange-800">{issue.description}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => {
                            const service = {
                              id: Date.now().toString() + index,
                              descricao: `Reparação: ${issue.description}`,
                              tipo: "reparacao",
                              preco: "150",
                              quantidade: 1,
                              urgente: true,
                              total: 150
                            };
                            const updatedServices = [...services, service];
                            setServices(updatedServices);
                            updateData("services", updatedServices);
                          }}
                        >
                          Adicionar Serviço de Reparação
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
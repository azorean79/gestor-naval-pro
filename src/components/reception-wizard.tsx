"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Ship,
  User,
  ClipboardCheck,
  Wrench,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MapPin
} from "lucide-react";
import { ReceptionStep1 } from "./reception-step1";
import { ReceptionStep2 } from "./reception-step2";
import { ReceptionStep3 } from "./reception-step3";
import { ReceptionStep4 } from "./reception-step4";
import { Cliente, Navio, Jangada } from "@/lib/types";

interface ReceptionWizardProps {
  onClose: () => void;
}

interface ReceptionData {
  client: Cliente | null;
  navio: Navio | null;
  jangada: Jangada | null;
  inspection: any;
  services: any[];
  invoice: any;
}

export function ReceptionWizard({ onClose }: ReceptionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [receptionData, setReceptionData] = useState<ReceptionData>({
    client: null,
    navio: null,
    jangada: null,
    inspection: null,
    services: [],
    invoice: null
  });

  const steps = [
    { id: 1, title: "Cliente", icon: User, description: "Selecionar ou cadastrar cliente" },
    { id: 2, title: "Jangada", icon: Ship, description: "Registrar jangada recebida" },
    { id: 3, title: "Inspeção", icon: ClipboardCheck, description: "Realizar inspeção inicial" },
    { id: 4, title: "Serviços", icon: Wrench, description: "Definir serviços necessários" },
    { id: 5, title: "Fatura", icon: FileText, description: "Gerar fatura" }
  ];

  const progress = (currentStep / steps.length) * 100;

  const updateReceptionData = (key: string, value: any) => {
    setReceptionData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNext = () => {
    // Validações por passo
    if (currentStep === 1) {
      if (!receptionData.client) {
        alert("Por favor, selecione um cliente antes de continuar.");
        return;
      }
      if (!receptionData.navio) {
        alert("Por favor, selecione um navio antes de continuar.");
        return;
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Create inspection
      if (receptionData.inspection) {
        const inspection = receptionData.inspection as any;
        const jangada = receptionData.jangada as any;
        const inspectionResponse = await fetch("/api/inspecoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoInspecao: "recepcao",
            resultado: inspection.status === "passed" ? "aprovada" : "reprovada",
            observacoes: inspection.observations || "",
            tecnicoResponsavel: "Técnico de Recepção",
            jangadaId: jangada?.id,
            navioId: receptionData.navio?.id,
            dataProxima: null, // Will be set based on inspection results
          })
        });

        if (!inspectionResponse.ok) {
          throw new Error("Erro ao criar inspeção");
        }
      }

      // Create invoice if there are services
      if (receptionData.services && receptionData.services.length > 0) {
        const totalValue = receptionData.services.reduce((sum: number, s: any) => sum + s.total, 0);

        const invoiceResponse = await fetch("/api/faturas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            numero: `REC-${Date.now()}`,
            dataEmissao: new Date().toISOString(),
            dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            valor: totalValue,
            status: "pendente",
            descricao: `Serviços de recepção - Jangada ${receptionData.jangada?.numeroSerie || 'N/A'}`,
            clienteId: receptionData.client?.id,
            jangadaId: receptionData.jangada?.id,
          })
        });

        if (!invoiceResponse.ok) {
          throw new Error("Erro ao criar fatura");
        }
      }

      // Success - close wizard
      onClose();
      // Optionally refresh the page or show success message
      window.location.reload();
    } catch (error) {
      console.error("Erro ao finalizar recepção:", error);
      alert("Erro ao finalizar recepção. Tente novamente.");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <ReceptionStep1 data={receptionData} updateData={updateReceptionData} onNext={handleNext} />;
      case 2:
        return <ReceptionStep2 data={receptionData} updateData={updateReceptionData} />;
      case 3:
        return <ReceptionStep3 data={receptionData} updateData={updateReceptionData} />;
      case 4:
        return <ReceptionStep4 data={receptionData} updateData={updateReceptionData} />;
      case 5:
        return <ReceptionStep5 data={receptionData} updateData={updateReceptionData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Nova Recepção de Jangada</h2>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>

          <div className="space-y-4">
            <Progress value={progress} className="w-full" />

            <div className="flex justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="text-center">
                      <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500 max-w-24">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Recepção
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder for step 5
function ReceptionStep5({ data, updateData }: { data: any, updateData: any }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Geração de Fatura
          </CardTitle>
          <CardDescription>
            Revisar serviços e gerar fatura para o cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cliente</label>
                <p className="text-sm text-gray-600">{data.client?.nome || 'Não selecionado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Jangada</label>
                <p className="text-sm text-gray-600">{data.jangada?.numeroSerie || 'Não registrada'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Serviços a Faturar</h4>
              <div className="space-y-2">
                {data.services?.map((service: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{service.descricao}</span>
                    <Badge variant="outline">€{service.preco}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">
                  €{data.services?.reduce((sum: number, s: any) => sum + (s.preco || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface ReceptionStep3Props {
  data: any;
  updateData: (key: string, value: any) => void;
}

interface Issue {
  description: string;
  severity: string;
}

export function ReceptionStep3({ data, updateData }: ReceptionStep3Props) {
  const [inspectionData, setInspectionData] = useState<{
    visualInspection: boolean;
    functionalityTest: boolean;
    equipmentCheck: boolean;
    documentationCheck: boolean;
    observations: string;
    status: string;
    issues: Issue[];
  }>({
    visualInspection: false,
    functionalityTest: false,
    equipmentCheck: false,
    documentationCheck: false,
    observations: "",
    status: "pending", // pending, passed, failed
    issues: []
  });

  const inspectionItems = [
    {
      id: "visual",
      title: "Inspeção Visual",
      description: "Verificar estado geral da jangada, casco, costuras e acessórios externos",
      required: true
    },
    {
      id: "functionality",
      title: "Teste de Funcionalidade",
      description: "Testar mecanismo de inflação, válvulas e sistemas de segurança",
      required: true
    },
    {
      id: "equipment",
      title: "Verificação de Equipamentos",
      description: "Conferir presença e estado de EPIRB, VHF, flares, kit de sobrevivência",
      required: true
    },
    {
      id: "documentation",
      title: "Documentação",
      description: "Verificar certificados, manuais e registros de manutenção",
      required: true
    }
  ];

  const handleItemCheck = (itemId: string, checked: boolean) => {
    setInspectionData(prev => ({
      ...prev,
      [itemId]: checked
    }));
  };

  const handleCompleteInspection = () => {
    const allRequiredChecked = inspectionItems
      .filter(item => item.required)
      .every(item => inspectionData[item.id as keyof typeof inspectionData]);

    if (allRequiredChecked) {
      const status = inspectionData.issues.length > 0 ? "failed" : "passed";
      const inspection = {
        ...inspectionData,
        status,
        completedAt: new Date().toISOString(),
        inspector: "Técnico Atual" // This should come from auth context
      };
      updateData("inspection", inspection);
    }
  };

  const addIssue = (issue: string) => {
    setInspectionData(prev => ({
      ...prev,
      issues: [...prev.issues, { description: issue, severity: "medium" }]
    }));
  };

  const removeIssue = (index: number) => {
    setInspectionData(prev => ({
      ...prev,
      issues: prev.issues.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            Inspeção de Recepção
          </CardTitle>
          <CardDescription>
            Realize a inspeção inicial da jangada recebida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Inspection Items */}
            <div className="space-y-4">
              <h4 className="font-medium">Itens de Inspeção</h4>
              {inspectionItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={item.id}
                      checked={inspectionData[item.id as keyof typeof inspectionData] as boolean}
                      onCheckedChange={(checked) => handleItemCheck(item.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.title}
                        {item.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Issues Found */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Problemas Identificados
              </h4>

              {inspectionData.issues.map((issue: any, index: number) => (
                <Card key={index} className="p-3 border-orange-200 bg-orange-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{issue.description}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIssue(index)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const issue = prompt("Descreva o problema encontrado:");
                  if (issue) addIssue(issue);
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Adicionar Problema
              </Button>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações Gerais</label>
              <Textarea
                placeholder="Observações sobre a inspeção..."
                value={inspectionData.observations}
                onChange={(e) => setInspectionData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Status Summary */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Status da Inspeção</h4>
                  <div className="flex items-center gap-2 mt-1">
                    {inspectionData.issues.length === 0 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600">Aprovada</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-orange-600">
                          {inspectionData.issues.length} problema(s) encontrado(s)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleCompleteInspection}
                  disabled={!inspectionItems.every(item =>
                    !item.required || inspectionData[item.id as keyof typeof inspectionData]
                  )}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Finalizar Inspeção
                </Button>
              </div>
            </Card>

            {/* Inspection Results */}
            {data.inspection && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-medium text-green-800">Inspeção Concluída</h4>
                  </div>
                  <div className="text-sm text-green-700">
                    Status: {data.inspection.status === "passed" ? "Aprovada" : "Reprovada"}
                    {data.inspection.issues.length > 0 && (
                      <span> • {data.inspection.issues.length} problema(s)</span>
                    )}
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
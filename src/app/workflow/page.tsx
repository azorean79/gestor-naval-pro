"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ship,
  Calendar,
  CheckCircle,
  FileText,
  Receipt,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  Clock,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface WorkflowItem {
  id: string;
  numeroSerie: string;
  modelo: string;
  marca: string;
  cliente: string;
  navio: string;
  status: 'recebido' | 'agendado' | 'em_inspecao' | 'inspecionado' | 'certificado' | 'faturado';
  dataRecebimento: string;
  dataInspecao?: string;
  dataCertificado?: string;
  dataFatura?: string;
  tecnico: string;
}

const steps = [
  { id: 'recebimento', title: 'Recebimento', icon: Ship, description: 'Registrar entrada da jangada' },
  { id: 'agendamento', title: 'Agendamento', icon: Calendar, description: 'Agendar inspeção' },
  { id: 'inspecao', title: 'Inspeção', icon: CheckCircle, description: 'Executar inspeção técnica' },
  { id: 'certificado', title: 'Certificado', icon: FileText, description: 'Gerar certificado' },
  { id: 'fatura', title: 'Fatura', icon: Receipt, description: 'Emitir fatura' }
];

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ativos');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowItem | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      // Simular dados - em produção, buscar da API
      const mockData: WorkflowItem[] = [
        {
          id: '1',
          numeroSerie: 'LR-2024-001',
          modelo: 'MK4',
          marca: 'Seasava',
          cliente: 'Armador Açores',
          navio: 'Atlântico Sul',
          status: 'recebido',
          dataRecebimento: '2024-02-10',
          tecnico: 'Julio Correia'
        },
        {
          id: '2',
          numeroSerie: 'LR-2024-002',
          modelo: 'MKIII',
          marca: 'Eurovinil',
          cliente: 'Pescas Madeira',
          navio: 'Mar Azul',
          status: 'agendado',
          dataRecebimento: '2024-02-08',
          dataInspecao: '2024-02-15',
          tecnico: 'João Silva'
        },
        {
          id: '3',
          numeroSerie: 'LR-2024-003',
          modelo: 'LR97',
          marca: 'DSB',
          cliente: 'Transportes Açores',
          navio: 'Santa Maria Express',
          status: 'faturado',
          dataRecebimento: '2024-01-20',
          dataInspecao: '2024-01-25',
          dataCertificado: '2024-01-26',
          dataFatura: '2024-01-27',
          tecnico: 'Maria Santos'
        }
      ];
      setWorkflows(mockData);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recebido': return 'bg-blue-500';
      case 'agendado': return 'bg-yellow-500';
      case 'em_inspecao': return 'bg-orange-500';
      case 'inspecionado': return 'bg-purple-500';
      case 'certificado': return 'bg-green-500';
      case 'faturado': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'recebido': return 'Recebido';
      case 'agendado': return 'Agendado';
      case 'em_inspecao': return 'Em Inspeção';
      case 'inspecionado': return 'Inspecionado';
      case 'certificado': return 'Certificado';
      case 'faturado': return 'Faturado';
      default: return status;
    }
  };

  const getCurrentStepIndex = (status: string) => {
    switch (status) {
      case 'recebido': return 0;
      case 'agendado': return 1;
      case 'em_inspecao':
      case 'inspecionado': return 2;
      case 'certificado': return 3;
      case 'faturado': return 4;
      default: return 0;
    }
  };

  const getProgressPercentage = (status: string) => {
    const stepIndex = getCurrentStepIndex(status);
    return ((stepIndex + 1) / steps.length) * 100;
  };

  const filteredWorkflows = workflows.filter(workflow => {
    if (activeTab === 'ativos') return workflow.status !== 'faturado';
    if (activeTab === 'concluidos') return workflow.status === 'faturado';
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Completo</h1>
          <p className="text-gray-600 mt-2">
            Processo integrado desde o recebimento até a faturação
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/workflow/recebimento">
            <Plus className="w-4 h-4 mr-2" />
            Novo Recebimento
          </Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ativos">Ativos ({workflows.filter(w => w.status !== 'faturado').length})</TabsTrigger>
          <TabsTrigger value="concluidos">Concluídos ({workflows.filter(w => w.status === 'faturado').length})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({workflows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Ship className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {workflow.numeroSerie} - {workflow.modelo}
                          </CardTitle>
                          <CardDescription>
                            {workflow.marca} • {workflow.cliente} • {workflow.navio}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(workflow.status)} text-white`}>
                        {getStatusLabel(workflow.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progresso</span>
                          <span>{Math.round(getProgressPercentage(workflow.status))}%</span>
                        </div>
                        <Progress value={getProgressPercentage(workflow.status)} className="h-2" />
                      </div>

                      {/* Steps */}
                      <div className="grid grid-cols-5 gap-2">
                        {steps.map((step, index) => {
                          const currentStepIndex = getCurrentStepIndex(workflow.status);
                          const isCompleted = index <= currentStepIndex;
                          const isCurrent = index === currentStepIndex;

                          return (
                            <div key={step.id} className="flex flex-col items-center space-y-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted
                                  ? 'bg-green-500 text-white'
                                  : isCurrent
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                              }`}>
                                <step.icon className="w-4 h-4" />
                              </div>
                              <span className={`text-xs text-center ${
                                isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                {step.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          <div>Técnico: {workflow.tecnico}</div>
                          <div>Recebimento: {new Date(workflow.dataRecebimento).toLocaleDateString('pt-PT')}</div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Search className="w-4 h-4 mr-1" />
                            Detalhes
                          </Button>

                          {workflow.status === 'recebido' && (
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Link href={`/workflow/agendamento?jangada=${workflow.id}`}>
                                <Calendar className="w-4 h-4 mr-1" />
                                Agendar
                              </Link>
                            </Button>
                          )}

                          {workflow.status === 'agendado' && (
                            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                              <Link href={`/workflow/inspecao?jangada=${workflow.id}`}>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Iniciar Inspeção
                              </Link>
                            </Button>
                          )}

                          {workflow.status === 'inspecionado' && (
                            <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700">
                              <Link href={`/workflow/certificado?jangada=${workflow.id}`}>
                                <FileText className="w-4 h-4 mr-1" />
                                Gerar Certificado
                              </Link>
                            </Button>
                          )}

                          {workflow.status === 'certificado' && (
                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <Link href={`/workflow/fatura?jangada=${workflow.id}`}>
                                <Receipt className="w-4 h-4 mr-1" />
                                Faturar
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {steps.map((step, index) => {
          const count = workflows.filter(w => getCurrentStepIndex(w.status) === index).length;
          return (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <step.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-gray-600">{step.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
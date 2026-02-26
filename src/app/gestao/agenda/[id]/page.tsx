"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Calendar, Clock, MapPin, User, Users, AlertCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAgendamentos } from "@/hooks/use-agendamentos";
import { useState, useEffect } from "react";

// Mock data - será substituído por dados reais
const mockAgendamentos = [
  {
    id: "1",
    titulo: "Inspeção Jangada J-001",
    descricao: "Inspeção anual da jangada Santa Maria",
    tipo: "inspecao",
    dataInicio: new Date("2024-02-15T10:00:00"),
    dataFim: new Date("2024-02-15T12:00:00"),
    local: "Marina de Lisboa",
    responsavel: "João Silva",
    participantes: "Maria Santos, António Costa",
    status: "agendado",
    prioridade: "alta",
    entidadeRelacionada: "Jangada J-001",
    observacoes: "Verificar motor e equipamentos de segurança"
  },
  {
    id: "2",
    titulo: "Reunião com Cliente",
    descricao: "Reunião para discutir manutenção preventiva",
    tipo: "reuniao",
    dataInicio: new Date("2024-02-16T14:00:00"),
    dataFim: new Date("2024-02-16T15:30:00"),
    local: "Escritório Central",
    responsavel: "Maria Santos",
    participantes: "João Silva, António Costa",
    status: "confirmado",
    prioridade: "media",
    entidadeRelacionada: "Cliente - Transportes Marítimos SA",
    observacoes: "Discutir plano de manutenção para a frota"
  }
];

export default function FichaAgendamentoPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Só chamar o hook quando montado
  const { data: agendamentos, isLoading } = mounted ? useAgendamentos() : { data: null, isLoading: false };

  // Usar dados reais se disponíveis, senão usar mock
  const displayAgendamentos = agendamentos || mockAgendamentos;

  // Encontrar o agendamento pelo ID
  const agendamento = displayAgendamentos.find(a => a.id === params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando agendamento...</p>
        </div>
      </div>
    );
  }

  if (!agendamento) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Agendamento não encontrado</h2>
          <p className="text-gray-600 mb-4">O agendamento solicitado não existe.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'default';
      case 'agendado': return 'secondary';
      case 'cancelado': return 'destructive';
      case 'concluido': return 'outline';
      default: return 'secondary';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'inspecao': return <AlertCircle className="h-4 w-4" />;
      case 'reuniao': return <Users className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ficha de Agendamento
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detalhes completos do agendamento
              </p>
            </div>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getTipoIcon(agendamento.tipo)}
                {agendamento.titulo}
              </CardTitle>
              <CardDescription>{agendamento.descricao}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <p className="capitalize">{agendamento.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={getStatusColor(agendamento.status)}>
                      {agendamento.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prioridade</label>
                  <div className="mt-1">
                    <Badge variant={getPrioridadeColor(agendamento.prioridade)}>
                      {agendamento.prioridade}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Responsável</label>
                  <p>{agendamento.responsavel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data e Hora</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {agendamento.dataInicio.toLocaleDateString('pt-PT')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {agendamento.dataInicio.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} - {' '}
                  {agendamento.dataFim.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {agendamento.local && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{agendamento.local}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>
            <CardContent>
              {agendamento.participantes ? (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{agendamento.participantes}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhum participante definido</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Entidade Relacionada</CardTitle>
            </CardHeader>
            <CardContent>
              {agendamento.entidadeRelacionada ? (
                <p className="text-sm">{agendamento.entidadeRelacionada}</p>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma entidade relacionada</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        {agendamento.observacoes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{agendamento.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
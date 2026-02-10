"use client";

export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ship,
  Anchor,
  Users,
  Package,
  Calendar,
  AlertTriangle,
  Activity,
  Settings,
  ClipboardCheck,
  Wrench,
  FileText,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Eye,
  Plus,
  Upload,
  Database
} from "lucide-react";
import { useDadosCruzados } from "@/hooks/use-dados-cruzados";
import { TecnicoSelector } from "@/components/tecnico-selector";
import { StatusCards } from "@/components/dashboard/status-cards";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { SmartNotifications } from "@/components/dashboard/smart-notifications";
import { AlertasWidget } from "@/components/alertas-widget";
import { useStatusDashboard } from "@/hooks/use-status-dashboard";
import { useDashboardResumo } from "@/hooks/use-dashboard-resumo";
import { useTendenciasInspecao } from "@/hooks/use-inspecoes";
import { useCronogramas } from "@/hooks/use-cronogramas";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ExecutiveSummary } from "@/components/dashboard/executive-summary";
import { JulinhoChatbot } from "@/components/julinho-chatbot";
import { AssistenteJulinho } from "@/components/assistente-julinho";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { DocumentUploadDialog } from "@/components/ui/document-upload-dialog";

function DashboardPage() {
  const router = useRouter();
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { data: stats, isLoading, error } = useDadosCruzados();
  const { statusItems, statusSummary, proximosVencimentos } = useStatusDashboard();
  const { data: resumo } = useDashboardResumo();
  const { data: tendenciasResponse } = useTendenciasInspecao(12);
  const { data: cronogramas } = useCronogramas();
  const dataAtualizacao = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  // Debug logging
  useEffect(() => {
    console.log('Dashboard Debug:', {
      isLoading,
      error,
      stats: !!stats,
      statusItems: !!statusItems,
      resumo: !!resumo,
      tendenciasResponse: !!tendenciasResponse,
      cronogramas: !!cronogramas
    });
  }, [isLoading, error, stats, statusItems, resumo, tendenciasResponse, cronogramas]);

  // Force loading timeout to prevent infinite loading
  const [forceRender, setForceRender] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing render due to loading timeout');
        setForceRender(true);
      }
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleSeedDatabase = async () => {
    if (confirm('Tem certeza que deseja popular a base de dados com dados de exemplo? Esta ação pode demorar alguns segundos.')) {
      setIsSeeding(true);
      try {
        const response = await fetch('/api/seed', {
          method: 'POST',
        });

        if (response.ok) {
          const result = await response.json();
          const dados = result.dados || result.data;

          if (!result.success && dados) {
            alert(`ℹ️ ${result.message || 'Base de dados já contém dados.'}\n\nEstado atual:\n- ${dados.clientes ?? 0} clientes\n- ${dados.navios ?? 0} navios\n- ${dados.jangadas ?? 0} jangadas\n- ${dados.stock ?? 0} itens de stock`);
            return;
          }

          if (dados) {
            alert(`✅ Seeding concluído!\n\nDados criados:\n- ${dados.clientes ?? 0} clientes\n- ${dados.navios ?? 0} navios\n- ${dados.jangadas ?? 0} jangadas\n- ${dados.stock ?? 0} itens de stock`);
            window.location.reload(); // Recarregar a página para mostrar os novos dados
            return;
          }

          alert(`❌ Erro no seeding: resposta inesperada do servidor.`);
        } else {
          const error = await response.json();
          alert(`❌ Erro no seeding: ${error.error || error.message || 'Erro desconhecido'}`);
        }
      } catch (error) {
        alert(`❌ Erro ao executar seeding: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  if (isLoading && !forceRender) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando dashboard...</p>
          <p className="text-sm text-slate-500 mt-2">Debug: isLoading={String(isLoading)}, hasStats={String(!!stats)}</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Erro ao carregar dados</h2>
          <p className="text-slate-600 dark:text-slate-400">Não foi possível carregar os dados do dashboard.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Construct KPI data from available stats
  const kpiData = {
    totalJangadas: stats?.jangadas?.total || 0,
    cilindrosBomEstado: (stats?.cilindros?.total || 0) - (stats?.cilindros?.defeituosos || 0),
    alertasStock: (stats?.stock?.itensBaixo || 0) + (stats?.stock?.itensEsgotados || 0),
    inspecoesVencidas: proximosVencimentos?.filter(item => item.status === 'critico').length || 0,
    cronogramasVencidos: cronogramas?.filter((c: any) => c.status === 'vencido').length || 0,
  };

  // Mock trend data for the chart
  const trendData = tendenciasResponse?.data || [
    { mes: '2024-01', total: 12, aprovadas: 10, reprovadas: 1, comCondicoes: 1, custo: 2500 },
    { mes: '2024-02', total: 15, aprovadas: 12, reprovadas: 2, comCondicoes: 1, custo: 3200 },
    { mes: '2024-03', total: 18, aprovadas: 14, reprovadas: 2, comCondicoes: 2, custo: 3800 },
    { mes: '2024-04', total: 22, aprovadas: 18, reprovadas: 3, comCondicoes: 1, custo: 4200 },
    { mes: '2024-05', total: 20, aprovadas: 16, reprovadas: 2, comCondicoes: 2, custo: 4100 },
    { mes: '2024-06', total: 25, aprovadas: 20, reprovadas: 3, comCondicoes: 2, custo: 4800 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Navigation Header */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestor Naval Pro
              </Link>
              <div className="hidden lg:flex space-x-1">
                <Link href="/jangadas" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  Jangadas
                </Link>
                <Link href="/navios" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  Navios
                </Link>
                <Link href="/clientes" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  Clientes
                </Link>
                <Link href="/inspecoes" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  Inspeções
                </Link>
                <Link href="/alertas" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors">
                  Alertas
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/50"
              >
                <Database className="h-4 w-4 mr-2" />
                {isSeeding ? 'Populando...' : 'Popular BD'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentUpload(true)}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload IA
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings')}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Dashboard Principal
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Visão completa do sistema Marine Safe Station
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Última atualização</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{dataAtualizacao}</p>
            </div>
          </div>
        </div>

        {/* PWA Install Prompt */}
        <div className="mb-6">
          <PWAInstallPrompt />
        </div>

        {/* KPI Cards - Destaque */}
        <div className="mb-8">
          <KpiCards kpis={kpiData} />
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center">
                <Zap className="h-6 w-6 mr-2" />
                Ações Rápidas
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Acesso direto às principais funcionalidades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Link href="/jangadas">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 transition-all duration-200 hover:scale-105">
                    <Anchor className="h-8 w-8" />
                    <span className="text-sm font-medium">Jangadas</span>
                  </Button>
                </Link>
                <Link href="/navios">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 hover:scale-105">
                    <Ship className="h-8 w-8" />
                    <span className="text-sm font-medium">Navios</span>
                  </Button>
                </Link>
                <Link href="/clientes">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 transition-all duration-200 hover:scale-105">
                    <Users className="h-8 w-8" />
                    <span className="text-sm font-medium">Clientes</span>
                  </Button>
                </Link>
                <Link href="/inspecoes">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-teal-600 hover:bg-teal-700 transition-all duration-200 hover:scale-105">
                    <ClipboardCheck className="h-8 w-8" />
                    <span className="text-sm font-medium">Inspeções</span>
                  </Button>
                </Link>
                <Link href="/alertas">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-red-600 hover:bg-red-700 transition-all duration-200 hover:scale-105">
                    <AlertTriangle className="h-8 w-8" />
                    <span className="text-sm font-medium">Alertas</span>
                  </Button>
                </Link>
                <Link href="/gestao/agenda">
                  <Button variant="default" className="w-full h-24 flex flex-col items-center justify-center gap-3 bg-pink-600 hover:bg-pink-700 transition-all duration-200 hover:scale-105">
                    <Calendar className="h-8 w-8" />
                    <span className="text-sm font-medium">Agenda</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Overview */}
          <div className="lg:col-span-2">
            <StatusCards items={statusItems} summary={statusSummary} />
          </div>

          {/* Alertas Widget */}
          <div>
            <AlertasWidget />
          </div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Tendências de Inspeções
              </CardTitle>
              <CardDescription>
                Análise temporal das inspeções realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart data={trendData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Timeline de Atividades
              </CardTitle>
              <CardDescription>
                Cronograma de inspeções e manutenções
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineChart items={proximosVencimentos} />
            </CardContent>
          </Card>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <ExecutiveSummary
            resumo={resumo?.resumoExecutivo || {
              totalInspecoes: 0,
              aprovadas: 0,
              reprovadas: 0,
              comCondicoes: 0,
              taxaAprovacao: 0,
              custoTotalInspecoes: 0
            }}
            kpis={kpiData}
          />
        </div>

        {/* Smart Notifications */}
        <div className="mb-8">
          <SmartNotifications items={statusItems || []} />
        </div>

        {/* Additional Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Gestão Operacional
            </CardTitle>
            <CardDescription>
              Acesso às ferramentas de gestão e configuração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/componentes">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Package className="h-5 w-5" />
                  <span className="text-xs">Stock</span>
                </Button>
              </Link>
              <Link href="/marcas">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Wrench className="h-5 w-5" />
                  <span className="text-xs">Marcas</span>
                </Button>
              </Link>
              <Link href="/cilindros">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Activity className="h-5 w-5" />
                  <span className="text-xs">Cilindros</span>
                </Button>
              </Link>
              <Link href="/logistica">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Logística</span>
                </Button>
              </Link>
              <Link href="/estacao-servico">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-xs">Estação</span>
                </Button>
              </Link>
              <Link href="/obras">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Clock className="h-5 w-5" />
                  <span className="text-xs">Obras</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
      />

      {/* Julinho Chatbot */}
      <JulinhoChatbot />

      {/* Assistente Julinho Flutuante */}
      <AssistenteJulinho />
    </div>
  );
}

export default DashboardPage;

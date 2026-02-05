"use client";

export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ship, Anchor, Users, Package, Calendar, AlertTriangle, Activity, Settings, ClipboardCheck, Wrench, FileText } from "lucide-react";
import { useDadosCruzados } from "@/hooks/use-dados-cruzados";
import { TecnicoSelector } from "@/components/tecnico-selector";
import { StatusCards } from "@/components/dashboard/status-cards";
import { TimelineChart } from "@/components/dashboard/timeline-chart";
import { SmartNotifications } from "@/components/dashboard/smart-notifications";
import { AlertasWidget } from "@/components/alertas-widget";
import { JulinhoWidget } from "@/components/dashboard/julinho-widget";
import { useStatusDashboard } from "@/hooks/use-status-dashboard";
import { useDashboardResumo } from "@/hooks/use-dashboard-resumo";
import { useTendenciasInspecao } from "@/hooks/use-inspecoes";
import { useCronogramas } from "@/hooks/use-cronogramas";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { ExecutiveSummary } from "@/components/dashboard/executive-summary";
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

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Carregando dados do dashboard...</div>;
  }
  if (error || !stats) {
    return <div className="p-8 text-center text-red-600">Erro ao carregar dados do dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation Header */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                Gestor Naval Pro
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/jangadas" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-2 rounded-md text-sm font-bold">
                  Jangadas
                </Link>
                <Link href="/stock" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Stock
                </Link>
                <Link href="/marcas" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Marcas
                </Link>
                <Link href="/modelos" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Modelos
                </Link>
                <Link href="/stock" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Stock
                </Link>
                <Link href="/clientes" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Clientes
                </Link>
                <Link href="/navios" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Navios
                </Link>
                <Link href="/cilindros" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Cilindros
                </Link>
                <Link href="/gestao/agenda" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Agenda
                </Link>
                <Link href="/alertas" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Alertas
                </Link>
                <Link href="/inspecoes" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Inspeções
                </Link>
                <Link href="/logistica" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Logística
                </Link>
                <Link href="/estacao-servico" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Estação de Serviço
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="hover:bg-green-50"
              >
                <Package className="h-4 w-4 mr-2" />
                {isSeeding ? 'Populando...' : 'Popular BD'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/settings')}
                className="hover:bg-blue-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visão geral do sistema Marine Safe Station
          </p>
          <p className="text-xs text-gray-400 mt-1">Última atualização: {dataAtualizacao}</p>
        </div>

        {/* Técnico Selector */}
        <div className="mb-8 flex justify-center">
          <TecnicoSelector />
        </div>

        {/* Widget do Julinho - Destaque Principal */}
        <div className="mb-8">
          <JulinhoWidget />
        </div>

        {/* PWA Install Prompt */}
        <div className="mb-8">
          <PWAInstallPrompt />
        </div>

        {/* Links Rápidos - Destaque */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Acesso Rápido
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Navegue rapidamente para as principais áreas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-13 gap-3">
              <Link href="/jangadas">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                  <Anchor className="h-6 w-6" />
                  <span className="text-sm font-medium">Jangadas</span>
                </Button>
              </Link>
              <Link href="/navios">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Ship className="h-6 w-6" />
                  <span className="text-sm font-medium">Navios</span>
                </Button>
              </Link>
              <Link href="/clientes">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700">
                  <Users className="h-6 w-6" />
                  <span className="text-sm font-medium">Clientes</span>
                </Button>
              </Link>
              <Link href="/stock">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700">
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Stock</span>
                </Button>
              </Link>
              <Link href="/marcas">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700">
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Marcas</span>
                </Button>
              </Link>
              <Link href="/modelos">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700">
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Modelos</span>
                </Button>
              </Link>
              <Link href="/stock">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700">
                  <Package className="h-6 w-6" />
                  <span className="text-sm font-medium">Stock</span>
                </Button>
              </Link>
              <Button
                variant="default"
                className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700"
                onClick={() => setShowDocumentUpload(true)}
              >
                <ClipboardCheck className="h-6 w-6" />
                <span className="text-sm font-medium">Upload IA</span>
              </Button>
              <Link href="/cilindros">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700">
                  <Activity className="h-6 w-6" />
                  <span className="text-sm font-medium">Cilindros</span>
                </Button>
              </Link>
              <Link href="/inspecoes">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700">
                  <ClipboardCheck className="h-6 w-6" />
                  <span className="text-sm font-medium">Inspeções</span>
                </Button>
              </Link>
              <Link href="/gestao/agenda">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm font-medium">Agenda</span>
                </Button>
              </Link>
              <Link href="/alertas">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-sm font-medium">Alertas</span>
                </Button>
              </Link>
              <Link href="/obras">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700">
                  <Wrench className="h-6 w-6" />
                  <span className="text-sm font-medium">Obras</span>
                </Button>
              </Link>
              <Link href="/faturas">
                <Button variant="default" className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <FileText className="h-6 w-6" />
                  <span className="text-sm font-medium">Faturas</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPIs - Clicáveis */}
        {resumo?.kpis && Array.isArray(resumo.kpis) && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {resumo.kpis.map((kpi: any, idx: number) => {
              const links: Record<string, string> = {
                'Jangadas': '/jangadas',
                'Navios': '/navios',
                'Clientes': '/clientes',
                'Stock': '/stock',
                'Cilindros': '/cilindros',
                'Inspeções': '/inspecoes',
                'Agenda': '/gestao/agenda',
                'Alertas': '/alertas',
                'Obras': '/obras',
                'Faturas': '/faturas'
              };
              const href = links[kpi.titulo] || '#';
              return (
                <Link key={idx} href={href}>
                  <Card className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{kpi.titulo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{kpi.valor}</div>
                      <p className="text-xs text-gray-500 mt-1">{kpi.descricao}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Alertas Widget */}
        <div className="mb-8">
          <AlertasWidget />
        </div>

        {/* Smart Notifications */}
        <SmartNotifications items={statusItems} />

        {/* Resumo Executivo */}
        {resumo?.resumoExecutivo && resumo?.kpis && (
          <div className="mb-8">
            <ExecutiveSummary resumo={resumo.resumoExecutivo} kpis={resumo.kpis} />
          </div>
        )}

        {/* Tendências */}
        {tendenciasResponse?.data && tendenciasResponse.data.length > 0 && (
          <div className="mb-8">
            <TrendChart data={tendenciasResponse.data} />
          </div>
        )}

        {/* Timeline Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <TimelineChart items={proximosVencimentos} />
        </div>

        {statusItems.length > 0 && (
          <StatusCards items={statusItems} summary={statusSummary} />
        )}

        {/* Cronograma de manutenção */}
        {Array.isArray(cronogramas) && cronogramas.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Cronograma de manutenção automático</CardTitle>
              <CardDescription>Próximas manutenções programadas - clique para ver detalhes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cronogramas.slice(0, 5).map((item: any) => {
                  let href = '#';
                  if (item.navio?.id) href = `/navios/${item.navio.id}`;
                  else if (item.jangada?.id) href = `/jangadas/${item.jangada.id}`;
                  else if (item.cilindro?.id) href = `/cilindros/${item.cilindro.id}`;
                  
                  return (
                    <Link key={item.id} href={href}>
                      <div className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900 transition-colors">
                        <div>
                          <p className="font-medium">{item.titulo}</p>
                          <p className="text-sm text-gray-600">
                            {item.navio?.nome || item.jangada?.numeroSerie || item.cilindro?.numeroSerie || 'Equipamento'}
                          </p>
                        </div>
                        <Badge variant={new Date(item.proximaManutencao) < new Date() ? 'destructive' : 'outline'}>
                          {new Date(item.proximaManutencao).toLocaleDateString('pt-PT')}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Jangadas */}
          <Link href="/jangadas">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jangadas</CardTitle>
                <Anchor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.jangadas.total}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default">{stats.jangadas.ativas} ativas</Badge>
                  <Badge variant="secondary">{stats.jangadas.manutencao} manutenção</Badge>
                  {stats.jangadas.expirando > 0 && (
                    <Badge variant="destructive">{stats.jangadas.expirando} expirando</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Navios */}
          <Link href="/navios">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Navios</CardTitle>
                <Ship className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.navios.total}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default">{stats.navios.ativas} ativas</Badge>
                  <Badge variant="secondary">{stats.navios.manutencao} manutenção</Badge>
                  {stats.navios.expirando > 0 && (
                    <Badge variant="destructive">{stats.navios.expirando} expirando</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Clientes */}
          <Link href="/clientes">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.clientes.total}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="default">{stats.clientes.ativos} ativos</Badge>
                  <Badge variant="outline">+{stats.clientes.novosMes} este mês</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Stock */}
          <Link href="/stock">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{stats.stock.valorTotal.toLocaleString()}</div>
                <div className="flex gap-2 mt-2">
                  {stats.stock.itensBaixo > 0 && (
                    <Badge variant="destructive">{stats.stock.itensBaixo} baixo stock</Badge>
                  )}
                  {stats.stock.itensEsgotados > 0 && (
                    <Badge variant="destructive">{stats.stock.itensEsgotados} esgotados</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Cilindros */}
          <Link href="/cilindros">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cilindros</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cilindros.total}</div>
                <div className="flex gap-2 mt-2">
                  {stats.cilindros.expirando > 0 && (
                    <Badge variant="destructive">{stats.cilindros.expirando} expirando</Badge>
                  )}
                  {stats.cilindros.defeituosos > 0 && (
                    <Badge variant="destructive">{stats.cilindros.defeituosos} defeituosos</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Agenda */}
          <Link href="/gestao/agenda">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agenda</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.agenda.hoje}</div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{stats.agenda.semana} esta semana</Badge>
                  <Badge variant="outline">{stats.agenda.mes} este mês</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Alerts Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
              Alertas e Notificações
            </CardTitle>
            <CardDescription>
              Itens que requerem atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.jangadas.expirando > 0 && (
                <Link href="/jangadas">
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium">Inspeções de Jangadas Pendentes</p>
                      <p className="text-sm text-gray-600">{stats.jangadas.expirando} jangadas precisam de inspeção</p>
                    </div>
                    <Badge variant="destructive">Urgente</Badge>
                  </div>
                </Link>
              )}
              {stats.stock.itensBaixo > 0 && (
                <Link href="/stock">
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium">Stock Baixo</p>
                      <p className="text-sm text-gray-600">{stats.stock.itensBaixo} itens com quantidade abaixo do mínimo</p>
                    </div>
                    <Badge variant="secondary">Atenção</Badge>
                  </div>
                </Link>
              )}
              {stats.stock.itensEsgotados > 0 && (
                <Link href="/stock">
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium">Itens Esgotados</p>
                      <p className="text-sm text-gray-600">{stats.stock.itensEsgotados} itens sem stock disponível</p>
                    </div>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>
                </Link>
              )}
              {stats.cilindros.expirando > 0 && (
                <Link href="/cilindros">
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium">Testes de Cilindros Pendentes</p>
                      <p className="text-sm text-gray-600">{stats.cilindros.expirando} cilindros precisam de teste hidráulico</p>
                    </div>
                    <Badge variant="destructive">Urgente</Badge>
                  </div>
                </Link>
              )}
              {stats.cilindros.defeituosos > 0 && (
                <Link href="/cilindros">
                  <div className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div>
                      <p className="font-medium">Cilindros Defeituosos</p>
                      <p className="text-sm text-gray-600">{stats.cilindros.defeituosos} cilindros marcados como defeituosos</p>
                    </div>
                    <Badge variant="destructive">Crítico</Badge>
                  </div>
                </Link>
              )}
              {stats.stock.itensBaixo === 0 && stats.stock.itensEsgotados === 0 &&
               stats.jangadas.expirando === 0 && stats.cilindros.expirando === 0 &&
               stats.cilindros.defeituosos === 0 && (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div>
                    <p className="font-medium text-green-800">Sistema OK</p>
                    <p className="text-sm text-green-600">Nenhum alerta pendente no momento</p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800">Tudo bem</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesso direto às funcionalidades mais utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link href="/jangadas/novo">
                <Button variant="outline" className="h-20 flex-col w-full hover:bg-blue-50 hover:border-blue-300">
                  <Anchor className="h-6 w-6 mb-2" />
                  Nova Jangada
                </Button>
              </Link>
              <Link href="/navios/novo">
                <Button variant="outline" className="h-20 flex-col w-full hover:bg-indigo-50 hover:border-indigo-300">
                  <Ship className="h-6 w-6 mb-2" />
                  Novo Navio
                </Button>
              </Link>
              <Link href="/clientes/novo">
                <Button variant="outline" className="h-20 flex-col w-full hover:bg-purple-50 hover:border-purple-300">
                  <Users className="h-6 w-6 mb-2" />
                  Novo Cliente
                </Button>
              </Link>
              <Link href="/inspecoes">
                <Button variant="outline" className="h-20 flex-col w-full hover:bg-teal-50 hover:border-teal-300">
                  <ClipboardCheck className="h-6 w-6 mb-2" />
                  Ver Inspeções
                </Button>
              </Link>
              <Link href="/gestao/agenda">
                <Button variant="outline" className="h-20 flex-col w-full hover:bg-pink-50 hover:border-pink-300">
                  <Calendar className="h-6 w-6 mb-2" />
                  Agendar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentUploadDialog 
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
      />
    </div>
  );
}

export default DashboardPage;
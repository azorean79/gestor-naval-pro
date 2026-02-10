"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, AlertTriangle, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Jangada {
  id: string;
  numeroSerie: string;
  modelo: string;
  marca: string;
  status: string;
  localizacaoAtual: string;
  dataUltimaInspecao: string;
  proximaInspecao: string;
  navioInstalado: string;
  cliente: string;
}

export default function EstacaoServicoPage() {
  const [jangadas, setJangadas] = useState<Jangada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJangada, setSelectedJangada] = useState<Jangada | null>(null);

  useEffect(() => {
    const fetchJangadas = async () => {
      try {
        const response = await fetch('/api/estacao-servico/jangadas');
        if (response.ok) {
          setJangadas(await response.json());
        }
      } catch (error) {
        console.error('Erro ao carregar jangadas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJangadas();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'instalado':
        return 'bg-green-600';
      case 'em manutenção':
        return 'bg-yellow-600';
      case 'aguardando inspeção':
        return 'bg-blue-600';
      case 'defeituoso':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'instalado':
        return <CheckCircle className="h-4 w-4" />;
      case 'em manutenção':
        return <Wrench className="h-4 w-4" />;
      case 'aguardando inspeção':
        return <Clock className="h-4 w-4" />;
      case 'defeituoso':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="text-center text-gray-500">Carregando dados da estação de serviço...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Wrench className="h-8 w-8 text-blue-600" />
                Estação de Serviço - Cabouco
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Todas as jangadas recebidas na estação de serviço
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Aguardando Inspeção
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jangadas.filter(j => j.status === 'Aguardando Inspeção').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wrench className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Em Manutenção
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jangadas.filter(j => j.status === 'Em Manutenção').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Defeituosas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jangadas.filter(j => j.status === 'Defeituoso').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Total Recebidas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {jangadas.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jangadas List */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Jangadas Recebidas</CardTitle>
            <CardDescription>
              Lista completa de todas as jangadas que estão na estação de serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jangadas.map((jangada) => (
                <div
                  key={jangada.id}
                  onClick={() => setSelectedJangada(selectedJangada?.id === jangada.id ? null : jangada)}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${getStatusColor(jangada.status)}`}>
                        {getStatusIcon(jangada.status)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {jangada.numeroSerie}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {jangada.marca} - {jangada.modelo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(jangada.status)}>
                            {jangada.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Cliente: {jangada.cliente}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Localização
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {jangada.localizacaoAtual}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Última inspeção: {new Date(jangada.dataUltimaInspecao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {selectedJangada?.id === jangada.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Navio Instalado
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {jangada.navioInstalado || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Próxima Inspeção
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(jangada.proximaInspecao).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            Cliente
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {jangada.cliente}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
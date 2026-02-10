"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Save,
  Camera,
  FileText,
  Clock,
  User,
  RefreshCw,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useChecklistInspecao } from "@/hooks/use-checklist-inspecao";

interface ChecklistItem {
  id: string;
  categoria: string;
  item: string;
  descricao: string;
  obrigatorio: boolean;
  status: 'pendente' | 'aprovado' | 'reprovado' | 'nao_aplicavel';
  observacoes: string;
  fonte: 'quadro' | 'manual' | 'componentes' | 'stock' | 'testes' | 'boletins';
  componenteId?: string;
}

interface Jangada {
  id: string;
  numeroSerie: string;
  modelo: string;
  marca: string;
  cliente: string;
  navio: string;
}

export default function InspecaoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jangadaId = searchParams.get('jangada');

  const [jangada, setJangada] = useState<Jangada | null>(null);
  const [observacoesGerais, setObservacoesGerais] = useState('');
  const [recomendacoes, setRecomendacoes] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    checklist,
    loading: checklistLoading,
    error: checklistError,
    updateChecklistItem,
    getProgress,
    getResultadoGeral,
    getEstatisticasPorFonte,
    regenerarChecklist
  } = useChecklistInspecao(jangadaId || undefined);

  // Obter categorias únicas do checklist
  const categorias = Array.from(new Set(checklist.map(item => item.categoria)));

  useEffect(() => {
    if (jangadaId) {
      fetchJangada(jangadaId);
    }
  }, [jangadaId]);

  const fetchJangada = async (id: string) => {
    try {
      const response = await fetch(`/api/jangadas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJangada(data);
      }
    } catch (error) {
      console.error('Erro ao carregar jangada:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'text-green-600';
      case 'reprovado': return 'text-red-600';
      case 'nao_aplicavel': return 'text-gray-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado': return <CheckCircle className="w-4 h-4" />;
      case 'reprovado': return <XCircle className="w-4 h-4" />;
      case 'nao_aplicavel': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getFonteColor = (fonte: string) => {
    switch (fonte) {
      case 'quadro': return 'bg-blue-100 text-blue-800';
      case 'manual': return 'bg-green-100 text-green-800';
      case 'componentes': return 'bg-purple-100 text-purple-800';
      case 'stock': return 'bg-orange-100 text-orange-800';
      case 'testes': return 'bg-red-100 text-red-800';
      case 'boletins': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async () => {
    if (getResultadoGeral() === 'pendente') {
      alert('Todos os itens obrigatórios devem ser verificados');
      return;
    }

    setLoading(true);

    try {
      const resultado = getResultadoGeral();

      // Criar relatório de inspeção
      const relatorioData = {
        jangadaId,
        checklist,
        observacoesGerais,
        recomendacoes,
        fotos,
        resultado,
        dataInspecao: new Date().toISOString(),
        tecnico: 'Julio Correia'
      };

      const response = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relatorioData),
      });

      if (response.ok) {
        // Atualizar status da jangada
        await fetch(`/api/jangadas/${jangadaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: resultado === 'aprovado' ? 'inspecionado' : 'reprovado',
            dataInspecao: new Date().toISOString(),
            resultadoInspecao: resultado
          }),
        });

        router.push('/workflow');
      } else {
        const error = await response.json();
        alert('Erro ao salvar inspeção: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao salvar inspeção');
    } finally {
      setLoading(false);
    }
  };

  if (checklistLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Gerando checklist de inspeção...</p>
          </div>
        </div>
      </div>
    );
  }

  if (checklistError) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/workflow">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Erro na Inspeção</h1>
          </div>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {checklistError}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={regenerarChecklist} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Inspeção Técnica</h1>
          <p className="text-gray-600">Executar checklist de inspeção da jangada</p>
        </div>
      </div>

      {jangada && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Jangada em Inspeção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{jangada.numeroSerie}</h3>
                <p className="text-sm text-gray-600">
                  {jangada.modelo} - {jangada.marca} • {jangada.cliente} • {jangada.navio}
                </p>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                Em Inspeção
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Inspeção</span>
                  <span>{Math.round(getProgress())}% concluído</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={regenerarChecklist}
                disabled={checklistLoading}
                className="ml-4"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${checklistLoading ? 'animate-spin' : ''}`} />
                Regenerar Checklist
              </Button>
            </div>

            {/* Estatísticas por Fonte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {Object.entries(getEstatisticasPorFonte()).map(([fonte, stats]) => (
                <div key={fonte} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize">{fonte}</span>
                    <Badge className={getFonteColor(fonte)}>
                      {stats.total} itens
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>✅ {stats.aprovados}</span>
                    <span>❌ {stats.reprovados}</span>
                    <span>⏳ {stats.pendentes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklist por Categoria */}
      <div className="space-y-6">
        {categorias.map((categoria) => (
          <Card key={categoria}>
            <CardHeader>
              <CardTitle className="text-lg">{categoria}</CardTitle>
              <CardDescription>
                Itens a verificar nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklist
                  .filter(item => item.categoria === categoria)
                  .map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{item.item}</h4>
                            {item.obrigatorio && (
                              <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                            )}
                            <Badge className={`text-xs ${getFonteColor(item.fonte)}`}>
                              {item.fonte}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{item.descricao}</p>

                          {/* Status Options */}
                          <div className="flex space-x-4 mb-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${item.id}`}
                                value="aprovado"
                                checked={item.status === 'aprovado'}
                                onChange={() => updateChecklistItem(item.id, 'status', 'aprovado')}
                                className="text-green-600"
                              />
                              <span className="text-sm flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovado
                              </span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${item.id}`}
                                value="reprovado"
                                checked={item.status === 'reprovado'}
                                onChange={() => updateChecklistItem(item.id, 'status', 'reprovado')}
                                className="text-red-600"
                              />
                              <span className="text-sm flex items-center text-red-600">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reprovado
                              </span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${item.id}`}
                                value="nao_aplicavel"
                                checked={item.status === 'nao_aplicavel'}
                                onChange={() => updateChecklistItem(item.id, 'status', 'nao_aplicavel')}
                                className="text-gray-600"
                              />
                              <span className="text-sm flex items-center text-gray-600">
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                N/A
                              </span>
                            </label>
                          </div>

                          {/* Observações */}
                          <Textarea
                            placeholder="Observações sobre este item..."
                            value={item.observacoes}
                            onChange={(e) => updateChecklistItem(item.id, 'observacoes', e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Observações Gerais */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Observações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Observações da Inspeção</label>
            <Textarea
              value={observacoesGerais}
              onChange={(e) => setObservacoesGerais(e.target.value)}
              placeholder="Observações gerais sobre a inspeção..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recomendações</label>
            <Textarea
              value={recomendacoes}
              onChange={(e) => setRecomendacoes(e.target.value)}
              placeholder="Recomendações para manutenção ou reparos..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Resultado */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resultado da Inspeção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              getResultadoGeral() === 'aprovado' ? 'bg-green-100' :
              getResultadoGeral() === 'reprovado' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {getResultadoGeral() === 'aprovado' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : getResultadoGeral() === 'reprovado' ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Clock className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold capitalize">
                {getResultadoGeral() === 'aprovado' ? 'Aprovado' :
                 getResultadoGeral() === 'reprovado' ? 'Reprovado' : 'Pendente'}
              </h3>
              <p className="text-sm text-gray-600">
                {getResultadoGeral() === 'aprovado' ? 'Todos os itens obrigatórios foram aprovados' :
                 getResultadoGeral() === 'reprovado' ? 'Um ou mais itens obrigatórios foram reprovados' :
                 'Itens obrigatórios ainda pendentes'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex justify-end space-x-4 mt-6">
        <Link href="/workflow">
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={loading || getResultadoGeral() === 'pendente'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Finalizar Inspeção
        </Button>
      </div>
    </div>
  );
}
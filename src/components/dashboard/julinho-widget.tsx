'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useJulinhoWidget } from '@/hooks/use-julinho-widget';
import { useRouter } from 'next/navigation';
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  RefreshCw,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';

export function JulinhoWidget() {
  const { resumo, isLoading, error, refresh } = useJulinhoWidget();
  const router = useRouter();

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Erro ao carregar Julinho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm" className="mt-2">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !resumo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 animate-pulse" />
            Julinho - Assistente Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return <Badge variant="destructive">URGENTE</Badge>;
      case 'alta':
        return <Badge className="bg-orange-500">Alta</Badge>;
      case 'media':
        return <Badge variant="secondary">Média</Badge>;
      default:
        return <Badge variant="outline">Baixa</Badge>;
    }
  };

  const temAlertasUrgentes = resumo.alertas.some(a => a.prioridade === 'urgente');

  return (
    <Card className={temAlertasUrgentes ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-4 w-4 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">Julinho - Assistente Inteligente</CardTitle>
              <CardDescription>{resumo.mensagemBomDia}</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} title="Atualizar">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Rápido */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {resumo.agendamentosHoje}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Agendamentos Hoje</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {resumo.jangadasVencimento}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Jangadas 30 dias</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {resumo.cilindrosExpirados}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Cilindros Expirados</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {resumo.obrasAbertas}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Obras Abertas</div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {resumo.alertas.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Alertas Críticos ({resumo.alertas.length})
            </h4>
            <div className="space-y-2">
              {resumo.alertas.slice(0, 3).map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{alerta.titulo}</span>
                      {getPrioridadeBadge(alerta.prioridade)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {alerta.descricao}
                    </p>
                  </div>
                </div>
              ))}
              {resumo.alertas.length > 3 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => router.push('/alertas')}
                  className="w-full"
                >
                  Ver todos os {resumo.alertas.length} alertas
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sugestões do Julinho */}
        {resumo.sugestoes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Sugestões do Julinho
            </h4>
            <div className="space-y-2">
              {resumo.sugestoes.map((sugestao) => (
                <div
                  key={sugestao.id}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <span className="text-xl">{sugestao.icone}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{sugestao.titulo}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {sugestao.descricao}
                    </p>
                  </div>
                  {sugestao.acao && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(sugestao.acao!)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem alertas - Tudo OK */}
        {resumo.alertas.length === 0 && resumo.sugestoes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tudo em ordem! 🎉
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Sem alertas críticos no momento
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

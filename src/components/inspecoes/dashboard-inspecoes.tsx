import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useInspecoes } from '@/hooks/use-gestao-inspecoes';
import { formatDate } from '@/lib/formatDate';

export function DashboardInspecoes() {
  const { inspecoes } = useInspecoes();

  const inspecoesPendentes = inspecoes.filter(i => i.status === 'em_andamento');
  const inspecoesVencidas = inspecoes.filter(i => {
    const dataInspecao = new Date(i.dataInspecao);
    const hoje = new Date();
    return dataInspecao < hoje && i.status === 'em_andamento';
  });

  const proximasInspecoes = inspecoes
    .filter(i => i.status === 'em_andamento')
    .sort((a, b) => new Date(a.dataInspecao).getTime() - new Date(b.dataInspecao).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{inspecoesPendentes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">{inspecoesVencidas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">
                  {inspecoes.filter(i => i.status === 'aprovada').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{inspecoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximas Inspeções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Próximas Inspeções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proximasInspecoes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma inspeção agendada</p>
          ) : (
            <div className="space-y-4">
              {proximasInspecoes.map(inspecao => (
                <div key={inspecao.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{inspecao.equipamentoNome}</h4>
                    <p className="text-sm text-muted-foreground">{inspecao.clienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                      {formatDate(inspecao.dataInspecao)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      inspecao.tipoInspecao === 'anual' ? 'default' :
                      inspecao.tipoInspecao === 'extraordinaria' ? 'destructive' :
                      'secondary'
                    }>
                      {inspecao.tipoInspecao}
                    </Badge>
                    <Button size="sm" variant="outline">
                      Continuar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      {inspecoesVencidas.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Inspeções Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inspecoesVencidas.map(inspecao => (
                <div key={inspecao.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{inspecao.equipamentoNome}</p>
                    <p className="text-sm text-muted-foreground">
                      Venceu em {formatDate(inspecao.dataInspecao)}
                    </p>
                  </div>
                  <Button size="sm" variant="destructive">
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTestesSOLAS, type ResultadoTestesSOLAS } from '@/hooks/use-testes-solas';
import { 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Euro, 
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

interface TestesSOLASWidgetProps {
  dataFabricacao: Date | null | undefined;
  showCustos?: boolean;
  compact?: boolean;
}

export function TestesSOLASWidget({ 
  dataFabricacao, 
  showCustos = true,
  compact = false 
}: TestesSOLASWidgetProps) {
  const resultado = useTestesSOLAS(dataFabricacao);

  if (!resultado) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Sem Data de Fabricação</AlertTitle>
        <AlertDescription>
          Por favor, adicione a data de fabricação da jangada para calcular os testes obrigatórios.
        </AlertDescription>
      </Alert>
    );
  }

  const { idadeAnos, testesObrigatorios, testesOpcionais, custoTotal } = resultado;

  // Alertas importantes
  const alertas = [];
  if (idadeAnos >= 9 && idadeAnos < 10) {
    alertas.push({
      tipo: 'warning',
      titulo: 'Atenção: Testes Adicionais em Breve',
      mensagem: `A jangada completará 10 anos em breve. A partir do 10º ano, FS Test e NAP Test tornam-se obrigatórios anualmente.`,
    });
  }
  if (idadeAnos >= 10) {
    alertas.push({
      tipo: 'info',
      titulo: 'Testes Reforçados Obrigatórios',
      mensagem: `Jangada com ${idadeAnos} anos. FS Test e NAP Test obrigatórios anualmente conforme IMO MSC.81(70).`,
    });
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Testes SOLAS/IMO Obrigatórios</CardTitle>
              <CardDescription className="text-sm">
                Jangada com {idadeAnos} anos
              </CardDescription>
            </div>
            <Badge variant={testesObrigatorios.length > 3 ? 'destructive' : 'default'} className="ml-2">
              {testesObrigatorios.length} testes
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {testesObrigatorios.map((teste, index) => (
              <div key={index} className="flex items-start justify-between text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{teste.nome}</div>
                    <div className="text-xs text-muted-foreground">{teste.norma}</div>
                  </div>
                </div>
                {showCustos && (
                  <div className="text-sm font-semibold text-right ml-2">
                    €{teste.custo.toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
          {showCustos && (
            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-sm font-medium">Total dos Testes</span>
              <span className="text-lg font-bold">€{custoTotal.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas */}
      {alertas.map((alerta, index) => (
        <Alert key={index} variant={alerta.tipo === 'warning' ? 'destructive' : 'default'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{alerta.titulo}</AlertTitle>
          <AlertDescription>{alerta.mensagem}</AlertDescription>
        </Alert>
      ))}

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Testes SOLAS/IMO Obrigatórios
              </CardTitle>
              <CardDescription className="mt-1">
                Baseado na idade da jangada e normas internacionais de segurança marítima
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Idade da Jangada</div>
              <div className="text-2xl font-bold">{idadeAnos} anos</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-xs text-muted-foreground">Testes Obrigatórios</div>
                <div className="text-xl font-bold">{testesObrigatorios.length}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-xs text-muted-foreground">Frequência</div>
                <div className="text-xl font-bold">Anual</div>
              </div>
            </div>
            {showCustos && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Euro className="h-8 w-8 text-orange-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Custo Total</div>
                  <div className="text-xl font-bold">€{custoTotal.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela de Testes Obrigatórios */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Testes a Realizar Nesta Inspeção
            </h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Teste</TableHead>
                    <TableHead className="w-[25%]">Norma</TableHead>
                    <TableHead className="w-[15%]">Frequência</TableHead>
                    {showCustos && <TableHead className="w-[12%] text-right">Custo</TableHead>}
                    <TableHead className="w-[13%]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testesObrigatorios.map((teste, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{teste.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {teste.norma}
                      </TableCell>
                      <TableCell className="text-sm">{teste.frequencia}</TableCell>
                      {showCustos && (
                        <TableCell className="text-right font-semibold">
                          €{teste.custo.toFixed(2)}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          Obrigatório
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Próximos Testes (Opcionais) */}
          {testesOpcionais.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Próximos Testes Futuros
              </h3>
              <div className="space-y-2">
                {testesOpcionais.map((teste, index) => {
                  const anoProximoTeste = teste.proximoTeste
                    ? new Date(dataFabricacao!).getFullYear() + teste.proximoTeste
                    : teste.idadeMinima
                    ? new Date().getFullYear() + (teste.idadeMinima - idadeAnos)
                    : null;

                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{teste.nome}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {teste.motivo}
                        </div>
                      </div>
                      {anoProximoTeste && (
                        <Badge variant="outline" className="ml-2">
                          {anoProximoTeste}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo Final */}
          {showCustos && (
            <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Custo Total dos Testes Obrigatórios</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {testesObrigatorios.length} teste{testesObrigatorios.length !== 1 ? 's' : ''} • Conforme SOLAS III/20 e IMO
                  </div>
                </div>
                <div className="text-3xl font-bold text-primary">
                  €{custoTotal.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

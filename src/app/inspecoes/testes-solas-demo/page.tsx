'use client';

import React, { useState } from 'react';
import { TestesSOLASWidget } from '@/components/inspecoes/testes-solas-widget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Ship } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function TestesSOLASDemo() {
  // Exemplo: Jangada fabricada em Maio 2014 (11 anos de idade)
  const [dataFabricacao, setDataFabricacao] = useState<Date>(new Date(2014, 4, 15));

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Ship className="h-8 w-8" />
            Testes SOLAS/IMO - Demonstração
          </h1>
          <p className="text-muted-foreground mt-2">
            Cálculo automático de testes obrigatórios baseado na idade da jangada
          </p>
        </div>
      </div>

      {/* Seletor de Data */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração da Jangada</CardTitle>
          <CardDescription>
            Selecione a data de fabricação para calcular os testes obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Fabricação</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-[280px] justify-start text-left font-normal',
                      !dataFabricacao && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFabricacao ? (
                      format(dataFabricacao, 'PPP', { locale: pt })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFabricacao}
                    onSelect={(date) => date && setDataFabricacao(date)}
                    disabled={(date) => date > new Date() || date < new Date('1990-01-01')}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setDataFabricacao(new Date(2014, 4, 15))}
              >
                11 anos (2014)
              </Button>
              <Button
                variant="outline"
                onClick={() => setDataFabricacao(new Date(2020, 0, 1))}
              >
                6 anos (2020)
              </Button>
              <Button
                variant="outline"
                onClick={() => setDataFabricacao(new Date(2006, 0, 1))}
              >
                20 anos (2006)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget Completo */}
      <TestesSOLASWidget dataFabricacao={dataFabricacao} showCustos={true} />

      {/* Versão Compacta */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Versão Compacta (com custos)</h2>
          <TestesSOLASWidget dataFabricacao={dataFabricacao} showCustos={true} compact={true} />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-3">Versão Compacta (sem custos)</h2>
          <TestesSOLASWidget dataFabricacao={dataFabricacao} showCustos={false} compact={true} />
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2">📋 Testes Calculados Automaticamente:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li><strong>Inspeção Visual</strong> e <strong>Teste de Pressão</strong> - Sempre obrigatórios (anual)</li>
              <li><strong>FS Test</strong> e <strong>NAP Test</strong> - Obrigatórios a partir do 10º ano (anual)</li>
              <li><strong>Gas Insuflation Test</strong> - A cada 5 anos (quinquenal)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">🔔 Alertas Preventivos:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Notifica quando a jangada tem 9 anos (preparação para testes adicionais)</li>
              <li>Indica quando testes quinquenais são necessários</li>
              <li>Mostra próximos testes futuros para planejamento</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">💰 Integração com Faturação:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Calcula automaticamente o custo total dos testes obrigatórios</li>
              <li>Pode ser integrado diretamente na criação de obras/faturas</li>
              <li>Serviços já criados automaticamente no stock</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">📚 Normas Implementadas:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>SOLAS III/20 - Safety of Life at Sea</li>
              <li>IMO MSC.218(82) - Revised recommendation on testing</li>
              <li>IMO MSC.81(70) - FS Test and NAP Test requirements</li>
              <li>IMO MSC.48(66) - Pressure Test standards</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

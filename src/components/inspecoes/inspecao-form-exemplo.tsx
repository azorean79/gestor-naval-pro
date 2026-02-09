// Exemplo de como integrar o widget de testes SOLAS no formulário de inspeção

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TestesSOLASWidget } from '@/components/inspecoes/testes-solas-widget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useTestesSOLAS } from '@/hooks/use-testes-solas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FormInspecaoData {
  jangadaId: string;
  dataInspecao: Date;
  tecnicoId: string;
  observacoes: string;
  testesRealizados: string[];
  custoTestes: number;
}

interface InspecaoFormProps {
  jangadaId: string;
  dataFabricacao: Date;
  numeroSerie: string;
  capacidade: number;
}

export function InspecaoFormComTestes({
  jangadaId,
  dataFabricacao,
  numeroSerie,
  capacidade,
}: InspecaoFormProps) {
  const form = useForm<FormInspecaoData>();
  const [testesSelecionados, setTestesSelecionados] = useState<Set<string>>(new Set());
  
  // Calcular testes obrigatórios
  const resultadoTestes = useTestesSOLAS(dataFabricacao);

  // Busca real dos boletins aplicados para a marca/modelo da jangada
  const [boletinsAplicados, setBoletinsAplicados] = useState<string[]>([]);
  const [boletinsConfirmados, setBoletinsConfirmados] = useState(false);

  React.useEffect(() => {
    async function fetchBoletins() {
      // Buscar dados reais da jangada
      const response = await fetch(`/api/jangadas/${jangadaId}`);
      if (!response.ok) return;
      const jangada = await response.json();
      const marcaBoletins = jangada?.marca?.boletinsAplicados || [];
      const modeloBoletins = jangada?.modelo?.boletinsAplicados || [];
      setBoletinsAplicados([...marcaBoletins, ...modeloBoletins]);
    }
    if (jangadaId) fetchBoletins();
  }, [jangadaId]);

  const handleTesteToggle = (testeNome: string, obrigatorio: boolean) => {
    if (obrigatorio) return; // Não permite desmarcar obrigatórios
    
    const novosTestes = new Set(testesSelecionados);
    if (novosTestes.has(testeNome)) {
      novosTestes.delete(testeNome);
    } else {
      novosTestes.add(testeNome);
    }
    setTestesSelecionados(novosTestes);
  };

  const calcularCustoTotal = () => {
    if (!resultadoTestes) return 0;
    
    let total = resultadoTestes.custoTotal; // Testes obrigatórios
    
    // Adicionar testes opcionais selecionados
    resultadoTestes.testesOpcionais.forEach((teste) => {
      if (testesSelecionados.has(teste.nome)) {
        total += teste.custo;
      }
    });
    
    return total;
  };

  const onSubmit = async (data: FormInspecaoData) => {
    if (!resultadoTestes) return;

    const testesParaRealizar = [
      ...resultadoTestes.testesObrigatorios.map((t) => t.nome),
      ...resultadoTestes.testesOpcionais
        .filter((t) => testesSelecionados.has(t.nome))
        .map((t) => t.nome),
    ];

    const dadosInspecao = {
      ...data,
      jangadaId,
      dataInspecao: new Date(),
      testesRealizados: testesParaRealizar,
      custoTestes: calcularCustoTotal(),
    };

    console.log('Criar inspeção:', dadosInspecao);
    // Aqui você faria a chamada à API para criar a inspeção
  };

  if (!resultadoTestes) {
    return <div>Carregando informações dos testes...</div>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Alerta visual de boletins aplicados */}
      {boletinsAplicados.length > 0 && (
        <Card className="bg-yellow-100 border-yellow-400">
          <CardHeader>
            <CardTitle>Boletins de Serviço Aplicados</CardTitle>
            <CardDescription>
              Atenção: Os seguintes boletins de serviço estão aplicados para esta marca/modelo:
              <ul className="mt-2 ml-4 list-disc text-sm">
                {boletinsAplicados.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <span className="block mt-2 font-semibold text-yellow-700">
                Verifique a aplicação dos boletins e registre na inspeção.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2">
              <Checkbox checked={boletinsConfirmados} onCheckedChange={() => setBoletinsConfirmados((v) => !v)} />
              <span className="text-sm">Confirmo que verifiquei e apliquei os boletins de serviço.</span>
            </label>
          </CardContent>
        </Card>
      )}
      {/* Informações da Jangada */}
      <Card>
        <CardHeader>
          <CardTitle>Inspeção de Jangada</CardTitle>
          <CardDescription>
            {numeroSerie} • {capacidade} pessoas • {resultadoTestes.idadeAnos} anos de idade
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="testes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testes">Testes SOLAS</TabsTrigger>
          <TabsTrigger value="componentes">Componentes</TabsTrigger>
          <TabsTrigger value="observacoes">Observações</TabsTrigger>
        </TabsList>

        <TabsContent value="testes" className="space-y-6">
          {/* Widget de Testes */}
          <TestesSOLASWidget 
            dataFabricacao={dataFabricacao} 
            showCustos={true}
            compact={false}
          />

          {/* Seleção de Testes Opcionais */}
          {resultadoTestes.testesOpcionais.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Testes Opcionais/Preventivos</CardTitle>
                <CardDescription>
                  Não obrigatórios nesta inspeção, mas podem ser realizados preventivamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {resultadoTestes.testesOpcionais.map((teste) => (
                  <div
                    key={teste.nome}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={teste.nome}
                        checked={testesSelecionados.has(teste.nome)}
                        onCheckedChange={() => handleTesteToggle(teste.nome, false)}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor={teste.nome}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          {teste.nome}
                        </label>
                        <p className="text-xs text-muted-foreground">{teste.motivo}</p>
                        <p className="text-xs text-muted-foreground">{teste.norma}</p>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">€{teste.custo.toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Resumo de Custos */}
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Testes Obrigatórios ({resultadoTestes.testesObrigatorios.length})</span>
                  <span className="font-semibold">€{resultadoTestes.custoTotal.toFixed(2)}</span>
                </div>
                {testesSelecionados.size > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Testes Opcionais ({testesSelecionados.size})</span>
                    <span className="font-semibold">
                      €
                      {resultadoTestes.testesOpcionais
                        .filter((t) => testesSelecionados.has(t.nome))
                        .reduce((sum, t) => sum + t.custo, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total dos Testes</span>
                  <span className="text-primary">€{calcularCustoTotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="componentes">
          {/* Aqui entraria a verificação de componentes */}
          <Card>
            <CardHeader>
              <CardTitle>Verificação de Componentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Verificação de validade dos componentes...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="observacoes">
          {/* Observações gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Observações da Inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md"
                placeholder="Observações gerais da inspeção..."
                {...form.register('observacoes')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancelar
        </Button>
        <Button type="submit">
          Criar Inspeção (€{calcularCustoTotal().toFixed(2)})
        </Button>
      </div>
    </form>
  );
}

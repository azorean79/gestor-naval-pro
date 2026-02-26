'use client';

import { useState } from 'react';
import { Plus, Truck, MapPin, Calendar, BarChart3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useLogistica } from '@/hooks/use-logistica';
import { AgendarTransporteForm } from '@/components/logistica/agendar-transporte-form';
import { ListaTransportes } from '@/components/logistica/lista-transportes';

export default function LogisticaPage() {
  const { transportes, portos, rotas, loading } = useLogistica();
  const [showAgendarDialog, setShowAgendarDialog] = useState(false);

  const transportesAtivos = transportes.filter(t => t.status === 'em_transito');
  const transportesAgendados = transportes.filter(t => t.status === 'agendado');
  const transportesConcluidos = transportes.filter(t => t.status === 'concluido');

  const handleTransporteCriado = () => {
    setShowAgendarDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando dados de logística...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logística de Jangadas</h1>
          <p className="text-muted-foreground">
            Gestão de transportes e logística entre ilhas dos Açores
          </p>
        </div>
        <Dialog open={showAgendarDialog} onOpenChange={setShowAgendarDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agendar Transporte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Novo Transporte</DialogTitle>
              <DialogDescription>
                Preencha os dados para agendar o transporte de uma jangada
              </DialogDescription>
            </DialogHeader>
            <AgendarTransporteForm onSuccess={handleTransporteCriado} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportes Ativos</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transportesAtivos.length}</div>
            <p className="text-xs text-muted-foreground">
              Em trânsito no momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transportesAgendados.length}</div>
            <p className="text-xs text-muted-foreground">
              Transportes programados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transportesConcluidos.length}</div>
            <p className="text-xs text-muted-foreground">
              Transportes finalizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portos.length}</div>
            <p className="text-xs text-muted-foreground">
              Portos disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="transportes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transportes">Transportes</TabsTrigger>
          <TabsTrigger value="portos">Portos</TabsTrigger>
          <TabsTrigger value="rotas">Rotas</TabsTrigger>
        </TabsList>

        <TabsContent value="transportes" className="space-y-4">
          <ListaTransportes
            transportes={transportes}
            onTransporteUpdated={() => {
              // O hook já faz o refetch automático
            }}
          />
        </TabsContent>

        <TabsContent value="portos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portos dos Açores</CardTitle>
              <CardDescription>
                Portos disponíveis para receção e envio de jangadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portos.map((porto) => (
                  <Card key={porto.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{porto.nome}</CardTitle>
                      <CardDescription>{porto.ilha}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="capitalize">{porto.tipo}</span>
                        </div>
                        {porto.capacidade && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capacidade:</span>
                            <span>{porto.capacidade} embarcações</span>
                          </div>
                        )}
                        {porto.contacto && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contacto:</span>
                            <span>{porto.contacto}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className={`capitalize ${
                            porto.status === 'ativo' ? 'text-green-600' :
                            porto.status === 'manutencao' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {porto.status}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {portos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum porto cadastrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotas de Transporte</CardTitle>
              <CardDescription>
                Rotas disponíveis entre ilhas dos Açores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rotas.map((rota) => (
                  <Card key={rota.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="font-medium">{rota.origemIlha}</div>
                            <div className="text-sm text-muted-foreground">Origem</div>
                          </div>
                          <div className="text-2xl text-muted-foreground">→</div>
                          <div className="text-center">
                            <div className="font-medium">{rota.destinoIlha}</div>
                            <div className="text-sm text-muted-foreground">Destino</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">€{rota.custoBase.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">
                            {rota.distanciaKm}km • {rota.tempoEstimadoHoras}h
                          </div>
                          {rota.frequencia && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {rota.frequencia}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {rotas.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma rota cadastrada
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Truck,
  Ship,
  Car,
  Anchor,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
  Calendar,
  User,
  Euro
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { useLogistica } from '@/hooks/use-logistica';
import { TransporteJangada, STATUS_TRANSPORTE, TIPOS_TRANSPORTE } from '@/lib/logistica-types';

interface ListaTransportesProps {
  transportes: TransporteJangada[];
  onTransporteUpdated?: () => void;
}

export function ListaTransportes({ transportes, onTransporteUpdated }: ListaTransportesProps) {
  const { atualizarTransporte, excluirTransporte } = useLogistica();
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [selectedTransporte, setSelectedTransporte] = useState<TransporteJangada | null>(null);

  const transportesFiltrados = filtroStatus === 'todos'
    ? transportes
    : transportes.filter(t => t.status === filtroStatus);

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_TRANSPORTE.find(s => s.value === status);
    if (!statusInfo) return <Badge variant="outline">{status}</Badge>;

    return (
      <Badge
        variant={statusInfo.color === 'green' ? 'default' : statusInfo.color === 'red' ? 'destructive' : 'secondary'}
      >
        {statusInfo.label}
      </Badge>
    );
  };

  const getTipoTransporteIcon = (tipo: string) => {
    switch (tipo) {
      case 'barco_transporte':
        return <Ship className="h-4 w-4" />;
      case 'ferry':
        return <Ship className="h-4 w-4" />;
      case 'reboque':
        return <Truck className="h-4 w-4" />;
      case 'proprio':
        return <Car className="h-4 w-4" />;
      default:
        return <Anchor className="h-4 w-4" />;
    }
  };

  const handleStatusChange = async (transporteId: string, novoStatus: 'agendado' | 'em_transito' | 'concluido' | 'cancelado') => {
    try {
      await atualizarTransporte(transporteId, { status: novoStatus });
      console.log('Status do transporte atualizado!');
      if (onTransporteUpdated) {
        onTransporteUpdated();
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleExcluirTransporte = async (transporteId: string) => {
    try {
      await excluirTransporte(transporteId);
      console.log('Transporte excluído com sucesso!');
      if (onTransporteUpdated) {
        onTransporteUpdated();
      }
    } catch (error) {
      console.error('Erro ao excluir transporte:', error);
    }
  };

  const TransporteDetalhes = ({ transporte }: { transporte: TransporteJangada }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Jangada</h4>
          <p className="font-medium">{transporte.jangadaNome}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Tipo de Transporte</h4>
          <div className="flex items-center gap-2">
            {getTipoTransporteIcon(transporte.tipoTransporte)}
            <span>{TIPOS_TRANSPORTE.find(t => t.value === transporte.tipoTransporte)?.label}</span>
          </div>
        </div>
      </div>

      <div className="border-t my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Origem</p>
            <p className="font-medium">{transporte.origemIlha}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Destino</p>
            <p className="font-medium">{transporte.destinoIlha}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-medium">
              {format(new Date(transporte.dataTransporte), "PPP", { locale: pt })}
            </p>
          </div>
        </div>
        {transporte.custoTransporte && (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Custo</p>
              <p className="font-medium">€{transporte.custoTransporte.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {transporte.veiculoTransporte && (
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Veículo/Embarcação</h4>
          <p>{transporte.veiculoTransporte}</p>
        </div>
      )}

      {transporte.motorista && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Motorista/Responsável</p>
            <p className="font-medium">{transporte.motorista}</p>
          </div>
        </div>
      )}

      {transporte.documentacao && (
        <>
          <div className="border-t my-4" />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Documentação</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {transporte.documentacao.seguroTransporte && (
                <Badge variant="outline" className="justify-start">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Seguro de Transporte
                </Badge>
              )}
              {transporte.documentacao.certificadoInspecao && (
                <Badge variant="outline" className="justify-start">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Certificado de Inspeção
                </Badge>
              )}
              {transporte.documentacao.autorizacaoTransito && (
                <Badge variant="outline" className="justify-start">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Autorização de Trânsito
                </Badge>
              )}
              {transporte.documentacao.manifestoCarga && (
                <Badge variant="outline" className="justify-start">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Manifesto de Carga
                </Badge>
              )}
              {transporte.documentacao.documentacaoAduaneira && (
                <Badge variant="outline" className="justify-start">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Documentação Aduaneira
                </Badge>
              )}
            </div>
            {transporte.documentacao.observacoesDocumentacao && (
              <p className="text-sm text-muted-foreground mt-2">
                {transporte.documentacao.observacoesDocumentacao}
              </p>
            )}
          </div>
        </>
      )}

      {transporte.observacoes && (
        <>
          <div className="border-t my-4" />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
            <p className="text-sm">{transporte.observacoes}</p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Transportes Agendados
            </CardTitle>
            <CardDescription>
              Gerencie os transportes de jangadas entre ilhas
            </CardDescription>
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {STATUS_TRANSPORTE.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {transportesFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum transporte encontrado
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jangada</TableHead>
                <TableHead>Rota</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transportesFiltrados.map((transporte) => (
                <TableRow key={transporte.id}>
                  <TableCell className="font-medium">
                    {transporte.jangadaNome}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{transporte.origemIlha}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{transporte.destinoIlha}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(transporte.dataTransporte), "dd/MM/yyyy", { locale: pt })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTipoTransporteIcon(transporte.tipoTransporte)}
                      <span className="text-sm">
                        {TIPOS_TRANSPORTE.find(t => t.value === transporte.tipoTransporte)?.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transporte.status)}
                  </TableCell>
                  <TableCell>
                    {transporte.custoTransporte ? `€${transporte.custoTransporte.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTransporte(transporte)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Transporte</DialogTitle>
                            <DialogDescription>
                              Informações completas sobre o transporte de {transporte.jangadaNome}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedTransporte && <TransporteDetalhes transporte={selectedTransporte} />}
                        </DialogContent>
                      </Dialog>

                      {transporte.status === 'agendado' && (
                        <Select
                          value={transporte.status}
                          onValueChange={(value) => handleStatusChange(transporte.id, value as 'agendado' | 'em_transito' | 'concluido' | 'cancelado')}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_TRANSPORTE.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {transporte.status === 'agendado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluirTransporte(transporte.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
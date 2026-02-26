'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Truck, Ship, Anchor, Car } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useLogistica } from '@/hooks/use-logistica';
import { useJangadas } from '@/hooks/use-jangadas';
import { ILHAS_ACORES, TIPOS_TRANSPORTE, DocumentacaoTransporte } from '@/lib/logistica-types';
import { toast } from 'sonner';

const transporteSchema = z.object({
  jangadaId: z.string().min(1, 'Selecione uma jangada'),
  origemIlha: z.string().min(1, 'Selecione a ilha de origem'),
  destinoIlha: z.string().min(1, 'Selecione a ilha de destino'),
  dataTransporte: z.date({
    message: 'Selecione a data do transporte',
  }),
  tipoTransporte: z.string().min(1, 'Selecione o tipo de transporte'),
  veiculoTransporte: z.string().optional(),
  motorista: z.string().optional(),
  custoTransporte: z.string().optional(),
  observacoes: z.string().optional(),
  // Documentação
  seguroTransporte: z.boolean().default(false),
  certificadoInspecao: z.boolean().default(false),
  autorizacaoTransito: z.boolean().default(false),
  manifestoCarga: z.boolean().default(false),
  documentacaoAduaneira: z.boolean().default(false),
  observacoesDocumentacao: z.string().optional(),
});

type TransporteForm = z.infer<typeof transporteSchema>;

interface AgendarTransporteFormProps {
  onSuccess?: () => void;
  jangadaId?: string;
}

export function AgendarTransporteForm({ onSuccess, jangadaId }: AgendarTransporteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { criarTransporte, calcularCustoTransporte } = useLogistica();
  const jangadasQuery = useJangadas();
  const jangadas = jangadasQuery.data || [];

  const form = useForm({
    resolver: zodResolver(transporteSchema),
    defaultValues: {
      jangadaId: jangadaId || '',
      origemIlha: '',
      destinoIlha: '',
      tipoTransporte: '',
      veiculoTransporte: '',
      motorista: '',
      custoTransporte: '',
      observacoes: '',
      seguroTransporte: false,
      certificadoInspecao: false,
      autorizacaoTransito: false,
      manifestoCarga: false,
      documentacaoAduaneira: false,
      observacoesDocumentacao: '',
    },
  });

  const selectedJangada = jangadas.find(j => j.id === form.watch('jangadaId'));
  const origemIlha = form.watch('origemIlha');
  const destinoIlha = form.watch('destinoIlha');
  const tipoTransporte = form.watch('tipoTransporte');

  // Calcular custo automaticamente quando origem, destino e tipo mudam
  React.useEffect(() => {
    const calcularCusto = async () => {
      if (origemIlha && destinoIlha && tipoTransporte) {
        try {
          const custo = await calcularCustoTransporte(origemIlha, destinoIlha, tipoTransporte);
          if (custo > 0) {
            form.setValue('custoTransporte', custo.toFixed(2));
          }
        } catch (error) {
          console.error('Erro ao calcular custo:', error);
        }
      }
    };

    calcularCusto();
  }, [origemIlha, destinoIlha, tipoTransporte, calcularCustoTransporte, form]);

  const onSubmit = async (data: z.infer<typeof transporteSchema>) => {
    if (data.origemIlha === data.destinoIlha) {
      toast.error('A ilha de origem deve ser diferente da ilha de destino');
      return;
    }

    setIsSubmitting(true);

    try {
      const documentacao: DocumentacaoTransporte = {
        seguroTransporte: data.seguroTransporte,
        certificadoInspecao: data.certificadoInspecao,
        autorizacaoTransito: data.autorizacaoTransito,
        manifestoCarga: data.manifestoCarga,
        documentacaoAduaneira: data.documentacaoAduaneira,
        observacoesDocumentacao: data.observacoesDocumentacao,
      };

      await criarTransporte({
        jangadaId: data.jangadaId,
        jangadaNome: selectedJangada?.nome || 'Jangada não encontrada',
        origemIlha: data.origemIlha,
        destinoIlha: data.destinoIlha,
        dataTransporte: data.dataTransporte.toISOString(),
        tipoTransporte: data.tipoTransporte as any,
        veiculoTransporte: data.veiculoTransporte,
        motorista: data.motorista,
        custoTransporte: data.custoTransporte ? parseFloat(data.custoTransporte) : undefined,
        documentacao,
        observacoes: data.observacoes,
      });

      toast.success('Transporte agendado com sucesso!');
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao agendar transporte:', error);
      toast.error('Erro ao agendar transporte. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Agendar Transporte de Jangada
        </CardTitle>
        <CardDescription>
          Agende o transporte de uma jangada entre ilhas dos Açores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção da Jangada */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jangadaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jangada *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma jangada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jangadas.map((jangada) => (
                          <SelectItem key={jangada.id} value={jangada.id}>
                            {jangada.numero} - {jangada.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoTransporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Transporte *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_TRANSPORTE.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              {getTipoTransporteIcon(tipo.value)}
                              {tipo.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ilhas de Origem e Destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origemIlha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ilha de Origem *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a ilha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ILHAS_ACORES.map((ilha) => (
                          <SelectItem key={ilha} value={ilha}>
                            {ilha}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destinoIlha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ilha de Destino *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a ilha" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ILHAS_ACORES.map((ilha) => (
                          <SelectItem key={ilha} value={ilha}>
                            {ilha}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Data e Custo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dataTransporte"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Transporte *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: pt })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custoTransporte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Estimado (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motorista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista/Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Veículo de Transporte */}
            <FormField
              control={form.control}
              name="veiculoTransporte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo/Embarcação de Transporte</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Barco Trans Açores, Ferry Atlântico..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Documentação Necessária */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documentação Necessária</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seguroTransporte"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Seguro de Transporte</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="certificadoInspecao"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Certificado de Inspeção</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autorizacaoTransito"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Autorização de Trânsito</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manifestoCarga"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Manifesto de Carga</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentacaoAduaneira"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Documentação Aduaneira</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacoesDocumentacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações da Documentação</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre documentação necessária..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observações Gerais */}
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Gerais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o transporte..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Resumo */}
            {selectedJangada && origemIlha && destinoIlha && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Resumo do Transporte</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span>Jangada:</span>
                    <Badge variant="outline">{selectedJangada.numero} - {selectedJangada.nome}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span>Rota:</span>
                    <Badge variant="outline">{origemIlha} → {destinoIlha}</Badge>
                  </div>
                  {form.watch('custoTransporte') && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Custo Estimado:</span>
                      <Badge variant="outline">€{form.watch('custoTransporte')}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Agendando...' : 'Agendar Transporte'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
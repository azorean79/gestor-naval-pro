'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateAgendamento } from '@/hooks/use-agendamentos';

const TECNICOS = [
  { id: 'julio', nome: 'Julio Correia' },
  { id: 'alex', nome: 'Alex Santos' },
];

const agendamentoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  horaInicio: z.string().min(1, 'Hora de início é obrigatória'),
  tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  urgente: z.boolean(),
});

type AgendamentoForm = z.infer<typeof agendamentoSchema>;

interface AgendarInspecaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  dragData: any;
}

export function AgendarInspecaoDialog({
  open,
  onOpenChange,
  selectedDate,
  dragData,
}: AgendarInspecaoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAgendamento = useCreateAgendamento();

  const form = useForm<AgendamentoForm>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      titulo: dragData?.jangada ? `Inspeção ${dragData.jangada.numeroSerie}` : '',
      descricao: '',
      horaInicio: '09:00',
      tecnicoId: '',
      tipo: 'inspecao',
      urgente: false,
    },
  });

  const onSubmit = async (data: AgendamentoForm) => {
    if (!selectedDate) return;

    setIsSubmitting(true);
    try {
      const [hora, minuto] = data.horaInicio.split(':');
      const dataInicio = new Date(selectedDate);
      dataInicio.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      const dataFim = new Date(dataInicio);
      dataFim.setHours(dataInicio.getHours() + 1); // 1 hour duration

      await createAgendamento.mutateAsync({
        titulo: data.titulo,
        descricao: data.descricao || null,
        dataInicio,
        dataFim,
        tipo: data.tipo,
        status: 'agendado',
        prioridade: data.urgente ? 'urgente' : 'normal',
        jangadaId: dragData?.jangada?.id,
        navioId: dragData?.jangada?.navioId,
        cilindroId: null,
        pessoaId: data.tecnicoId,
        responsavel: TECNICOS.find((t) => t.id === data.tecnicoId)?.nome || null,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Agendar Inspeção - {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tecnicoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Técnico Responsável</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um técnico" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TECNICOS.map((tecnico) => (
                        <SelectItem key={tecnico.id} value={tecnico.id}>
                          {tecnico.nome}
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
              name="horaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Início</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="inspecao">Inspeção</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="teste">Teste</SelectItem>
                      <SelectItem value="reuniao">Reunião</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgente"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Urgente</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
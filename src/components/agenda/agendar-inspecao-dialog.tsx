'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, getDay } from 'date-fns';
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
import { useCreateAgendamento, useAgendamentos } from '@/hooks/use-agendamentos';

const TECNICOS = [
  { id: 'julio', nome: 'Julio Correia' },
  { id: 'alex', nome: 'Alex Santos' },
];

const INSPECTIONS_PER_TECHNICIAN = 2;

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
  const { data: agendamentosResponse } = useAgendamentos();
  const agendamentos = Array.isArray(agendamentosResponse?.data) 
    ? agendamentosResponse.data 
    : Array.isArray(agendamentosResponse) 
      ? agendamentosResponse 
      : [];

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

    // Validar que não é fim de semana
    const dayOfWeek = getDay(selectedDate);
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      alert('Não é possível agendar inspeções aos fins de semana. Escolha de segunda a sexta-feira.');
      return;
    }

    setIsSubmitting(true);
    try {
      const [hora, minuto] = data.horaInicio.split(':');
      const dataInicio = new Date(selectedDate);
      dataInicio.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      // Validar horário de trabalho (9:00 - 17:30)
      const horaInicio = parseInt(hora) + parseInt(minuto) / 60;
      if (horaInicio < 9 || horaInicio > 17.5) {
        alert('O horário de início deve ser entre 9:00 e 17:30.');
        setIsSubmitting(false);
        return;
      }

      // Duração padrão: 3.5 horas (3 horas e 30 minutos)
      const dataFim = new Date(dataInicio);
      dataFim.setHours(dataInicio.getHours() + 3);
      dataFim.setMinutes(dataInicio.getMinutes() + 30);

      // Validar que termina antes das 17:30
      const horaFim = dataFim.getHours() + dataFim.getMinutes() / 60;
      if (horaFim > 17.5) {
        alert('O agendamento com duração de 3h30 ultrapassaria o horário de trabalho (17:30). Escolha um horário mais cedo.');
        setIsSubmitting(false);
        return;
      }

      // Verificar se o técnico já tem 2 inspeções nesse dia
      const tecnicoNome = TECNICOS.find((t) => t.id === data.tecnicoId)?.nome || '';
      const agendamentosDoDia = agendamentos.filter(
        (agendamento: any) =>
          format(new Date(agendamento.dataInicio), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );
      
      const inspecoesDoTecnico = agendamentosDoDia.filter(
        (agendamento: any) => agendamento.responsavel === tecnicoNome
      );

      if (inspecoesDoTecnico.length >= INSPECTIONS_PER_TECHNICIAN) {
        alert(`O técnico ${tecnicoNome} já tem ${INSPECTIONS_PER_TECHNICIAN} inspeções agendadas para este dia. Escolha outro técnico ou outra data.`);
        setIsSubmitting(false);
        return;
      }

      await createAgendamento.mutateAsync({
        titulo: data.titulo,
        descricao: data.descricao || null,
        dataInicio,
        dataFim,
        tipo: data.tipo,
        status: 'agendado',
        prioridade: data.urgente ? 'urgente' : 'normal',
        jangadaId: dragData?.jangada?.id || null,
        navioId: dragData?.jangada?.navioId || null,
        cilindroId: null,
        pessoaId: null,
        responsavel: TECNICOS.find((t) => t.id === data.tecnicoId)?.nome || null,
      });

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao criar agendamento: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verificar se é fim de semana
  const isWeekend = selectedDate ? (getDay(selectedDate) === 0 || getDay(selectedDate) === 6) : false;

  // Horários disponíveis (9:00 - 14:00 para permitir 3.5h de duração até 17:30)
  const horariosDisponiveis = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00'
  ];

  useEffect(() => {
    if (dragData?.jangada) {
      form.setValue('titulo', `Inspeção ${dragData.jangada.numeroSerie}`);
    }
  }, [dragData, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Agendar Inspeção - {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''}
            {isWeekend && <span className="text-red-500 text-sm ml-2">(Fim de semana)</span>}
          </DialogTitle>
        </DialogHeader>

        {isWeekend && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Atenção: Agendamentos só podem ser feitos de segunda a sexta-feira.
            </p>
          </div>
        )}

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
                  <FormLabel>Hora de Início (Duração: 3h30)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {horariosDisponiveis.map((horario) => {
                        const [h, m] = horario.split(':');
                        const fimHora = parseInt(h) + 3;
                        const fimMin = parseInt(m) + 30;
                        const horaFimAjustada = fimMin >= 60 ? fimHora + 1 : fimHora;
                        const minFimAjustado = fimMin >= 60 ? fimMin - 60 : fimMin;
                        const horaFimStr = `${horaFimAjustada.toString().padStart(2, '0')}:${minFimAjustado.toString().padStart(2, '0')}`;
                        return (
                          <SelectItem key={horario} value={horario}>
                            {horario} - {horaFimStr}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  <p className="text-xs text-gray-500 mt-1">
                    Horário disponível: 9:00 - 17:30 (Seg - Sex)
                  </p>
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
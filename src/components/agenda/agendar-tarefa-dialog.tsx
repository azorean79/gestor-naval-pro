'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCreateAgendamento } from '@/hooks/use-agendamentos'
import { useNavios } from '@/hooks/use-navios'
import { useJangadas } from '@/hooks/use-jangadas'

type AgendarTarefaFormData = {
  titulo: string
  descricao?: string
  hora_inicio: string
  duracao_minutos: number
  tipo: 'inspecao' | 'manutencao' | 'teste' | 'reuniao'
  prioridade: 'baixa' | 'normal' | 'alta' | 'urgente'
  navioId?: string
  jangadaId?: string
  responsavel?: string
}

const agendarTarefaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  hora_inicio: z.string().min(1, 'Hora de início é obrigatória'),
  duracao_minutos: z.number().min(15, 'Duração mínima é 15 minutos').max(480, 'Duração máxima é 480 minutos'),
  tipo: z.enum(['inspecao', 'manutencao', 'teste', 'reuniao']),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'urgente']),
  navioId: z.string().optional(),
  jangadaId: z.string().optional(),
  responsavel: z.string().optional(),
})

interface AgendarTarefaDialogProps {
  selectedDate: Date
  onClose: () => void
  onTaskCreated: () => void
}

export default function AgendarTarefaDialog({
  selectedDate,
  onClose,
  onTaskCreated,
}: AgendarTarefaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutateAsync: createAgendamento } = useCreateAgendamento()
  const { data: naviosData } = useNavios()
  const { data: jangadasData } = useJangadas()

  const navios = naviosData?.data || []
  const jangadas = jangadasData?.data || []

  const form = useForm<AgendarTarefaFormData>({
    resolver: zodResolver(agendarTarefaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      hora_inicio: '09:00',
      duracao_minutos: 60,
      tipo: 'inspecao',
      prioridade: 'normal',
      navioId: '',
      jangadaId: '',
      responsavel: '',
    },
  })

  async function onSubmit(values: AgendarTarefaFormData) {
    try {
      setIsSubmitting(true)

      // Parse time and create date objects
      const [hours, minutes] = values.hora_inicio.split(':').map(Number)
      const dataInicio = new Date(selectedDate)
      dataInicio.setHours(hours, minutes, 0, 0)

      const dataFim = new Date(dataInicio)
      dataFim.setMinutes(dataFim.getMinutes() + values.duracao_minutos)

      // Create agendamento
      await createAgendamento({
        titulo: values.titulo,
        descricao: values.descricao || null,
        dataInicio: dataInicio,
        dataFim: dataFim,
        tipo: values.tipo,
        status: 'agendado',
        prioridade: values.prioridade,
        navioId: values.navioId || null,
        jangadaId: values.jangadaId || null,
        cilindroId: null,
        pessoaId: null,
        responsavel: values.responsavel || null,
      })

      onTaskCreated()
    } catch (error) {
      console.error('Error creating agendamento:', error)
      alert('Erro ao agendar tarefa')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Tarefa</DialogTitle>
          <DialogDescription>
            {format(selectedDate, 'dd/MM/yyyy')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Inspeção técnica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hora de início */}
            <FormField
              control={form.control}
              name="hora_inicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora de Início *</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duração */}
            <FormField
              control={form.control}
              name="duracao_minutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos) *</FormLabel>
                  <FormControl>
                    <Input type="number" min="15" step="15" {...field} />
                  </FormControl>
                  <FormDescription>Incrementos de 15 minutos</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Tarefa *</FormLabel>
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

            {/* Prioridade */}
            <FormField
              control={form.control}
              name="prioridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Navio */}
            <FormField
              control={form.control}
              name="navioId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um navio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {navios.map((navio: any) => (
                        <SelectItem key={navio.id} value={navio.id}>
                          {navio.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Jangada */}
            <FormField
              control={form.control}
              name="jangadaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jangada</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma jangada" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {jangadas.map((jangada: any) => (
                        <SelectItem key={jangada.id} value={jangada.id}>
                          {jangada.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Responsável */}
            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do responsável" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
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
  )
}

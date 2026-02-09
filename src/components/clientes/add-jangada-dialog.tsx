'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { LifeBuoy, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useMarcasJangada } from '@/hooks/use-marcas-jangada'

const jangadaSchema = z.object({
  numeroSerie: z.string().min(1, 'Número de série é obrigatório'),
  marcaId: z.string().min(1, 'Marca é obrigatória'),
  modeloId: z.string().optional(),
  lotacaoId: z.string().optional(),
  tipoPackId: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  tipoPack: z.string().optional(),
  navioId: z.string().optional(),
  proprietarioId: z.string().optional(),
  status: z.enum(['ativo', 'manutencao', 'inativo']),
  estado: z.enum(['instalada', 'removida']).optional(),
  dataFabricacao: z.string().optional(),
  dataInspecao: z.string().optional(),
  dataProximaInspecao: z.string().optional(),
  capacidade: z.number().optional(),
  peso: z.number().optional(),
  dimensoes: z.string().optional(),
  numeroAprovacao: z.string().optional(),
})

interface AddJangadaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  onSuccess?: () => void
}

const TIPOS_JANGADA = [
  { value: 'inflável', label: 'Inflável' },
  { value: 'rígida', label: 'Rígida' },
  { value: 'semi-rígida', label: 'Semi-Rígida' },
]

const TIPOS_PACK = [
  { value: 'completo', label: 'Completo' },
  { value: 'básico', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
]

const ESTADOS_JANGADA = [
  { value: 'instalada', label: 'Instalada' },
  { value: 'removida', label: 'Removida' },
]

export function AddJangadaDialog({ open, onOpenChange, clienteId, onSuccess }: AddJangadaDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMarcaId, setSelectedMarcaId] = useState('')
  const router = useRouter()

  const { data: marcasResponse } = useMarcasJangada()
  const marcas = marcasResponse?.data || []

  const { data: modelsResponse } = useQuery({
    queryKey: ['modelos', selectedMarcaId],
    queryFn: async () => {
      if (!selectedMarcaId) return { data: [] }
      const res = await fetch(`/api/modelos-jangada?marcaId=${selectedMarcaId}`)
      if (!res.ok) throw new Error('Erro ao buscar modelos')
      return res.json()
    },
    enabled: !!selectedMarcaId && open
  })

  const { data: capacidadesResponse } = useQuery({
    queryKey: ['lotacoes'],
    queryFn: async () => {
      const res = await fetch('/api/lotacoes-jangada')
      if (!res.ok) throw new Error('Erro ao buscar capacidades')
      return res.json()
    },
    enabled: open
  })

  const { data: typesPackResponse } = useQuery({
    queryKey: ['tipos-pack'],
    queryFn: async () => {
      const res = await fetch('/api/tipos-pack')
      if (!res.ok) throw new Error('Erro ao buscar tipos de pack')
      return res.json()
    },
    enabled: open
  })

  const { data: naviosData } = useQuery({
    queryKey: ['navios', 'cliente', clienteId],
    queryFn: async () => {
      const res = await fetch(`/api/navios?clienteId=${clienteId}`)
      if (!res.ok) throw new Error('Erro ao buscar navios')
      return res.json()
    },
    enabled: !!clienteId && open
  })

  const { data: proprietariosData } = useQuery({
    queryKey: ['proprietarios'],
    queryFn: async () => {
      const res = await fetch('/api/proprietarios')
      if (!res.ok) throw new Error('Erro ao buscar proprietários')
      return res.json()
    },
    enabled: open
  })

  const modelos = modelsResponse?.data || []
  const capacidades = capacidadesResponse?.data || []
  const typesPack = typesPackResponse?.data || []
  const navios = naviosData?.data || []
  const proprietarios = proprietariosData?.data || []

  const form = useForm({
    resolver: zodResolver(jangadaSchema),
    defaultValues: {
      numeroSerie: '',
      marcaId: '',
      modeloId: '',
      lotacaoId: '',
      tipoPackId: '',
      tipo: '',
      tipoPack: '',
      navioId: '',
      proprietarioId: '',
      status: 'ativo' as const,
      estado: 'instalada' as const,
      dataFabricacao: '',
      dataInspecao: '',
      dataProximaInspecao: '',
      capacidade: undefined,
      peso: undefined,
      dimensoes: '',
      numeroAprovacao: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof jangadaSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/jangadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clienteId,
          capacidade: data.capacidade ? parseInt(data.capacidade.toString()) : undefined,
          peso: data.peso ? parseFloat(data.peso.toString()) : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar jangada')
      }

      toast.success('Jangada adicionada com sucesso!')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar jangada:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar jangada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5" />
            Adicionar Jangada
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova jangada/bote salva-vidas para este cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Dados Básicos */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Dados Básicos</h3>
              
              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: JSV-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS_JANGADA.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Marca, Modelo e Capacidade */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Especificações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marcaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedMarcaId(value)
                          form.setValue('modeloId', '')
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {marcas.map((marca: any) => (
                            <SelectItem key={marca.id} value={marca.id}>
                              {marca.nome}
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
                  name="modeloId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Nenhum option removed to fix SelectItem value error */}
                          {modelos.map((modelo: any) => (
                            <SelectItem key={modelo.id} value={modelo.id}>
                              {modelo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="lotacaoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade (Lotação)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Nenhuma option removed to fix SelectItem value error */}
                          {capacidades.map((cap: any) => (
                            <SelectItem key={cap.id} value={cap.id}>
                              {cap.capacidade} pessoas
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
                  name="tipoPackId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pack</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {typesPack.map((pack: any) => (
                            <SelectItem key={pack.id} value={pack.id}>
                              {pack.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Navio e Proprietário */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Associações</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="navioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Navio (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
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

                <FormField
                  control={form.control}
                  name="proprietarioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proprietário (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {proprietarios.map((prop: any) => (
                            <SelectItem key={prop.id} value={prop.id}>
                              {prop.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Datas e Dimensões */}
            <div className="space-y-3 border-b pb-4">
              <h3 className="font-semibold text-sm">Datas e Dimensões</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataFabricacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fabricação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ESTADOS_JANGADA.map((estado) => (
                            <SelectItem key={estado.value} value={estado.value}>
                              {estado.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInspecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Inspeção</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataProximaInspecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próxima Inspeção</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="capacidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade (pessoas)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" step="0.1" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dimensoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dimensões</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 50x30x25 cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numeroAprovacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Aprovação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: SOLAS-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Jangada
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

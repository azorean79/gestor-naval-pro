'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useCreateCilindro } from '@/hooks/use-create-cilindro'
import { useSistemasCilindro } from '@/hooks/use-sistemas-cilindro'
import { useTiposCilindro } from '@/hooks/use-tipos-cilindro'
import { useTiposValvula } from '@/hooks/use-tipos-valvula'
import { useJangadas } from '@/hooks/use-jangadas'

// Schema de validação para adicionar cilindro
const cilindroSchema = z.object({
  numeroSerie: z.string().min(1, 'Número de série é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  sistemaId: z.string().optional(),
  tipoCilindroId: z.string().optional(),
  tipoValvulaId: z.string().optional(),
  capacidade: z.number().min(0, 'Capacidade deve ser maior ou igual a 0').optional(),
  dataFabricacao: z.string().optional(),
  dataTeste: z.string().optional(),
  dataProximoTeste: z.string().optional(),
  status: z.string().optional(),
  pressaoTrabalho: z.number().min(0, 'Pressão de trabalho deve ser maior ou igual a 0').optional(),
  pressaoTeste: z.number().min(0, 'Pressão de teste deve ser maior ou igual a 0').optional(),
  jangadaId: z.string().optional(),
})

type CilindroFormData = z.infer<typeof cilindroSchema>

interface AddCilindroFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddCilindroForm({ open, onOpenChange, onSuccess }: AddCilindroFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const createMutation = useCreateCilindro()
  const { data: sistemas } = useSistemasCilindro()
  const { data: tiposCilindro } = useTiposCilindro()
  const { data: tiposValvula } = useTiposValvula()
  const { data: jangadas } = useJangadas()

  const form = useForm<CilindroFormData>({
    resolver: zodResolver(cilindroSchema),
    defaultValues: {
      numeroSerie: '',
      tipo: '',
      sistemaId: '',
      tipoCilindroId: '',
      tipoValvulaId: '',
      capacidade: undefined,
      dataFabricacao: '',
      dataTeste: '',
      dataProximoTeste: '',
      status: 'ativo',
      pressaoTrabalho: undefined,
      pressaoTeste: undefined,
      jangadaId: '',
    },
  })

  const onSubmit = async (data: CilindroFormData) => {
    setIsLoading(true)
    try {
      await createMutation.mutateAsync({
        ...data,
        dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao).toISOString() : undefined,
        dataTeste: data.dataTeste ? new Date(data.dataTeste).toISOString() : undefined,
        dataProximoTeste: data.dataProximoTeste ? new Date(data.dataProximoTeste).toISOString() : undefined,
      })

      toast.success('Cilindro adicionado com sucesso!')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao adicionar cilindro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar cilindro')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Cilindro</DialogTitle>
          <DialogDescription>
            Adicione um novo cilindro ao sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: C001-2024" {...field} />
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
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CO2">CO2</SelectItem>
                        <SelectItem value="N2">N2</SelectItem>
                        <SelectItem value="Ar Comprimido">Ar Comprimido</SelectItem>
                        <SelectItem value="Mistura">Mistura</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sistemaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sistema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sistemas?.map((sistema: any) => (
                          <SelectItem key={sistema.id} value={sistema.id}>
                            {sistema.nome}
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
                name="tipoCilindroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cilindro</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposCilindro?.map((tipo: any) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome}
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
                name="tipoValvulaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Válvula</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a válvula" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tiposValvula?.map((valvula: any) => (
                          <SelectItem key={valvula.id} value={valvula.id}>
                            {valvula.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pressaoTrabalho"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressão Trabalho (bar)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pressaoTeste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressão Teste (bar)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                name="dataTeste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Último Teste</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataProximoTeste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo Teste</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="defeituoso">Defeituoso</SelectItem>
                      <SelectItem value="expirado">Expirado</SelectItem>
                      <SelectItem value="manutencao">Em Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jangadaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jangada (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma jangada (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Nenhuma (ficará na prateleira)</SelectItem>
                      {jangadas?.map((jangada: any) => (
                        <SelectItem key={jangada.id} value={jangada.id}>
                          {jangada.numeroSerie} - {jangada.marca} {jangada.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Adicionar Cilindro
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
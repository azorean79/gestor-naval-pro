'use client'

import { useState } from 'react'
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
import { Ship, Loader2 } from 'lucide-react'

const navioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  matricula: z.string().optional(),
  bandeira: z.string().min(1, 'Bandeira é obrigatória'),
  status: z.enum(['ativo', 'manutencao', 'inativo']),
})

interface AddNavioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  onSuccess?: () => void
}

const TIPOS_NAVIO = [
  { value: 'cargueiro', label: 'Cargueiro' },
  { value: 'pesca-costeiro', label: 'Pesca Costeira' },
  { value: 'pesca-local', label: 'Pesca Local' },
  { value: 'pesca-alto-mar', label: 'Pesca Alto Mar' },
  { value: 'passageiros', label: 'Passageiros' },
  { value: 'recreativo', label: 'Recreativo' },
  { value: 'maritimo-turistica', label: 'Marítimo Turística' },
  { value: 'outro', label: 'Outro' },
]

export function AddNavioDialog({ open, onOpenChange, clienteId, onSuccess }: AddNavioDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(navioSchema),
    defaultValues: {
      nome: '',
      tipo: '',
      matricula: '',
      bandeira: 'Portugal',
      status: 'ativo' as const,
    },
  })

  const onSubmit = async (data: z.infer<typeof navioSchema>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/navios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          clienteId,
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar navio')

      toast.success('Navio adicionado com sucesso!')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar navio:', error)
      toast.error('Erro ao adicionar navio')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Adicionar Navio
          </DialogTitle>
          <DialogDescription>
            Adicione um novo navio para este cliente
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Navio *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Santa Maria" {...field} />
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
                        {TIPOS_NAVIO.map((tipo) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABC-123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bandeira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandeira *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Portugal" {...field} />
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
                Adicionar Navio
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

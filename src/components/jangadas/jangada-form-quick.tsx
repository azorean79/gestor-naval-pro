"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LifeBuoy, Save, AlertCircle } from 'lucide-react'
import { useCreateJangada } from '@/hooks/use-jangadas'
import { useNavios } from '@/hooks/use-navios'

// Schema simples
const simpleJangadaSchema = z.object({
  numeroSerie: z.string().min(1, 'Número de série obrigatório'),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  tipoPack: z.string().optional(),
  navioId: z.string().min(1, 'Navio obrigatório'),
  status: z.string().optional(),
})

type SimpleJangadaForm = z.infer<typeof simpleJangadaSchema>

interface JangadaFormQuickProps {
  onSuccess?: () => void
}

export function JangadaFormQuick({ onSuccess }: JangadaFormQuickProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createJangadaMutation = useCreateJangada()
  const { data: naviosResponse } = useNavios()
  const navios = naviosResponse?.data || []

  const form = useForm<SimpleJangadaForm>({
    resolver: zodResolver(simpleJangadaSchema),
    defaultValues: {
      numeroSerie: '',
      tipo: 'Jangada',
      tipoPack: '',
      navioId: '',
      status: 'ativo',
    },
  })

  async function onSubmit(values: SimpleJangadaForm) {
    setIsSubmitting(true)
    setError(null)

    try {
      await createJangadaMutation.mutateAsync({
        ...values,
        dataFabricacao: new Date().toISOString(),
        dataInspecao: new Date().toISOString(),
        dataProximaInspecao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)

      form.reset()
      onSuccess?.()
      router.refresh()
      router.push('/jangadas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar jangada')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-blue-600" />
            Adicionar Jangada
          </CardTitle>
          <CardDescription>
            Preencha os dados básicos da jangada
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Número de Série */}
              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 5017330300011" 
                        {...field} 
                      />
                    </FormControl>
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
                    <FormLabel>Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Jangada">Jangada</SelectItem>
                        <SelectItem value="Balsa">Balsa</SelectItem>
                        <SelectItem value="Bote">Bote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Pack */}
              <FormField
                control={form.control}
                name="tipoPack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Pack</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de pack (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="ISO 9650">ISO 9650</SelectItem>
                        <SelectItem value="SOLAS">SOLAS</SelectItem>
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
                    <FormLabel>Navio Associado *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o navio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {navios.map((navio: any) => (
                          <SelectItem key={navio.id} value={navio.id}>
                            {navio.nome} ({navio.matricula})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
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

              {/* Botão Submeter */}
              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Jangada'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

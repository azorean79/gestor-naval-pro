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
import { Ship, Save, AlertCircle } from 'lucide-react'
import { useCreateNavio } from '@/hooks/use-navios'

// Schema simples para navio
const simpleNavioSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  matricula: z.string().optional(), // Agora opcional
  bandeira: z.string().min(1, 'Bandeira obrigatória'),
  imo: z.string().optional(),
  mmsi: z.string().optional(),
  callSign: z.string().optional(),
  comprimento: z.string().optional(),
  largura: z.string().optional(),
  calado: z.string().optional(),
  status: z.string().optional(),
})

type SimpleNavioForm = z.infer<typeof simpleNavioSchema>

interface NavioFormQuickProps {
  onSuccess?: () => void
}

export function NavioFormQuick({ onSuccess }: NavioFormQuickProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const createNavioMutation = useCreateNavio()

  const form = useForm<SimpleNavioForm>({
    resolver: zodResolver(simpleNavioSchema),
    defaultValues: {
      nome: '',
      tipo: 'Navio',
      matricula: '',
      bandeira: '',
      imo: '',
      mmsi: '',
      callSign: '',
      status: 'ativo',
    },
  })

  async function onSubmit(values: SimpleNavioForm) {
    setIsSubmitting(true)
    setError(null)

    try {
      await createNavioMutation.mutateAsync({
        ...values,
        comprimento: values.comprimento ? parseFloat(values.comprimento) : undefined,
        largura: values.largura ? parseFloat(values.largura) : undefined,
        calado: values.calado ? parseFloat(values.calado) : undefined,
        dataInspecao: new Date().toISOString(),
        dataProximaInspecao: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      } as any)

      form.reset()
      onSuccess?.()
      router.refresh()
      router.push('/navios')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar navio')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="w-6 h-6 text-blue-600" />
            Adicionar Navio
          </CardTitle>
          <CardDescription>
            Preencha os dados básicos do navio
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
              {/* Nome */}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Navio *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Santa Maria Express" 
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
                        <SelectItem value="Navio">Navio</SelectItem>
                        <SelectItem value="Ferry">Ferry</SelectItem>
                        <SelectItem value="Navio de Carga">Navio de Carga</SelectItem>
                        <SelectItem value="Navio de Passageiros">Navio de Passageiros</SelectItem>
                        <SelectItem value="pesca-costeiro">Pesca Costeira</SelectItem>
                        <SelectItem value="pesca-local">Pesca Local</SelectItem>
                        <SelectItem value="pesca-alto-mar">Pesca Alto Mar</SelectItem>
                        <SelectItem value="pesca-arrasto">Pesca Arrasto</SelectItem>
                        <SelectItem value="pesca-cerco">Pesca Cerco</SelectItem>
                        <SelectItem value="recreio">Recreio</SelectItem>
                        <SelectItem value="iate">Iate</SelectItem>
                        <SelectItem value="maritimo-turistica">Marítimo Turística</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Matrícula */}
              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: PT-SME-001" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bandeira */}
              <FormField
                control={form.control}
                name="bandeira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandeira *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Portugal" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* IMO */}
              <FormField
                control={form.control}
                name="imo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMO</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Número IMO" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* MMSI */}
              <FormField
                control={form.control}
                name="mmsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MMSI</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Código MMSI" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Call Sign */}
              <FormField
                control={form.control}
                name="callSign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Sign</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Call Sign" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dimensões */}
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="comprimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprimento (m)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Ex: 120.5" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="largura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Largura (m)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Ex: 20.3" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calado (m)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="Ex: 4.2" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                  {isSubmitting ? 'Guardando...' : 'Guardar Navio'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

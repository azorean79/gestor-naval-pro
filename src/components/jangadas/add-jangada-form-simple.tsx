"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, AlertCircle, LifeBuoy } from 'lucide-react'
import { useCreateJangada } from '@/hooks/use-jangadas'
import { useNavios } from '@/hooks/use-navios'
import { useMarcasJangada, useCreateMarcaJangada } from '@/hooks/use-marcas-jangada'
import { jangadaSchema, type JangadaForm } from '@/lib/validation-schemas'
import { Navio } from '@/lib/types'

interface AddJangadaFormSimpleProps {
  onSuccess?: () => void
}

export function AddJangadaFormSimple({ onSuccess }: AddJangadaFormSimpleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const createJangadaMutation = useCreateJangada()
  const { data: naviosResponse } = useNavios()
  const navios: Navio[] = naviosResponse?.data || []

  const { data: marcasResponse } = useMarcasJangada()
  const marcas = marcasResponse?.data || []
  const createMarcaMutation = useCreateMarcaJangada()

  const form = useForm<JangadaForm>({
    resolver: zodResolver(jangadaSchema),
    defaultValues: {
      numeroSerie: '',
      marcaId: '',
      modeloId: '',
      tipo: '',
      navioId: '',
      status: 'ativo',
      cilindroNumeroSerie: '',
      cilindroTipo: '',
      cilindroSistema: '',
    },
  })

  const onSubmit = async (data: JangadaForm) => {
    setIsSubmitting(true)
    setError('')
    try {
      // Convert Date objects to ISO strings if they exist
      const submitData: any = {
        ...data,
        dataFabricacao: data.dataFabricacao instanceof Date 
          ? data.dataFabricacao.toISOString().split('T')[0]
          : data.dataFabricacao,
        dataInspecao: data.dataInspecao instanceof Date
          ? data.dataInspecao.toISOString().split('T')[0]
          : data.dataInspecao,
      }
      await createJangadaMutation.mutateAsync(submitData)
      form.reset()
      onSuccess?.()
      router.refresh()
      router.push('/jangadas')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar jangada'
      setError(errorMessage)
      console.error('Erro ao criar jangada:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-blue-600" />
            Adicionar Jangada
          </CardTitle>
          <CardDescription>
            Preencha os dados essenciais da jangada
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="w-4 h-4" />
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
                    <FormLabel className="font-semibold">Número de Série *</FormLabel>
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

              {/* Marca */}
              <FormField
                control={form.control}
                name="marcaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Marca *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a marca" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {marcas.map((marca: {id: string; nome: string}) => (
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

              {/* Navio (Opcional) */}
              <FormField
                control={form.control}
                name="navioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navio</FormLabel>
                    <Select value={field.value || ''} onValueChange={(value) => field.onChange(value || '')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um navio (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum navio</SelectItem>
                        {navios.map((navio) => (
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

              {/* Dados do Cilindro */}
              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm mb-4">Dados do Cilindro (Opcional)</h3>
                
                <FormField
                  control={form.control}
                  name="cilindroNumeroSerie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Série do Cilindro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: CYL-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cilindroTipo"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Tipo de Cilindro</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          <SelectItem value="CO2">CO2</SelectItem>
                          <SelectItem value="N2">N2</SelectItem>
                          <SelectItem value="CO2/N2">CO2/N2 (Misto)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cilindroSistema"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Sistema do Cilindro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Automático, Manual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Guardando...' : 'Criar Jangada'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

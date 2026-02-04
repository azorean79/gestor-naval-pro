'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const inspectionSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  tipo: z.string().min(1, 'Tipo de inspeção é obrigatório'),
  resultado: z.enum(['aprovado', 'reprovado', 'condicional']),
  tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
  observacoes: z.string().optional(),
  dataProximaInspecao: z.string().optional(),
})

type InspectionForm = z.infer<typeof inspectionSchema>

export default function NovaInspecaoPage() {
  const params = useParams()
  const router = useRouter()
  const jangadaId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const { data: jangada } = useQuery({
    queryKey: ['jangada', jangadaId],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${jangadaId}`)
      if (!res.ok) throw new Error('Erro ao buscar jangada')
      return res.json()
    },
  })

  const { data: tecnicos = [] } = useQuery({
    queryKey: ['tecnicos'],
    queryFn: async () => {
      const res = await fetch('/api/tecnicos')
      if (!res.ok) throw new Error('Erro ao buscar técnicos')
      return res.json()
    },
  })

  const form = useForm<InspectionForm>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      data: format(new Date(), 'yyyy-MM-dd'),
      tipo: '',
      resultado: undefined,
      tecnicoId: '',
      observacoes: '',
      dataProximaInspecao: '',
    },
  })

  const onSubmit = async (data: InspectionForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        jangadaId,
        data: new Date(data.data).toISOString(),
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao).toISOString() : null,
      }

      const response = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Erro ao registar inspeção')
      }

      setSubmitSuccess(true)
      toast.success('Inspeção registada com sucesso!')

      setTimeout(() => {
        router.push(`/jangadas/${jangadaId}`)
      }, 1500)
    } catch (error) {
      toast.error('Erro ao registar inspeção')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-12 pb-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspeção Registada!</h2>
              <p className="text-gray-600 mb-6">A inspeção foi registada com sucesso</p>
              <p className="text-sm text-gray-500">Redirecionando para os detalhes da jangada...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={() => router.push(`/jangadas/${jangadaId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Jangada
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Nova Inspeção
          </h1>
          <p className="text-gray-600">
            Registar uma nova inspeção para a jangada {jangada?.numeroSerie}
          </p>
        </div>

        {/* Jangada Info Card */}
        {jangada && (
          <Card className="mb-8 border-l-4 border-l-teal-600 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Jangada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Série</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{jangada.numeroSerie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className="mt-2" variant={jangada.status === 'ativo' ? 'default' : 'secondary'}>
                    {jangada.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Inspeção</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {jangada.dataUltimaInspecao 
                      ? format(new Date(jangada.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt })
                      : 'Nunca'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle>Dados da Inspeção</CardTitle>
            <CardDescription>Preencha os dados da inspeção a registar</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data */}
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Inspeção *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="border-gray-300"
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
                        <FormLabel>Tipo de Inspeção *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleciona o tipo de inspeção" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="anual">Inspeção Anual</SelectItem>
                            <SelectItem value="quinquenal">Inspeção Quinquenal</SelectItem>
                            <SelectItem value="acidente">Inspeção Acidental</SelectItem>
                            <SelectItem value="manutencao">Manutenção</SelectItem>
                            <SelectItem value="reparacao">Reparação</SelectItem>
                            <SelectItem value="verificacao">Verificação</SelectItem>
                            <SelectItem value="certificacao">Certificação</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resultado */}
                  <FormField
                    control={form.control}
                    name="resultado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resultado *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleciona o resultado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aprovado">✓ Aprovado</SelectItem>
                            <SelectItem value="condicional">⚠ Aprovado com Condições</SelectItem>
                            <SelectItem value="reprovado">✗ Reprovado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Técnico */}
                  <FormField
                    control={form.control}
                    name="tecnicoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Técnico Responsável *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleciona um técnico" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(tecnicos as any)?.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Próxima Inspeção */}
                  <FormField
                    control={form.control}
                    name="dataProximaInspecao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima Inspeção (opcional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="border-gray-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrever detalhes da inspeção, problemas encontrados, ações necessárias, etc."
                          className="resize-none border-gray-300 min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alert */}
                <Alert className="bg-teal-50 border-teal-200">
                  <AlertDescription className="text-teal-800">
                    <strong>Nota:</strong> Após registar esta inspeção, a data será atualizada nos detalhes da jangada.
                  </AlertDescription>
                </Alert>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/jangadas/${jangadaId}`)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A guardar...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Registar Inspeção
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

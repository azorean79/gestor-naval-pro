'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

const inspectionSchema = z.object({
  data: z.string().min(1, 'Data é obrigatória'),
  resultado: z.enum(['aprovado', 'reprovado', 'condicional']),
  tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
  
  // Inspeção Visual
  cascoIntegro: z.boolean(),
  cascoObservacoes: z.string().optional(),
  
  coloFormaCorreta: z.boolean(),
  coloObservacoes: z.string().optional(),
  
  // Equipamento Obrigatório
  kitSalvacao: z.boolean(),
  kitSalvacaoObs: z.string().optional(),
  
  mochilasSobrevivencia: z.boolean(),
  mochilasSobrevivenciaObs: z.string().optional(),
  
  remos: z.boolean(),
  remosObs: z.string().optional(),
  
  ancoraFlutuante: z.boolean(),
  ancoraFlutuanteObs: z.string().optional(),
  
  sinalizadores: z.boolean(),
  sinalizadoresObs: z.string().optional(),
  
  espelhosAdvertencia: z.boolean(),
  espelhosObservacoes: z.string().optional(),
  
  kitReparacao: z.boolean(),
  kitReparacaoObs: z.string().optional(),
  
  agua: z.boolean(),
  aguaObs: z.string().optional(),
  
  racoes: z.boolean(),
  racoesObs: z.string().optional(),
  
  kitPesca: z.boolean(),
  kitPescaObs: z.string().optional(),
  
  livroInstrucoes: z.boolean(),
  livroInstrucoesObs: z.string().optional(),
  
  // Testes de Flutuabilidade
  boiasInflavel: z.boolean(),
  boiasInflavelObs: z.string().optional(),
  
  valvulaAr: z.boolean(),
  valvulaArObs: z.string().optional(),
  
  testePressao: z.boolean(),
  testePressaoObs: z.string().optional(),
  
  // Testes Funcionais
  sistemaInflagem: z.boolean(),
  sistemaInflagemObs: z.string().optional(),
  
  valvulasAcesso: z.boolean(),
  valvulasAcessoObs: z.string().optional(),
  
  dosseCapa: z.boolean(),
  dosseCapaObs: z.string().optional(),
  
  descarraAqua: z.boolean(),
  descarraAguaObs: z.string().optional(),
  
  // Documentação
  certificadoFabricacao: z.boolean(),
  certificadoFabricacaoObs: z.string().optional(),
  
  registosAnterior: z.boolean(),
  registosAnteriorObs: z.string().optional(),
  
  marcacaoPeso: z.boolean(),
  marcacaoPesoObs: z.string().optional(),
  
  dataProximaInspecao: z.string().optional(),
  observacoesGerais: z.string().optional(),
})

type InspectionForm = z.infer<typeof inspectionSchema>

const CATEGORIAS_TESTE = [
  {
    id: 'visual',
    nome: 'Inspeção Visual',
    testes: [
      { key: 'cascoIntegro', label: 'Casco íntegro sem danos, rasgos ou perfurações', obs: 'cascoObservacoes' },
      { key: 'coloFormaCorreta', label: 'Colo em forma correcta, bem presos e sem danos', obs: 'coloObservacoes' },
    ]
  },
  {
    id: 'equipamento',
    nome: 'Equipamento Obrigatório (SOLAS)',
    testes: [
      { key: 'kitSalvacao', label: 'Kit de Salvação Completo', obs: 'kitSalvacaoObs' },
      { key: 'mochilasSobrevivencia', label: 'Mochilas de Sobrevivência (completas e com validade)', obs: 'mochilasSobrevivenciaObs' },
      { key: 'remos', label: 'Remos/Pás em bom estado', obs: 'remosObs' },
      { key: 'ancoraFlutuante', label: 'Âncora Flutuante', obs: 'ancoraFlutuanteObs' },
      { key: 'sinalizadores', label: 'Sinalizadores (foguetes, velas fumígenas)', obs: 'sinalizadoresObs' },
      { key: 'espelhosAdvertencia', label: 'Espelhos e Sinais de Advertência', obs: 'espelhosObservacoes' },
      { key: 'kitReparacao', label: 'Kit de Reparação Completo', obs: 'kitReparacaoObs' },
      { key: 'agua', label: 'Água Doce (frasco de emergência)', obs: 'aguaObs' },
      { key: 'racoes', label: 'Rações Alimentares de Emergência', obs: 'racoesObs' },
      { key: 'kitPesca', label: 'Kit de Pesca', obs: 'kitPescaObs' },
      { key: 'livroInstrucoes', label: 'Livro de Instruções e Manuais (IMO)', obs: 'livroInstrucoesObs' },
    ]
  },
  {
    id: 'flutuabilidade',
    nome: 'Testes de Flutuabilidade',
    testes: [
      { key: 'boiasInflavel', label: 'Bóias Infláveis funcionando correctamente', obs: 'boiasInflavelObs' },
      { key: 'valvulaAr', label: 'Válvulas de Ar sem fugas', obs: 'valvulaArObs' },
      { key: 'testePressao', label: 'Teste de Pressão do Sistema (PSI conforme especificado)', obs: 'testePressaoObs' },
    ]
  },
  {
    id: 'funcionais',
    nome: 'Testes Funcionais',
    testes: [
      { key: 'sistemaInflagem', label: 'Sistema de Inflagem (manual e automático)', obs: 'sistemaInflagemObs' },
      { key: 'valvulasAcesso', label: 'Válvulas de Acesso e Saída funcional', obs: 'valvulasAcessoObs' },
      { key: 'dosseCapa', label: 'Dossel/Capa (se aplicável) intacto e funcional', obs: 'dosseCapaObs' },
      { key: 'descarraAqua', label: 'Sistema de Descarga de Água funcionando', obs: 'descarraAguaObs' },
    ]
  },
  {
    id: 'documentacao',
    nome: 'Documentação (IMO)',
    testes: [
      { key: 'certificadoFabricacao', label: 'Certificado de Fabricação presente e legível', obs: 'certificadoFabricacaoObs' },
      { key: 'registosAnterior', label: 'Registos de Inspeção Anterior documentados', obs: 'registosAnteriorObs' },
      { key: 'marcacaoPeso', label: 'Marcação de Peso Máximo e Capacidade visível', obs: 'marcacaoPesoObs' },
    ]
  }
]

export default function InspecaoIMOSOLASPage() {
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
      resultado: undefined,
      tecnicoId: '',
      cascoIntegro: false,
      coloFormaCorreta: false,
      kitSalvacao: false,
      mochilasSobrevivencia: false,
      remos: false,
      ancoraFlutuante: false,
      sinalizadores: false,
      espelhosAdvertencia: false,
      kitReparacao: false,
      agua: false,
      racoes: false,
      kitPesca: false,
      livroInstrucoes: false,
      boiasInflavel: false,
      valvulaAr: false,
      testePressao: false,
      sistemaInflagem: false,
      valvulasAcesso: false,
      dosseCapa: false,
      descarraAqua: false,
      certificadoFabricacao: false,
      registosAnterior: false,
      marcacaoPeso: false,
    },
  })

  const onSubmit = async (data: InspectionForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        data: new Date(data.data).toISOString(),
        jangadaId,
        tipo: 'IMO SOLAS',
        resultado: data.resultado,
        tecnicoId: data.tecnicoId,
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao).toISOString() : null,
        observacoes: data.observacoesGerais || '',
        detalhes: JSON.stringify({
          visual: {
            cascoIntegro: data.cascoIntegro,
            cascoObservacoes: data.cascoObservacoes,
            coloFormaCorreta: data.coloFormaCorreta,
            coloObservacoes: data.coloObservacoes,
          },
          equipamento: {
            kitSalvacao: data.kitSalvacao,
            mochilasSobrevivencia: data.mochilasSobrevivencia,
            remos: data.remos,
            ancoraFlutuante: data.ancoraFlutuante,
            sinalizadores: data.sinalizadores,
            espelhosAdvertencia: data.espelhosAdvertencia,
            kitReparacao: data.kitReparacao,
            agua: data.agua,
            racoes: data.racoes,
            kitPesca: data.kitPesca,
            livroInstrucoes: data.livroInstrucoes,
          },
          flutuabilidade: {
            boiasInflavel: data.boiasInflavel,
            valvulaAr: data.valvulaAr,
            testePressao: data.testePressao,
          },
          funcionais: {
            sistemaInflagem: data.sistemaInflagem,
            valvulasAcesso: data.valvulasAcesso,
            dosseCapa: data.dosseCapa,
            descarraAqua: data.descarraAqua,
          },
          documentacao: {
            certificadoFabricacao: data.certificadoFabricacao,
            registosAnterior: data.registosAnterior,
            marcacaoPeso: data.marcacaoPeso,
          },
        }),
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
      toast.success('Inspeção IMO SOLAS registada com sucesso!')

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

  const allChecked = CATEGORIAS_TESTE.every(cat =>
    cat.testes.every(teste => form.watch(teste.key as any))
  )

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg border-t-4 border-t-green-500">
            <CardContent className="pt-12 pb-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspeção IMO SOLAS Registada!</h2>
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
      <div className="max-w-6xl mx-auto">
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
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Inspeção IMO SOLAS
              <Badge className="bg-blue-100 text-blue-900">Regulamentação Internacional</Badge>
            </h1>
            <p className="text-gray-600">
              Inspeção completa baseada nas normas SOLAS para jangadas de salvação
            </p>
          </div>
        </div>

        {/* Jangada Info */}
        {jangada && (
          <Card className="mb-8 border-l-4 border-l-teal-600 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Jangada - {jangada.numeroSerie}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Série</p>
                  <p className="text-lg font-semibold text-gray-900 font-mono">{jangada.numeroSerie}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fabricação</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {jangada.dataFabricacao ? format(new Date(jangada.dataFabricacao), 'dd/MM/yyyy', { locale: pt }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última Inspeção</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {jangada.dataUltimaInspecao ? format(new Date(jangada.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt }) : 'Nunca'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={jangada.status === 'ativo' ? 'default' : 'secondary'} className="mt-2">
                    {jangada.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Info Básica */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informação Básica da Inspeção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="data"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data da Inspeção *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                        <FormLabel>Técnico Responsável *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleciona técnico" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(tecnicos as any)?.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resultado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resultado Final *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Resultado" />
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
                </div>
              </CardContent>
            </Card>

            {/* Abas de Inspeção */}
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white border-b">
                {CATEGORIAS_TESTE.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs md:text-sm">
                    {cat.nome.split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIAS_TESTE.map(categoria => (
                <TabsContent key={categoria.id} value={categoria.id} className="mt-6">
                  <Card className="bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle>{categoria.nome}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {categoria.testes.map(teste => (
                        <div key={teste.key} className="border rounded-lg p-4 bg-gray-50">
                          <FormField
                            control={form.control}
                            name={teste.key as any}
                            render={({ field }) => (
                              <FormItem className="flex items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="mt-1"
                                  />
                                </FormControl>
                                <div className="flex-1">
                                  <FormLabel className="text-base cursor-pointer font-semibold text-gray-900">
                                    {teste.label}
                                  </FormLabel>
                                  <FormField
                                    control={form.control}
                                    name={teste.obs as any}
                                    render={({ field }) => (
                                      <FormItem className="mt-2">
                                        <FormControl>
                                          <Textarea
                                            placeholder="Observações específicas..."
                                            className="resize-none text-sm border-gray-300 min-h-20"
                                            {...field}
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Observações Gerais e Data Próxima Inspeção */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Observações Finais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="dataProximaInspecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Sugerida para Próxima Inspeção</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoesGerais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais, ações corretivas necessárias, notas importantes..."
                          className="resize-none border-gray-300 min-h-40"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Status Check */}
            <Alert className={allChecked ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}>
              <AlertTriangle className={allChecked ? 'text-green-600' : 'text-amber-600'} />
              <AlertDescription className={allChecked ? 'text-green-800' : 'text-amber-800'}>
                {allChecked 
                  ? '✓ Todos os testes foram validados!'
                  : '⚠ Completa todos os testes da inspeção IMO SOLAS'
                }
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
                    Registar Inspeção IMO SOLAS
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

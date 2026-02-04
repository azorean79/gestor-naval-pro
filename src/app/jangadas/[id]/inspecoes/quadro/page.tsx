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
  temperatura: z.string().optional(),
  
  // EXTERIOR
  cintoCobertura: z.boolean(),
  protecaoCordas: z.boolean(),
  protetorasCurtas: z.boolean(),
  protetorAncora: z.boolean(),
  coletorAgua: z.boolean(),
  manualInstrucoes: z.boolean(),
  instrucoesEmergencia: z.boolean(),
  tuboCamaraPuxador: z.boolean(),
  tuboTrapoPiso: z.boolean(),
  puxadorBancoEmergencia: z.boolean(),
  fastenerEmergencyPack: z.boolean(),
  luzInteriorBateria: z.boolean(),
  espelhoSinalizacao: z.boolean(),
  bateriaLixo: z.boolean(),
  bateria: z.boolean(),
  volvulasInflacao: z.boolean(),
  hosterValves: z.boolean(),
  valvulasAfestar: z.boolean(),
  camaraDuplaTubo: z.boolean(),
  tuboApoio: z.boolean(),
  arcoRubberBand: z.boolean(),
  
  // BOIA REDONDA CÂMARA SUPERIOR
  ofCabinaSuperior: z.boolean(),
  sacosRetencao: z.boolean(),
  cordaFlutuacao: z.boolean(),
  
  // BOIA REDONDA CÂMARA INFERIOR
  ofCabinaInferior: z.boolean(),
  sacosRetencaoInf: z.boolean(),
  entradaSituacao: z.boolean(),
  
  // LIXEIRA EXTERIOR
  lixeiraExterior: z.boolean(),
  luzExteriorBateria: z.boolean(),
  
  // RIG LIGHT
  rigLightVela: z.boolean(),
  rigLightBateria: z.boolean(),
  
  // BOZONY
  barrelBozony: z.boolean(),
  
  // ESTACAO TRACAO
  estacaoTempo: z.boolean(),
  
  // VALVULAS
  foetusValvesSissues: z.boolean(),
  
  // BALSA REDONDA SUPERIOR
  balsaSuperior: z.boolean(),
  
  // CILINDROS
  cilindroCA: z.boolean(),
  cilindroCA2: z.boolean(),
  cilindro02: z.boolean(),
  
  // SISTEMA OPERACIONAL
  sistemaOperacional: z.boolean(),
  capilacarao: z.boolean(),
  cabeçaOperacao: z.boolean(),
  tuboDisparo: z.boolean(),
  operacaoWm: z.boolean(),
  capaInflacao: z.boolean(),
  valvulaEscapeCirc: z.boolean(),
  colhaaCilindro: z.boolean(),
  ancloraFlutuante: z.boolean(),
  
  // INTERIOR
  escadaEntrada: z.boolean(),
  entradaExtra: z.boolean(),
  grinaldaInterior: z.boolean(),
  ligacaoLateral: z.boolean(),
  lintComLinha: z.boolean(),
  ductComLinha: z.boolean(),
  paxasoBragueta: z.boolean(),
  safetyKits: z.boolean(),
  sedimentoInterno: z.boolean(),
  candelaInterno: z.boolean(),
  
  // TESTES PRESSAO
  tesaPressaoComVAC: z.boolean(),
  cameraSuperiorArco: z.boolean(),
  upperTubeArco: z.boolean(),
  camaraInferior: z.boolean(),
  lowerTube: z.boolean(),
  tuboCha: z.boolean(),
  rampa: z.boolean(),
  boardingRamp: z.boolean(),
  estacaoServico: z.boolean(),
  serviceStation: z.boolean(),
  
  dataProximaInspecao: z.string().optional(),
  observacoesGerais: z.string().optional(),
})

type InspectionForm = z.infer<typeof inspectionSchema>

const CATEGORIAS_TESTE = [
  {
    id: 'exterior',
    nome: 'Jangada - Exterior',
    testes: [
      'Cinto de Cobertura',
      'Proteção de Cordas',
      'Protetoras Curtas',
      'Protetor Ancora',
      'Coletor Água',
      'Manual de Instruções',
      'Instruções Emergência',
      'Tubo Câmara Puxador',
      'Tubo Trapo Piso',
      'Puxador Banco Emergência',
      'Fastener Emergency Pack',
      'Luz Interior Bateria',
      'Espelho Sinalização',
      'Bateria Lixo',
      'Bateria',
      'Válvulas Inflação',
      'Hoster Valves',
      'Válvulas Afestar',
      'Câmara Dupla Tubo',
      'Tubo Apoio',
      'Arco Rubber Band',
    ]
  },
  {
    id: 'bioa-superior',
    nome: 'Bóia Redonda - Câmara Superior',
    testes: [
      'Of Cabina Superior',
      'Sacos Retenção',
      'Corda Flutuação',
    ]
  },
  {
    id: 'bioa-inferior',
    nome: 'Bóia Redonda - Câmara Inferior',
    testes: [
      'Of Cabina Inferior',
      'Sacos Retenção Inf.',
      'Entrada Situação',
    ]
  },
  {
    id: 'lixeira',
    nome: 'Lixeira Exterior e Bateria',
    testes: [
      'Lixeira Exterior',
      'Luz Exterior Bateria',
    ]
  },
  {
    id: 'rig-light',
    nome: 'RIG Light para Vela',
    testes: [
      'RIG Light Vela',
      'RIG Light Bateria',
    ]
  },
  {
    id: 'bozony',
    nome: 'Barrel Bozony',
    testes: [
      'Barrel Bozony',
    ]
  },
  {
    id: 'cilindros',
    nome: 'Cilindros',
    testes: [
      'Cilindro CA',
      'Cilindro CA2',
      'Cilindro O2',
    ]
  },
  {
    id: 'operacional',
    nome: 'Sistema Operacional',
    testes: [
      'Sistema Operacional',
      'Capilação',
      'Cabeça Operação',
      'Tubo Disparo',
      'Operação Wm',
      'Capa Inflação',
      'Válvula Escape Circ.',
      'Colha Cilindro',
      'Âncora Flutuante',
    ]
  },
  {
    id: 'interior',
    nome: 'Jangada - Interior',
    testes: [
      'Escada Entrada',
      'Entrada Extra',
      'Grinald Interior',
      'Ligação Lateral',
      'Lint com Linha',
      'Duct com Linha',
      'Paxaso Bragueta',
      'Safety Kits',
      'Sedimento Interno',
      'Candela Interno',
    ]
  },
  {
    id: 'pressao',
    nome: 'Saídas de Pressão - Pressure Test',
    testes: [
      'Tesa Pressão com VAC',
      'Camera Superior Arco',
      'Upper Tube Arco',
      'Câmara Inferior',
      'Lower Tube',
      'Tubo Chá',
      'Rampa',
      'Boarding Ramp',
      'Estação Serviço',
      'Service Station',
    ]
  }
]

export default function InspecaoQuadroPage() {
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
      temperatura: '',
    },
  })

  const onSubmit = async (data: InspectionForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        data: new Date(data.data).toISOString(),
        jangadaId,
        tipo: 'Quadro de Inspeção Técnica',
        resultado: data.resultado,
        tecnicoId: data.tecnicoId,
        dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao).toISOString() : null,
        observacoes: data.observacoesGerais || '',
        detalhes: JSON.stringify({
          temperatura: data.temperatura,
          testes: {
            exterior: {
              cintoCobertura: data.cintoCobertura,
              protecaoCordas: data.protecaoCordas,
              protetorasCurtas: data.protetorasCurtas,
            },
          }
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
              Quadro de Inspeção Técnica
              <Badge className="bg-blue-100 text-blue-900">Inspeção Completa</Badge>
            </h1>
            <p className="text-gray-600">
              Inspeção técnica completa baseada no quadro de inspeção oficial
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
                <CardTitle>Informação da Inspeção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    name="temperatura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperatura Ambiente (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 17" {...field} />
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
            <Tabs defaultValue="exterior" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-white border-b overflow-x-auto">
                {CATEGORIAS_TESTE.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id} className="text-xs md:text-sm whitespace-nowrap">
                    {cat.nome.split(' - ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {CATEGORIAS_TESTE.map(categoria => (
                <TabsContent key={categoria.id} value={categoria.id} className="mt-6">
                  <Card className="bg-white shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">{categoria.nome}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoria.testes.map(teste => {
                          const fieldKey = teste
                            .toLowerCase()
                            .replace(/ç/g, 'c')
                            .replace(/á/g, 'a')
                            .replace(/é/g, 'e')
                            .replace(/í/g, 'i')
                            .replace(/ó/g, 'o')
                            .replace(/ú/g, 'u')
                            .replace(/â/g, 'a')
                            .replace(/ê/g, 'e')
                            .replace(/ã/g, 'a')
                            .replace(/õ/g, 'o')
                            .replace(/\s+/g, '')
                            .replace(/[^a-z0-9]/g, '')

                          return (
                            <div key={teste} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50 hover:bg-blue-50 transition">
                              <Checkbox 
                                className="w-5 h-5"
                              />
                              <label className="text-sm font-medium text-gray-900 cursor-pointer flex-1">
                                {teste}
                              </label>
                              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                <span className="text-xs font-bold text-green-700">✓</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Observações Finais */}
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
      </div>
    </div>
  )
}

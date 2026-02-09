'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { MonthYearPicker } from '@/components/ui/month-year-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useJangada, useUpdateJangada } from '@/hooks/use-jangadas'
import { useClientes } from '@/hooks/use-clientes'
import { useNavios } from '@/hooks/use-navios'
import { useProprietarios } from '@/hooks/use-proprietarios'
import { useCreateAgendamento } from '@/hooks/use-agendamentos'
import { useAutoSaveJangada } from '@/hooks/use-autosave-jangada'
import { AutoSaveStatus } from '@/components/ui/autosave-status'
import { jangadaSchema, type JangadaForm } from '@/lib/validation-schemas'
import { Cliente, Navio } from '@/lib/types'
import { MARCAS_JANGADA, MODELOS_JANGADA, TIPOS_PACK, COMPONENTES_POR_PACK } from '@/lib/jangada-options'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ArrowLeft, Save, Edit, Lightbulb, Sparkles, Package } from 'lucide-react'
import { ValidationIndicator } from '@/components/ui/validation-indicator'
import { useRealTimeValidation } from '@/hooks/use-real-time-validation'
import { useAutoFillSuggestions } from '@/hooks/use-auto-fill'

interface ComponentesJangadaSectionProps {
  jangadaId: string
  jangada: any
}

function ComponentesJangadaSection({ jangadaId, jangada }: ComponentesJangadaSectionProps) {
  const { data: componentesData, isLoading: componentesLoading } = useQuery({
    queryKey: ['jangada-componentes', jangadaId],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${jangadaId}/componentes`)
      if (!res.ok) throw new Error('Erro ao buscar componentes')
      return res.json()
    },
    enabled: !!jangadaId
  })

  const componentes = componentesData?.data || []

  if (componentesLoading) {
    return <div className="text-center py-4">Carregando componentes...</div>
  }

  return (
    <div className="space-y-4">
      {componentes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum componente definido para esta jangada</p>
          <p className="text-sm">Configure o tipo e pack da jangada para ver os componentes necessários</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {componentes.map((componente: any, index: number) => (
            <ComponenteCard key={index} componente={componente} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ComponenteCardProps {
  componente: {
    nome: string
    quantidadeNecessaria: number
    stockItems?: Array<{
      id: string
      nome: string
      quantidade: number
      refOrey?: string
      refFabricante?: string
      lote?: string
      dataValidade?: string
      fornecedor?: string
      localizacao?: string
    }>
  }
}

function ComponenteCard({ componente }: ComponenteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium">{componente.nome}</h3>
              <p className="text-sm text-muted-foreground">
                Quantidade necessária: {componente.quantidadeNecessaria}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Ocultar' : 'Ver Stock'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && componente.stockItems && componente.stockItems.length > 0 && (
        <CardContent>
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Itens em Stock Disponíveis:</h4>
            <div className="grid gap-2">
              {componente.stockItems.map((item) => (
                <StockItemCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </CardContent>
      )}

      {isExpanded && (!componente.stockItems || componente.stockItems.length === 0) && (
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum item em stock encontrado</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

interface StockItemCardProps {
  item: {
    id: string
    nome: string
    quantidade: number
    refOrey?: string
    refFabricante?: string
    lote?: string
    dataValidade?: string
    fornecedor?: string
    localizacao?: string
  }
}

function StockItemCard({ item }: StockItemCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false)

  return (
    <>
      <Card className="border border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Quantidade:</span>
                <p className="text-muted-foreground">{item.quantidade} unidades</p>
              </div>
              {item.refOrey && (
                <div>
                  <span className="font-medium">Ref. OREY:</span>
                  <p className="text-muted-foreground">{item.refOrey}</p>
                </div>
              )}
              {item.lote && (
                <div>
                  <span className="font-medium">Lote:</span>
                  <p className="text-muted-foreground">{item.lote}</p>
                </div>
              )}
              {item.dataValidade && (
                <div>
                  <span className="font-medium">Validade:</span>
                  <p className="text-muted-foreground">
                    {format(new Date(item.dataValidade), 'dd/MM/yyyy', { locale: pt })}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="ml-4"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>

          {(item.refFabricante || item.fornecedor || item.localizacao) && (
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {item.refFabricante && (
                <div>
                  <span className="font-medium">Ref. Fabricante:</span>
                  <p className="text-muted-foreground">{item.refFabricante}</p>
                </div>
              )}
              {item.fornecedor && (
                <div>
                  <span className="font-medium">Fornecedor:</span>
                  <p className="text-muted-foreground">{item.fornecedor}</p>
                </div>
              )}
              {item.localizacao && (
                <div>
                  <span className="font-medium">Localização:</span>
                  <p className="text-muted-foreground">{item.localizacao}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditDialog && (
        <EditStockItemDialog
          item={item}
          onClose={() => setShowEditDialog(false)}
          onSave={() => {
            setShowEditDialog(false)
            // Refetch data
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

interface EditStockItemDialogProps {
  item: any
  onClose: () => void
  onSave: () => void
}

function EditStockItemDialog({ item, onClose, onSave }: EditStockItemDialogProps) {
  const [formData, setFormData] = useState({
    refOrey: item.refOrey || '',
    refFabricante: item.refFabricante || '',
    lote: item.lote || '',
    dataValidade: item.dataValidade ? format(new Date(item.dataValidade), 'yyyy-MM-dd') : '',
    fornecedor: item.fornecedor || '',
    localizacao: item.localizacao || '',
    quantidade: item.quantidade || 0
  })

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/stock/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dataValidade: formData.dataValidade ? new Date(formData.dataValidade).toISOString() : null
        })
      })

      if (res.ok) {
        onSave()
      } else {
        alert('Erro ao salvar alterações')
      }
    } catch (error) {
      alert('Erro ao salvar alterações')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Editar Item do Stock</CardTitle>
          <CardDescription>{item.nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ref. OREY</label>
              <Input
                value={formData.refOrey}
                onChange={(e) => setFormData({...formData, refOrey: e.target.value})}
                placeholder="Referência OREY"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Ref. Fabricante</label>
              <Input
                value={formData.refFabricante}
                onChange={(e) => setFormData({...formData, refFabricante: e.target.value})}
                placeholder="Referência do fabricante"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Lote</label>
              <Input
                value={formData.lote}
                onChange={(e) => setFormData({...formData, lote: e.target.value})}
                placeholder="Número do lote"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Data de Validade</label>
              <Input
                type="date"
                value={formData.dataValidade}
                onChange={(e) => setFormData({...formData, dataValidade: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Fornecedor</label>
              <Input
                value={formData.fornecedor}
                onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                placeholder="Nome do fornecedor"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Localização</label>
              <Input
                value={formData.localizacao}
                onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                placeholder="Localização no armazém"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value) || 0})}
                placeholder="Quantidade disponível"
              />
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default function JangadaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: jangadaResponse, isLoading } = useJangada(id)
  const jangada = jangadaResponse?.data
  const createAgendamentoMutation = useCreateAgendamento()
  const { data: clientesResponse } = useClientes()
  const { data: naviosResponse } = useNavios()
  const { data: proprietariosResponse } = useProprietarios()
  const clientes = clientesResponse?.data || []
  const navios = naviosResponse?.data || []
  const proprietarios = proprietariosResponse?.data || []

  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Watch form values for auto-fill and validation
  const watchedMarcaId = form.watch('marcaId')
  const watchedModeloId = form.watch('modeloId')
  const watchedNumeroSerie = form.watch('numeroSerie')
  const watchedTipo = form.watch('tipo')
  const watchedNavioId = form.watch('navioId')

  // Auto-fill suggestions based on marca and modelo
  const autoFillSuggestions = useAutoFillSuggestions('', '')

  // Real-time validation fields
  const validationFields = useMemo(() => [
    {
      name: 'numeroSerie',
      value: watchedNumeroSerie,
      rules: [
        { type: 'required' as const, message: 'Número de série é obrigatório' },
        { type: 'min' as const, value: 3, message: 'Número de série deve ter pelo menos 3 caracteres' }
      ]
    },
    {
      name: 'marcaId',
      value: watchedMarcaId,
      rules: [
        { type: 'required' as const, message: 'Marca é obrigatória' }
      ]
    },
    {
      name: 'modeloId',
      value: watchedModeloId,
      rules: [
        { type: 'required' as const, message: 'Modelo é obrigatório' }
      ]
    },
    {
      name: 'tipo',
      value: watchedTipo,
      rules: [
        { type: 'required' as const, message: 'Tipo é obrigatório' }
      ]
    },
    {
      name: 'navioId',
      value: watchedNavioId,
      rules: [
        { type: 'required' as const, message: 'Navio é obrigatório' }
      ]
    }
  ], [watchedNumeroSerie, watchedMarcaId, watchedModeloId, watchedTipo, watchedNavioId])

  const { validationResults, isFormValid } = useRealTimeValidation(validationFields)
  const safeValidationResults = validationResults || {}

  // Load jangada data when available
  useEffect(() => {
    if (jangada) {
      form.reset({
        numeroSerie: jangada.numeroSerie || '',
        marcaId: jangada.marcaId || '',
        modeloId: jangada.modeloId || '',
        tipo: jangada.tipo || '',
        navioId: jangada.navioId || '',
        status: jangada.status || 'ativo',
        dataFabricacao: jangada.dataFabricacao ? new Date(jangada.dataFabricacao).toISOString().split('T')[0] : '',
        dataInspecao: jangada.dataInspecao ? new Date(jangada.dataInspecao).toISOString().split('T')[0] : '',
        dataProximaInspecao: jangada.dataProximaInspecao ? new Date(jangada.dataProximaInspecao).toISOString().split('T')[0] : '',
        capacidade: jangada.capacidade || undefined,
        peso: jangada.peso || undefined,
        dimensoes: jangada.dimensoes || '',
        numeroAprovacao: jangada.numeroAprovacao || '',
        cilindroNumeroSerie: jangada.cilindroNumeroSerie || '',
        cilindroTipo: jangada.cilindroTipo || '',
        cilindroSistema: jangada.cilindroSistema || '',
      })
    }
  }, [jangada, form])

  const handleAgendarInspecao = async (dataInspecao: string) => {
    if (!jangada) return

    try {
      const dataInicio = new Date(dataInspecao)
      const dataFim = new Date(dataInicio)
      dataFim.setHours(dataInicio.getHours() + 1) // 1 hora de duração

      await createAgendamentoMutation.mutateAsync({
        titulo: `Inspeção ${jangada.numeroSerie}`,
        descricao: `Inspeção programada da jangada ${jangada.numeroSerie}`,
        dataInicio,
        dataFim,
        tipo: 'inspecao',
        status: 'agendado',
        prioridade: 'normal',
        jangadaId: jangada.id,
        navioId: jangada.navioId,
        cilindroId: null,
        pessoaId: null, // será atribuído na agenda
        responsavel: null,
      })

      alert('Inspeção agendada com sucesso!')
    } catch (error) {
      console.error('Erro ao agendar inspeção:', error)
      alert('Erro ao agendar inspeção. Tente novamente.')
    }
  }

  const getComponentesPorPack = (tipoPack?: string) => {
    if (!tipoPack) return []
    const pack = COMPONENTES_POR_PACK[tipoPack]
    if (!pack) return []
    return pack
  }

  const getComponenteInfo = (tipoPack: string, nomeComponente: string) => {
    if (COMPONENTES_POR_PACK[tipoPack]) {
      return COMPONENTES_POR_PACK[tipoPack].find(comp => comp.nome === nomeComponente)
    }
    return null
  }

  const formatEstado = (estado?: string) => {
    if (!estado) return 'Instalada'
    
    const estados: Record<string, string> = {
      'instalada': 'Instalada',
      'inoperacional': 'Inoperacional',
      'aguarda_instrucoes': 'Aguarda Instruções',
      'a_ser_enviada_estacao': 'A Ser Enviada para Estação',
      'aguarda_inspecao': 'Aguarda Inspeção',
      'a_ser_inspecionada': 'A Ser Inspecionada',
      'aguarda_cilindro': 'Aguarda Cilindro',
      'aguarda_entrega': 'Aguarda Entrega',
      'enviada': 'Enviada'
    }
    
    return estados[estado] || estado
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando jangada...</div>
      </div>
    )
  }

  if (!jangada) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Jangada não encontrada</div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* AutoSave Status Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-b-2 border-green-200 dark:border-green-800 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">Modo de Edição</p>
              <p className="text-sm text-green-700 dark:text-green-300">Edição da jangada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content com margem superior para a barra de autosave */}
      <div className="w-full max-w-6xl mx-auto space-y-4 pt-20 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Jangada {jangada.numeroSerie}</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Chamada para API/rota que gera a ficha DGRM para esta jangada
                    await fetch(`/api/jangadas/${jangada.id}/gerar-ficha-dgrm`, { method: 'POST' })
                    alert('Ficha DGRM gerada (ver pasta DGRM).');
                  }}
                >
                  Gerar Ficha DGRM
                </Button>
              </div>
              <p className="text-muted-foreground">
                {jangada.marca} {jangada.modelo} - {jangada.tipo}
              </p>
            </div>
          </div>
        </div>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Editar Jangada
                {autoFillSuggestions && (
                  <Badge variant="secondary" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-preenchimento ativo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                As alterações são salvas automaticamente
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ValidationIndicator result={safeValidationResults.numeroSerie} />
              <ValidationIndicator result={safeValidationResults.marca} />
              <ValidationIndicator result={safeValidationResults.modelo} />
              <ValidationIndicator result={safeValidationResults.tipo} />
            </div>
          </div>
        </CardHeader>

        {autoFillSuggestions && (
          <CardContent className="border-b bg-blue-50/50">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Sugestões baseadas no modelo selecionado:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {autoFillSuggestions.sistemaInflacao && (
                      <div><strong>Sistema de Inflação:</strong> {autoFillSuggestions.sistemaInflacao}</div>
                    )}
                    {autoFillSuggestions.cilindroCapacidade && (
                      <div><strong>Capacidade do Cilindro:</strong> {autoFillSuggestions.cilindroCapacidade}L</div>
                    )}
                    {autoFillSuggestions.cilindroValidade && (
                      <div><strong>Validade do Cilindro:</strong> {autoFillSuggestions.cilindroValidade}</div>
                    )}
                  </div>
                  {autoFillSuggestions.recomendacoes && autoFillSuggestions.recomendacoes.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Recomendações:</p>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {autoFillSuggestions.recomendacoes.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <CardContent>
          <Form {...form}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numeroSerie"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Número de Série *
                          {safeValidationResults.numeroSerie && <ValidationIndicator result={safeValidationResults.numeroSerie} />}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Número de série único" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marcaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Marca
                          {safeValidationResults.marcaId && <ValidationIndicator result={safeValidationResults.marcaId} />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MARCAS_JANGADA.map((marca) => (
                              <SelectItem key={marca} value={marca}>
                                {marca}
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
                        <FormLabel className="flex items-center gap-2">
                          Modelo
                          {safeValidationResults.modeloId && <ValidationIndicator result={safeValidationResults.modeloId} />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o modelo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MODELOS_JANGADA.map((modelo) => (
                              <SelectItem key={modelo} value={modelo}>
                                {modelo}
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
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Tipo *
                          {safeValidationResults.tipo && <ValidationIndicator result={safeValidationResults.tipo} />}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="jangada-rigida">Jangada Rígida</SelectItem>
                            <SelectItem value="jangada-inflavel">Jangada Inflável</SelectItem>
                            <SelectItem value="bote-salvamento">Bote de Salvamento</SelectItem>
                            <SelectItem value="bote-resgate">Bote de Resgate</SelectItem>
                            <SelectItem value="TO">TO (Throw Over)</SelectItem>
                            <SelectItem value="DL">DL (Davit Launch)</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="navioId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Navio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um navio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum navio</SelectItem>
                            {navios.map((navio: Navio) => (
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
                </div>

                {/* Dados do Cilindro */}
                <div className="border-t pt-4 mt-4 space-y-4">
                  <h3 className="font-semibold">Dados do Cilindro</h3>
                  
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
                      <FormItem>
                        <FormLabel>Tipo de Cilindro</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                      <FormItem>
                        <FormLabel>Sistema do Cilindro</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Automático, Manual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">
                    Guardar Alterações
                  </Button>
                </div>
              </form>
            </Form>
        </CardContent>
      </Card>

      {/* Seção de Materiais e Componentes */}
      <Card className="w-full mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Materiais e Componentes
          </CardTitle>
          <CardDescription>
            Componentes necessários para esta jangada com informações detalhadas do stock
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComponentesJangadaSection jangadaId={id} jangada={jangada} />
        </CardContent>
      </Card>
    </div>
    </div>
  )
}

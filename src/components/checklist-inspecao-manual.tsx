'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Save,
  Wrench,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface ChecklistInspecaoProps {
  inspecaoId: string
  jangadaId?: string
  marcaId?: string
  modeloId?: string
  lotacaoId?: string
  readOnly?: boolean
}

interface ChecklistItem {
  id: string
  nome: string
  descricao: string
  categoria: string
  frequencia: string
  ferramentaNecessaria: string
  criterioAprovacao: string
  referenciaManual: string
}

interface VerificacaoItem {
  checklistItemId: string
  verificado: boolean
  aprovado: boolean | null
  valor: string
  observacoes: string
}

export function ChecklistInspecaoManual({ 
  inspecaoId, 
  jangadaId,
  marcaId,
  modeloId,
  lotacaoId,
  readOnly = false 
}: ChecklistInspecaoProps) {
  const queryClient = useQueryClient()
  const [verificacoes, setVerificacoes] = useState<Record<string, VerificacaoItem>>({})

  // Buscar checklist items
  const { data: checklistData, isLoading: loadingChecklist } = useQuery({
    queryKey: ['checklist-items', marcaId],
    queryFn: async () => {
      const params = new URLSearchParams({ ativo: 'true' })
      if (marcaId) params.append('marcaId', marcaId)
      
      const res = await fetch(`/api/checklist-inspecao?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar checklist')
      return res.json()
    },
    enabled: !!marcaId
  })

  // Buscar verificações existentes
  const { data: verificacoesData, isLoading: loadingVerificacoes } = useQuery({
    queryKey: ['verificacoes-checklist', inspecaoId],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes/${inspecaoId}/checklist`)
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: !!inspecaoId
  })

  // Salvar verificações
  const salvarMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(verificacoes).map(([, data]) => data)

      const res = await fetch(`/api/inspecoes/${inspecaoId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })

      if (!res.ok) throw new Error('Erro ao salvar checklist')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Checklist salvo com sucesso')
      queryClient.invalidateQueries({ queryKey: ['verificacoes-checklist', inspecaoId] })
    },
    onError: () => {
      toast.error('Erro ao salvar checklist')
    }
  })

  const items: ChecklistItem[] = checklistData?.data || []
  const categorias = Array.from(new Set(items.map(i => i.categoria)))

  const handleVerificacaoChange = (
    itemId: string, 
    field: keyof VerificacaoItem, 
    value: any
  ) => {
    setVerificacoes(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {
          checklistItemId: itemId,
          verificado: false,
          aprovado: null,
          valor: '',
          observacoes: ''
        }),
        [field]: value
      }
    }))
  }

  const getVerificacao = (itemId: string): VerificacaoItem => {
    return verificacoes[itemId] || {
      checklistItemId: itemId,
      verificado: false,
      aprovado: null,
      valor: '',
      observacoes: ''
    }
  }

  const getTotalVerificado = (categoria: string) => {
    const catItems = items.filter(i => i.categoria === categoria)
    return catItems.filter(i => getVerificacao(i.id).verificado).length
  }

  if (loadingChecklist || loadingVerificacoes) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando checklist...</p>
        </CardContent>
      </Card>
    )
  }

  if (items.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Nenhum item de checklist disponível. Configure os itens de checklist para esta marca/modelo.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Checklist de Inspeção (Manual Técnico)
              </CardTitle>
              <CardDescription className="mt-2">
                {items.length} items derivados do manual de serviço
              </CardDescription>
            </div>
            {!readOnly && (
              <Button 
                onClick={() => salvarMutation.mutate()}
                disabled={salvarMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {salvarMutation.isPending ? 'Salvando...' : 'Salvar Checklist'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => {
              const catItems = items.filter(i => i.categoria === cat)
              const verificados = getTotalVerificado(cat)
              const progresso = (verificados / catItems.length) * 100
              
              return (
                <div key={cat} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-sm font-medium">{cat}</span>
                  <Badge variant={progresso === 100 ? 'default' : 'secondary'}>
                    {verificados}/{catItems.length}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Items by Category */}
      {categorias.map(categoria => {
        const catItems = items.filter(i => i.categoria === categoria)
        return (
          <Card key={categoria}>
            <CardHeader>
              <CardTitle className="text-lg">{categoria}</CardTitle>
              <CardDescription>
                {getTotalVerificado(categoria)}/{catItems.length} items verificados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {catItems.map(item => {
                const verificacao = getVerificacao(item.id)
                return (
                  <div 
                    key={item.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Checkbox
                            checked={verificacao.verificado}
                            onCheckedChange={(checked) => 
                              handleVerificacaoChange(item.id, 'verificado', checked)
                            }
                            disabled={readOnly}
                          />
                          <h4 className="font-semibold">{item.nome}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground ml-7">
                          {item.descricao}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {item.frequencia}
                      </Badge>
                    </div>

                    {/* Details */}
                    {verificacao.verificado && (
                      <div className="ml-7 space-y-3 bg-muted/50 rounded-lg p-3">
                        {/* Aprovado/Reprovado */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Resultado:</span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={verificacao.aprovado === true ? 'default' : 'outline'}
                              onClick={() => handleVerificacaoChange(item.id, 'aprovado', true)}
                              disabled={readOnly}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Aprovado
                            </Button>
                            <Button
                              size="sm"
                              variant={verificacao.aprovado === false ? 'destructive' : 'outline'}
                              onClick={() => handleVerificacaoChange(item.id, 'aprovado', false)}
                              disabled={readOnly}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reprovado
                            </Button>
                          </div>
                        </div>

                        {/* Valor medido */}
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Valor Medido/Verificado</label>
                          <Input
                            placeholder="Ex: 28 Nm, 2.8 psi, OK, etc"
                            value={verificacao.valor}
                            onChange={(e) => handleVerificacaoChange(item.id, 'valor', e.target.value)}
                            disabled={readOnly}
                          />
                        </div>

                        {/* Observações */}
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Observações</label>
                          <Textarea
                            placeholder="Notas adicionais sobre esta verificação..."
                            value={verificacao.observacoes}
                            onChange={(e) => handleVerificacaoChange(item.id, 'observacoes', e.target.value)}
                            disabled={readOnly}
                            rows={2}
                          />
                        </div>

                        {/* Technical Info */}
                        <div className="grid gap-2 text-xs bg-background rounded border p-3">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <strong className="text-muted-foreground">Ferramenta:</strong>
                              <div className="flex items-center gap-1 mt-1">
                                <Wrench className="h-3 w-3" />
                                {item.ferramentaNecessaria}
                              </div>
                            </div>
                            <div>
                              <strong className="text-muted-foreground">Critério Aprovação:</strong>
                              <div className="mt-1">{item.criterioAprovacao}</div>
                            </div>
                          </div>
                          {item.referenciaManual && (
                            <div className="pt-2 border-t">
                              <strong className="text-muted-foreground">Referência:</strong>
                              <div className="mt-1">{item.referenciaManual}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

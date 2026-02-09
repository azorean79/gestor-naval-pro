'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle2, Package, DollarSign, Zap, RefreshCw } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { InspectionObraDialog } from '@/components/inspecoes/inspection-obra-dialog'

interface ComponenteNecessario {
  nome: string
  categoria: string
  necessario: number
  disponivel: number
  emAlerta: boolean
  faltam: number
  precoUnitario: number
  custoTotal: number
}

interface JangadaInterligada {
  id: string
  numeroSerie: string
  navio: string
  cliente: string
  marca: string
  modelo: string
  dataProximaInspecao: Date
  diasRestantes: number
  status: 'expirada' | 'urgente' | 'proximo' | 'pendente'
  tipoInspecao: string
  componentesNecessarios: ComponenteNecessario[]
  custoEstimado: number
  componentesCriticos: number
  cilindrosParaTeste: number
  ultimaInspecao: Date | null
}

interface Resumo {
  totalJangadas: number
  expiradas: number
  urgentes: number
  proximas: number
  custoTotalEstimado: number
  componentesCriticosTotal: number
  stockAlertaTotal: number
}

export default function InterligacaoPage() {
  const [dados, setDados] = useState<JangadaInterligada[]>([])
  const [resumo, setResumo] = useState<Resumo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('todas')
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [inspectionObraDialogOpen, setInspectionObraDialogOpen] = useState(false)
  const [selectedJangada, setSelectedJangada] = useState<{ id: string; numeroSerie: string } | null>(null)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch(`/api/dashboard/interligacao-completa?filtro=${filtro}`)
        const json = await res.json()
        setDados(json.data)
        setResumo(json.resumo)
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setIsLoading(false)
      }
    }
    carregar()
  }, [filtro])

  const toggleExpandir = (id: string) => {
    const novo = new Set(expandidos)
    if (novo.has(id)) novo.delete(id)
    else novo.add(id)
    setExpandidos(novo)
  }

  const realizarInspecao = (jangadaId: string, numeroSerie: string) => {
    setSelectedJangada({ id: jangadaId, numeroSerie })
    setInspectionObraDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expirada': return 'bg-red-100 text-red-800'
      case 'urgente': return 'bg-orange-100 text-orange-800'
      case 'proximo': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expirada': return '🔴'
      case 'urgente': return '🟠'
      case 'proximo': return '🟡'
      default: return '🟢'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔗 Interligação: Inspeções + Stock + FO102600001
          </h1>
          <p className="text-gray-600">
            Sistema inteligente que conecta inspeções próximas com stock necessário e custos estimados
          </p>
        </div>

        {/* KPIs */}
        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expiradas</p>
                    <p className="text-3xl font-bold text-red-600">{resumo.expiradas}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Urgentes</p>
                    <p className="text-3xl font-bold text-orange-600">{resumo.urgentes}</p>
                  </div>
                  <Zap className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Custo Total</p>
                    <p className="text-3xl font-bold text-purple-600">
                      €{resumo.custoTotalEstimado.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Stock Alerta</p>
                    <p className="text-3xl font-bold text-blue-600">{resumo.componentesCriticosTotal}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-8">
          <Tabs value={filtro} onValueChange={setFiltro}>
            <TabsList className="bg-white border">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="criticas">Críticas</TabsTrigger>
              <TabsTrigger value="stock-alerta">Stock Alerta</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de Jangadas */}
        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : dados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Nenhuma jangada encontrada</div>
        ) : (
          <div className="space-y-4">
            {dados.map(jangada => (
              <Card key={jangada.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition">
                <CardHeader 
                  className="cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100"
                  onClick={() => toggleExpandir(jangada.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getStatusIcon(jangada.status)}</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{jangada.navio}</h3>
                          <p className="text-sm text-gray-600 font-mono">{jangada.numeroSerie}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusColor(jangada.status)}>
                          {jangada.diasRestantes < 0 
                            ? `${Math.abs(jangada.diasRestantes)} dias atrás`
                            : `${jangada.diasRestantes} dias`}
                        </Badge>
                        <Badge variant="outline">{jangada.cliente}</Badge>
                        <Badge variant="secondary">{jangada.marca} {jangada.modelo}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">€{jangada.custoEstimado.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">custo estimado</p>
                    </div>
                  </div>
                </CardHeader>

                {expandidos.has(jangada.id) && (
                  <CardContent className="pt-6 space-y-6">
                    {/* Alertas */}
                    {jangada.componentesCriticos > 0 && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          ⚠️ {jangada.componentesCriticos} componente(s) em situação crítica de stock
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Componentes Necessários */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">Componentes Necessários (FO102600001)</h4>
                      <div className="space-y-2">
                        {jangada.componentesNecessarios.map((comp, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg border-l-4 ${
                              comp.emAlerta 
                                ? 'border-l-red-500 bg-red-50'
                                : 'border-l-green-500 bg-green-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{comp.nome}</p>
                                <p className="text-sm text-gray-600">
                                  Necessário: {comp.necessario} | Disponível: {comp.disponivel}
                                  {comp.emAlerta && <span className="text-red-600 font-bold"> (faltam {comp.faltam})</span>}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-purple-600">€{comp.custoTotal.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">€{comp.precoUnitario.toFixed(2)}/un</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cilindros */}
                    {jangada.cilindrosParaTeste > 0 && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Zap className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          💨 {jangada.cilindrosParaTeste} cilindro(s) para teste nesta inspeção
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Ações */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => realizarInspecao(jangada.id, jangada.numeroSerie)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Realizar Inspeção
                      </Button>
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Dialog de Obra */}
        {selectedJangada && (
          <InspectionObraDialog
            open={inspectionObraDialogOpen}
            onOpenChange={setInspectionObraDialogOpen}
            jangadaId={selectedJangada.id}
            numeroSerie={selectedJangada.numeroSerie}
          />
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Package, AlertTriangle, CheckCircle2, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ComponenteItem {
  nome: string
  quantidade: number
  status: 'ok' | 'atencao' | 'critico'
}

interface InspecaoStock {
  id: string
  numeroSerie: string
  navio: string
  cliente: string
  diasRestantes: number
  componentes: string[]
  status: string
}

export default function ControloStockPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState('criticos')

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch('/api/dashboard/inspecoes-com-stock')
        const data = await res.json()
        setInspecoes(data.data || [])
      } catch (error) {
        console.error('Erro:', error)
      } finally {
        setIsLoading(false)
      }
    }
    carregar()
  }, [])

  // Agrupar componentes por necessidade
  const todoComponentes = inspecoes.flatMap(i => 
    i.componentes.map(comp => ({
      componente: comp,
      jangada: i.numeroSerie,
      navio: i.navio,
      cliente: i.cliente,
      status: i.diasRestantes < 0 ? 'critico' : i.diasRestantes < 7 ? 'atencao' : 'ok'
    }))
  )

  const criticos = todoComponentes.filter(c => c.status === 'critico')
  const atencao = todoComponentes.filter(c => c.status === 'atencao')
  const ok = todoComponentes.filter(c => c.status === 'ok')

  const componentePorNome = (items: typeof todoComponentes) => {
    const agrupado: { [key: string]: typeof todoComponentes } = {}
    items.forEach(item => {
      if (!agrupado[item.componente]) {
        agrupado[item.componente] = []
      }
      agrupado[item.componente].push(item)
    })
    return agrupado
  }

  const renderComponentes = (items: typeof todoComponentes) => {
    const agrupado = componentePorNome(items)
    
    return Object.entries(agrupado).map(([componente, ocorrencias]) => (
      <Card key={componente} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Package className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">{componente}</h3>
                <Badge variant="secondary" className="ml-auto">{ocorrencias.length} unidades</Badge>
              </div>
              <div className="space-y-2">
                {ocorrencias.map((occ, i) => (
                  <div key={i} className="text-sm text-slate-400 pl-8 border-l border-slate-600">
                    <p><span className="text-slate-300 font-mono">{occ.jangada}</span> - {occ.navio}</p>
                    <p className="text-xs text-slate-500">{occ.cliente}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Controlo de Stock</h1>
          </div>
          <p className="text-slate-400">Componentes a repor por inspeção</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
              <p className="text-sm text-slate-400 mb-1">Críticos</p>
              <p className="text-3xl font-bold text-red-400">{criticos.length}</p>
              <p className="text-xs text-slate-500 mt-2">Repor imediatamente</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="pt-6">
              <AlertTriangle className="h-8 w-8 text-yellow-400 mb-3" />
              <p className="text-sm text-slate-400 mb-1">Atenção</p>
              <p className="text-3xl font-bold text-yellow-400">{atencao.length}</p>
              <p className="text-xs text-slate-500 mt-2">Atentar em breve</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-6">
              <CheckCircle2 className="h-8 w-8 text-green-400 mb-3" />
              <p className="text-sm text-slate-400 mb-1">Normal</p>
              <p className="text-3xl font-bold text-green-400">{ok.length}</p>
              <p className="text-xs text-slate-500 mt-2">Stock adequado</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Componentes por Status</CardTitle>
            <CardDescription>Itens necessários para repor</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={filtro} onValueChange={setFiltro}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700/50 mb-8">
                <TabsTrigger value="criticos" className="data-[state=active]:bg-red-700/50">
                  Críticos ({criticos.length})
                </TabsTrigger>
                <TabsTrigger value="atencao" className="data-[state=active]:bg-yellow-700/50">
                  Atenção ({atencao.length})
                </TabsTrigger>
                <TabsTrigger value="ok" className="data-[state=active]:bg-green-700/50">
                  Normal ({ok.length})
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="text-center py-8 text-slate-400">
                  Carregando componentes...
                </div>
              ) : (
                <>
                  <TabsContent value="criticos" className="space-y-4 mt-6">
                    {criticos.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        ✓ Nenhum componente crítico
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {renderComponentes(criticos)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="atencao" className="space-y-4 mt-6">
                    {atencao.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        Sem componentes em atenção
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {renderComponentes(atencao)}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="ok" className="space-y-4 mt-6">
                    {ok.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        Sem componentes
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {renderComponentes(ok)}
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="mt-8 bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-blue-400" />
                <div>
                  <p className="font-semibold text-white">Atualizações Automáticas</p>
                  <p className="text-sm text-slate-400">Stock atualiza quando novo quadro é importado</p>
                </div>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Gerar PDF de Encomenda
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

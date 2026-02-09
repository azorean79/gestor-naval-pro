'use client'

import { useState, useEffect } from 'react'
import { Calendar, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface InspecaoComStock {
  id: string
  jangadaId: string
  numeroSerie: string
  navio: string
  cliente: string
  dataProximaInspecao: Date
  diasRestantes: number
  status: 'expirada' | 'urgente' | 'proximo' | 'pendente'
  cilindros: Array<{
    id: string
    tipo: string
    pressao: number
    dataProximoTeste: Date
  }>
  componentes?: string[]
}

export default function ControlPainelPage() {
  const [inspecoes, setInspecoes] = useState<InspecaoComStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'expirada' | 'urgente' | 'proximo'>('todas')

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch('/api/dashboard/inspecoes-com-stock')
        const data = await res.json()
        setInspecoes(data.data)
      } catch (error) {
        console.error('Erro ao carregar:', error)
      } finally {
        setIsLoading(false)
      }
    }
    carregar()
  }, [])

  const filtradas = inspecoes.filter(i => {
    if (filtro === 'todas') return true
    return i.status === filtro
  })

  const resumo = {
    total: inspecoes.length,
    expiradas: inspecoes.filter(i => i.status === 'expirada').length,
    urgentes: inspecoes.filter(i => i.status === 'urgente').length,
    proximas: inspecoes.filter(i => i.status === 'proximo').length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expirada':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'urgente':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'proximo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'expirada':
        return '🔴 Expirada'
      case 'urgente':
        return '🟠 Urgente (< 7 dias)'
      case 'proximo':
        return '🟡 Próxima (< 30 dias)'
      default:
        return '🟢 Normal'
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Controlo de Inspeções & Stock</h1>
        <p className="text-gray-600">Validades de inspeções e componentes necessários</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expiradas</p>
                <p className="text-3xl font-bold text-red-600">{resumo.expiradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-3xl font-bold text-orange-600">{resumo.urgentes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Próximas</p>
                <p className="text-3xl font-bold text-yellow-600">{resumo.proximas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-3xl font-bold text-green-600">{resumo.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Inspeções & Stock Necessário</CardTitle>
          <CardDescription>
            Clique em cada inspeção para ver detalhes e componentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as any)}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="todas">Todas ({resumo.total})</TabsTrigger>
              <TabsTrigger value="expirada" className="text-red-600">Expiradas ({resumo.expiradas})</TabsTrigger>
              <TabsTrigger value="urgente" className="text-orange-600">Urgentes ({resumo.urgentes})</TabsTrigger>
              <TabsTrigger value="proximo" className="text-yellow-600">Próximas ({resumo.proximas})</TabsTrigger>
            </TabsList>

            <TabsContent value={filtro} className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma inspeção nesta categoria
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Status</TableHead>
                        <TableHead>Jangada (Série)</TableHead>
                        <TableHead>Navio</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Validade Próxima</TableHead>
                        <TableHead>Dias Restantes</TableHead>
                        <TableHead>Cilindros</TableHead>
                        <TableHead>Itens a Repor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtradas.map((inspecao) => (
                        <TableRow key={inspecao.id} className="border-b">
                          <TableCell>
                            <Badge className={getStatusColor(inspecao.status)}>
                              {getStatusLabel(inspecao.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {inspecao.numeroSerie}
                          </TableCell>
                          <TableCell>{inspecao.navio}</TableCell>
                          <TableCell>{inspecao.cliente}</TableCell>
                          <TableCell>
                            {format(new Date(inspecao.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })}
                          </TableCell>
                          <TableCell>
                            <span className={`font-bold ${
                              inspecao.diasRestantes < 0 ? 'text-red-600' :
                              inspecao.diasRestantes < 7 ? 'text-orange-600' :
                              inspecao.diasRestantes < 30 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {inspecao.diasRestantes < 0 
                                ? `${Math.abs(inspecao.diasRestantes)} dias atrás` 
                                : `${inspecao.diasRestantes} dias`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {inspecao.cilindros.map((cil) => (
                                <div key={cil.id} className="text-sm">
                                  <span className="font-medium">{cil.tipo}</span>
                                  <span className="text-gray-500 ml-2">
                                    {cil.pressao} bar
                                  </span>
                                  <span className={`ml-2 text-xs ${
                                    new Date(cil.dataProximoTeste) < new Date() ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {format(new Date(cil.dataProximoTeste), 'dd/MM/yy', { locale: pt })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {inspecao.componentes && inspecao.componentes.length > 0 ? (
                                inspecao.componentes.slice(0, 3).map((comp, idx) => (
                                  <div key={idx} className="bg-blue-50 px-2 py-1 rounded text-xs">
                                    {comp}
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                              {inspecao.componentes && inspecao.componentes.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{inspecao.componentes.length - 3} mais
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

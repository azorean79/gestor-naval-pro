'use client'

import { useState, useEffect, Suspense } from 'react'
import { Calendar, AlertTriangle, Clock, CheckCircle2, Zap, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { useSearchParams } from 'next/navigation'

interface Inspecao {
  id: string
  numeroSerie: string
  navio: string
  cliente: string
  dataProximaInspecao: Date
  diasRestantes: number
  status: 'expirada' | 'urgente' | 'proximo' | 'pendente'
  cilindros: Array<{ id: string; tipo: string; pressao: number }>
  componentes: string[]
}

function AgendaContent() {
  const searchParams = useSearchParams()
  const filterParam = searchParams.get('filter') || 'todas'
  
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([])
  const [filtro, setFiltro] = useState<string>(filterParam)
  const [busca, setBusca] = useState('')
  const [isLoading, setIsLoading] = useState(true)

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

  const filtradas = inspecoes
    .filter(i => {
      if (filtro === 'todas') return true
      return i.status === filtro
    })
    .filter(i => 
      i.numeroSerie.toLowerCase().includes(busca.toLowerCase()) ||
      i.navio.toLowerCase().includes(busca.toLowerCase()) ||
      i.cliente.toLowerCase().includes(busca.toLowerCase())
    )

  const resumo = {
    expiradas: inspecoes.filter(i => i.status === 'expirada').length,
    urgentes: inspecoes.filter(i => i.status === 'urgente').length,
    proximas: inspecoes.filter(i => i.status === 'proximo').length,
    total: inspecoes.length
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expirada':
        return 'bg-red-500/10 border-red-500/30 text-red-300'
      case 'urgente':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-300'
      case 'proximo':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
      default:
        return 'bg-green-500/10 border-green-500/30 text-green-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'expirada':
        return '🔴 Expirada'
      case 'urgente':
        return '🟠 Urgente'
      case 'proximo':
        return '🟡 Próxima'
      default:
        return '🟢 Normal'
    }
  }

  const getDiasColor = (dias: number) => {
    if (dias < 0) return 'text-red-400 font-bold'
    if (dias <= 7) return 'text-orange-400 font-bold'
    if (dias <= 30) return 'text-yellow-400 font-bold'
    return 'text-green-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Agenda de Inspeções</h1>
          </div>
          <p className="text-slate-400">Controlo de validades e agendamento</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-1">Expiradas</p>
              <p className="text-3xl font-bold text-red-400">{resumo.expiradas}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-1">Urgentes (&lt;7d)</p>
              <p className="text-3xl font-bold text-orange-400">{resumo.urgentes}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-1">Próximas (&lt;30d)</p>
              <p className="text-3xl font-bold text-yellow-400">{resumo.proximas}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-slate-400 mb-1">Total</p>
              <p className="text-3xl font-bold text-blue-400">{resumo.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Buscar série, navio ou cliente..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Inspeções</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={filtro} onValueChange={setFiltro} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
                <TabsTrigger value="todas" className="data-[state=active]:bg-slate-700">
                  Todas ({resumo.total})
                </TabsTrigger>
                <TabsTrigger value="expirada" className="data-[state=active]:bg-red-700/50">
                  Expiradas ({resumo.expiradas})
                </TabsTrigger>
                <TabsTrigger value="urgente" className="data-[state=active]:bg-orange-700/50">
                  Urgentes ({resumo.urgentes})
                </TabsTrigger>
                <TabsTrigger value="proximo" className="data-[state=active]:bg-yellow-700/50">
                  Próximas ({resumo.proximas})
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="text-center py-8 text-slate-400">
                  Carregando inspeções...
                </div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhuma inspeção encontrada
                </div>
              ) : (
                <div className="overflow-x-auto mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Série</TableHead>
                        <TableHead className="text-slate-300">Navio</TableHead>
                        <TableHead className="text-slate-300">Cliente</TableHead>
                        <TableHead className="text-slate-300">Próxima Inspeção</TableHead>
                        <TableHead className="text-slate-300 text-center">Dias</TableHead>
                        <TableHead className="text-slate-300">Cilindros</TableHead>
                        <TableHead className="text-right text-slate-300">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtradas.map((insp) => (
                        <TableRow key={insp.id} className="border-slate-700 hover:bg-slate-700/30 transition">
                          <TableCell>
                            <Badge className={getStatusColor(insp.status)}>
                              {getStatusLabel(insp.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-blue-400">
                            {insp.numeroSerie}
                          </TableCell>
                          <TableCell className="text-white">{insp.navio}</TableCell>
                          <TableCell className="text-slate-300">{insp.cliente}</TableCell>
                          <TableCell className="text-slate-300">
                            {format(new Date(insp.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })}
                          </TableCell>
                          <TableCell className={`text-center ${getDiasColor(insp.diasRestantes)}`}>
                            {insp.diasRestantes < 0 
                              ? `${Math.abs(insp.diasRestantes)}d atrás` 
                              : `${insp.diasRestantes}d`}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {insp.cilindros.slice(0, 2).map((cil) => (
                                <Badge key={cil.id} variant="outline" className="text-xs">
                                  {cil.tipo}
                                </Badge>
                              ))}
                              {insp.cilindros.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{insp.cilindros.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/20">
                              Agendar →
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Zap className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-400">
                <p className="font-semibold text-slate-300 mb-1">💡 Dica</p>
                <p>Clique em "Agendar" para contactar o cliente e marcar a próxima inspeção. O sistema gera automaticamente o certificado AZ26-XXX quando o quadro for importado.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function AgendaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center"><p className="text-white">Carregando...</p></div>}>
      <AgendaContent />
    </Suspense>
  )
}

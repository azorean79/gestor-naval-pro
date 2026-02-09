'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  AlertTriangle, Calendar, Package, Upload, Zap, TrendingDown, 
  BarChart3, Clock, CheckCircle2, ArrowRight, Sparkles, Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  inspecoesExpiradas: number
  inspecoesUrgentes: number
  inspecoesProximas: number
  componentesCriticos: number
  totalJangadas: number
  ultimaAtualizacao: string
}

export default function DashboardPrincipalPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch('/api/dashboard/inspecoes-com-stock')
        const result = await res.json()
        const inspecoes = result.data || []

        setData({
          inspecoesExpiradas: inspecoes.filter((i: any) => i.status === 'expirada').length,
          inspecoesUrgentes: inspecoes.filter((i: any) => i.status === 'urgente').length,
          inspecoesProximas: inspecoes.filter((i: any) => i.status === 'proximo').length,
          componentesCriticos: inspecoes.reduce((sum: number, i: any) => sum + i.componentes.length, 0),
          totalJangadas: inspecoes.length,
          ultimaAtualizacao: new Date().toLocaleTimeString('pt-PT')
        })
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
      } finally {
        setIsLoading(false)
      }
    }
    carregar()
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Gestor Naval Pro</h1>
              <p className="text-xs text-slate-400">Controlo de Inspeções & Stock</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Painel de Controlo</h2>
              <p className="text-slate-400">Gestão em tempo real de inspeções, validações e stock</p>
            </div>
            {data && (
              <div className="text-right">
                <p className="text-xs text-slate-500">Actualizado às</p>
                <p className="text-sm font-mono text-slate-300">{data.ultimaAtualizacao}</p>
              </div>
            )}
          </div>

          {/* Critical Alerts */}
          {data && data.inspecoesExpiradas > 0 && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-300 mb-1">⚠️ {data.inspecoesExpiradas} Inspeções Expiradas!</h3>
                  <p className="text-sm text-red-200/80">Ação imediata requerida. Contacte os clientes para agendar inspeções urgentes.</p>
                </div>
                <Link href="/agenda-inspecoes">
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                    Ver Agenda
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards Grid */}
        {!isLoading && data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {/* Expiradas */}
            <Link href="/agenda-inspecoes?filter=expiradas">
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <AlertTriangle className="h-8 w-8 text-red-400 mb-3" />
                    <p className="text-sm font-medium text-slate-400 mb-1">Expiradas</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-red-400">{data.inspecoesExpiradas}</p>
                      <TrendingDown className="h-4 w-4 text-red-400 mb-1" />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Ação urgente</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Urgentes */}
            <Link href="/agenda-inspecoes?filter=urgentes">
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40 transition cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Clock className="h-8 w-8 text-orange-400 mb-3" />
                    <p className="text-sm font-medium text-slate-400 mb-1">Urgentes</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-orange-400">{data.inspecoesUrgentes}</p>
                      <Badge className="bg-orange-500/20 text-orange-300 text-xs mb-1">&lt;7 dias</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Agendar em breve</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Próximas */}
            <Link href="/agenda-inspecoes?filter=proximas">
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 hover:border-yellow-500/40 transition cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Calendar className="h-8 w-8 text-yellow-400 mb-3" />
                    <p className="text-sm font-medium text-slate-400 mb-1">Próximas</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-yellow-400">{data.inspecoesProximas}</p>
                      <Badge className="bg-yellow-500/20 text-yellow-300 text-xs mb-1">&lt;30d</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Planeadas</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Stock Crítico */}
            <Link href="/controlo-stock">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col">
                    <Package className="h-8 w-8 text-purple-400 mb-3" />
                    <p className="text-sm font-medium text-slate-400 mb-1">Componentes</p>
                    <div className="flex items-end gap-2">
                      <p className="text-3xl font-bold text-purple-400">{data.componentesCriticos}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">A repor</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Total Jangadas */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-600/5 border-blue-500/20 hover:border-blue-500/40 transition h-full">
              <CardContent className="pt-6">
                <div className="flex flex-col">
                  <BarChart3 className="h-8 w-8 text-blue-400 mb-3" />
                  <p className="text-sm font-medium text-slate-400 mb-1">Total</p>
                  <div className="flex items-end gap-2">
                    <p className="text-3xl font-bold text-blue-400">{data.totalJangadas}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Jangadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Upload Quadro */}
          <Link href="/quadro-upload">
            <Card 
              className={`border-2 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-blue-900/50 hover:to-slate-900 transition cursor-pointer h-full ${
                isDragging ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-4">
                    <Upload className="h-8 w-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Importar Quadro</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Upload ficheiro Excel com dados da inspeção
                  </p>
                  <div className="flex flex-col gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <span>IA extrai dados automático</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span>Gera certificado AZ26-XXX</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Agenda */}
          <Link href="/agenda-inspecoes">
            <Card className="border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-orange-900/50 hover:to-slate-900 transition cursor-pointer h-full">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 mb-4">
                    <Calendar className="h-8 w-8 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Agenda</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Ver inspeções vencidas e próximas
                  </p>
                  <div className="space-y-2">
                    {data && data.inspecoesExpiradas > 0 && (
                      <Badge className="bg-red-500/30 text-red-300">
                        {data.inspecoesExpiradas} expiradas
                      </Badge>
                    )}
                    {data && data.inspecoesUrgentes > 0 && (
                      <Badge className="bg-orange-500/30 text-orange-300 ml-2">
                        {data.inspecoesUrgentes} urgentes
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Stock */}
          <Link href="/controlo-stock">
            <Card className="border-2 border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-purple-900/50 hover:to-slate-900 transition cursor-pointer h-full">
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
                    <Package className="h-8 w-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Stock</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    Componentes a repor por inspeção
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm text-slate-500">
                      {data && `${data.componentesCriticos} itens críticos`}
                    </p>
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Info Section */}
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              Como Funciona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {[
                { num: '1', titulo: 'Upload', desc: 'Ficheiro Excel' },
                { num: '2', titulo: 'IA Analisa', desc: 'Extrai dados' },
                { num: '3', titulo: 'Certificado', desc: 'AZ26-XXX' },
                { num: '4', titulo: 'Agenda', desc: 'Próxima insp.' },
                { num: '5', titulo: 'Stock', desc: 'Componentes' }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center mb-3">
                    <span className="font-bold text-blue-400">{step.num}</span>
                  </div>
                  <p className="font-semibold text-slate-300 text-sm">{step.titulo}</p>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

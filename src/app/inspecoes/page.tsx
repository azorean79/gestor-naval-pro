'use client'

import { useMemo, useState } from 'react'
import { Search, CalendarClock, ClipboardCheck, Calendar, CheckCircle, Loader } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useInspecoes, useInspecoesStats } from '@/hooks/use-inspecoes'
import { AdvancedFilters, type AdvancedFiltersState } from '@/components/inspecoes/advanced-filters'
import { AddInspecaoForm } from '@/components/inspecoes/add-inspecao-form'

type FilterType = 'todas' | 'agendadas' | 'decorrer' | 'terminadas'

export default function InspecoesPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('todas')
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFiltersState>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const { data: inspecoesResponse, isLoading, refetch } = useInspecoes({ limit: 100 })
  const { data: statsResponse } = useInspecoesStats()

  const inspecoes = inspecoesResponse?.data || []
  const stats = statsResponse?.stats

  // Extrair lista única de técnicos
  const tecnicos = useMemo(() => {
    const tecnicos = new Map()
    inspecoes.forEach((insp: any) => {
      if (insp.tecnicoResponsavel) {
        if (!tecnicos.has(insp.tecnicoResponsavel)) {
          tecnicos.set(insp.tecnicoResponsavel, { id: insp.tecnicoResponsavel, nome: insp.tecnicoResponsavel })
        }
      }
    })
    return Array.from(tecnicos.values())
  }, [inspecoes])

  const filtradas = useMemo(() => {
    let resultado = inspecoes

    // Filtro por tipo (Agendadas, A Decorrer, Terminadas)
    if (filterType === 'agendadas') {
      resultado = resultado.filter((insp: any) => {
        const hoje = new Date()
        const dataInsp = new Date(insp.dataInspecao)
        return dataInsp > hoje && insp.status !== 'Concluída'
      })
    } else if (filterType === 'decorrer') {
      resultado = resultado.filter((insp: any) => {
        const hoje = new Date()
        const dataInsp = new Date(insp.dataInspecao)
        // A decorrer: data é hoje ou passou, mas ainda não concluída
        return dataInsp <= hoje && insp.status !== 'Concluída'
      })
    } else if (filterType === 'terminadas') {
      resultado = resultado.filter((insp: any) => insp.status === 'Concluída' || insp.resultado === 'Aprovada' || insp.resultado === 'Reprovada')
    }

    // Filtro por texto
    if (search) {
      const termo = search.toLowerCase()
      resultado = resultado.filter((insp: any) => {
        const recurso = insp.navio?.nome || insp.jangada?.numeroSerie || insp.cilindro?.numeroSerie || ''
        return (
          insp.numero?.toLowerCase().includes(termo) ||
          insp.tipoInspecao?.toLowerCase().includes(termo) ||
          recurso.toLowerCase().includes(termo)
        )
      })
    }

    // Filtro por data inicial
    if (advancedFilters.dataInicio) {
      const dataInicio = new Date(advancedFilters.dataInicio)
      resultado = resultado.filter((insp: any) => {
        const dataInsp = new Date(insp.dataInspecao)
        return dataInsp >= dataInicio
      })
    }

    // Filtro por data final
    if (advancedFilters.dataFim) {
      const dataFim = new Date(advancedFilters.dataFim)
      dataFim.setHours(23, 59, 59, 999)
      resultado = resultado.filter((insp: any) => {
        const dataInsp = new Date(insp.dataInspecao)
        return dataInsp <= dataFim
      })
    }

    // Filtro por status
    if (advancedFilters.status) {
      resultado = resultado.filter((insp: any) => insp.resultado === advancedFilters.status)
    }

    // Filtro por tipo
    if (advancedFilters.tipo) {
      resultado = resultado.filter((insp: any) => insp.tipoInspecao === advancedFilters.tipo)
    }

    // Filtro por equipamento
    if (advancedFilters.equipamento) {
      const termo = advancedFilters.equipamento.toLowerCase()
      resultado = resultado.filter((insp: any) => {
        const recurso = insp.navio?.nome || insp.jangada?.numeroSerie || insp.cilindro?.numeroSerie || ''
        return recurso.toLowerCase().includes(termo)
      })
    }

    // Filtro por técnico
    if (advancedFilters.tecnico) {
      resultado = resultado.filter((insp: any) => insp.tecnicoResponsavel === advancedFilters.tecnico)
    }

    // Filtro por custo mínimo
    if (advancedFilters.custoMinimo !== undefined) {
      const custoMinimo = advancedFilters.custoMinimo;
      resultado = resultado.filter((insp: any) => {
        const custoTotal = (insp.custos || []).reduce((sum: number, c: any) => sum + c.valor * (c.quantidade || 1), 0)
        return custoTotal >= custoMinimo
      })
    }

    // Filtro por custo máximo
    if (advancedFilters.custoMaximo !== undefined) {
      const custoMaximo = advancedFilters.custoMaximo;
      resultado = resultado.filter((insp: any) => {
        const custoTotal = (insp.custos || []).reduce((sum: number, c: any) => sum + c.valor * (c.quantidade || 1), 0)
        return custoTotal <= custoMaximo
      })
    }

    return resultado
  }, [inspecoes, search, advancedFilters, filterType])

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-7 w-7" />
            Inspeções
          </h1>
          <p className="text-muted-foreground">
            Registo completo com custos e histórico detalhado
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <CalendarClock className="h-4 w-4 mr-2" />
          Nova Inspeção
        </Button>
      </div>

      {/* Filtros principais - Agendadas, A Decorrer, Terminadas */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filtrar por status:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => setFilterType('todas')}
            variant={filterType === 'todas' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${
              filterType === 'todas' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : ''
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            Todas ({inspecoes.length})
          </Button>
          <Button
            onClick={() => setFilterType('agendadas')}
            variant={filterType === 'agendadas' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${
              filterType === 'agendadas' 
                ? 'bg-purple-600 hover:bg-purple-700' 
                : ''
            }`}
          >
            <Calendar className="h-4 w-4" />
            Agendadas
          </Button>
          <Button
            onClick={() => setFilterType('decorrer')}
            variant={filterType === 'decorrer' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${
              filterType === 'decorrer' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : ''
            }`}
          >
            <Loader className="h-4 w-4" />
            A Decorrer
          </Button>
          <Button
            onClick={() => setFilterType('terminadas')}
            variant={filterType === 'terminadas' ? 'default' : 'outline'}
            className={`flex items-center gap-2 ${
              filterType === 'terminadas' 
                ? 'bg-green-600 hover:bg-green-700' 
                : ''
            }`}
          >
            <CheckCircle className="h-4 w-4" />
            Terminadas
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores principais</CardTitle>
          <CardDescription>Resumo de desempenho das inspeções</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg border bg-slate-50">
              <div className="text-xs text-slate-500">Total de inspeções</div>
              <div className="text-2xl font-bold">{stats?.totalInspecoes ?? 0}</div>
            </div>
            <div className="p-3 rounded-lg border bg-slate-50">
              <div className="text-xs text-slate-500">Taxa de aprovação</div>
              <div className="text-2xl font-bold">{stats?.taxaAprovacao ?? '0'}%</div>
            </div>
            <div className="p-3 rounded-lg border bg-slate-50">
              <div className="text-xs text-slate-500">Inspeções com condições</div>
              <div className="text-2xl font-bold">{stats?.withCondicoes ?? 0}</div>
            </div>
            <div className="p-3 rounded-lg border bg-slate-50">
              <div className="text-xs text-slate-500">Custos totais</div>
              <div className="text-2xl font-bold">€{(stats?.custoTotal ?? 0).toLocaleString('pt-PT')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pesquisar inspeções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Pesquisar por número, tipo ou equipamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <AdvancedFilters
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        tecnicos={tecnicos}
      />

      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <p className="text-sm text-slate-600">
            Mostrando <span className="font-semibold">{filtradas.length}</span> de <span className="font-semibold">{inspecoes.length}</span> inspeções
          </p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card className="p-6 text-center">Carregando inspeções...</Card>
      ) : filtradas.length === 0 ? (
        <Card className="p-6 text-center">Nenhuma inspeção encontrada.</Card>
      ) : (
        <div className="space-y-4">
          {filtradas.map((insp: any) => {
            const recurso = insp.navio?.nome || insp.jangada?.numeroSerie || insp.cilindro?.numeroSerie || 'N/A'
            const dataProxima = insp.dataProxima ? new Date(insp.dataProxima) : null
            const vencida = dataProxima ? dataProxima < new Date() : false
            const custoTotal = (insp.custos || []).reduce((sum: number, c: any) => sum + c.valor * (c.quantidade || 1), 0)

            return (
              <Card key={insp.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{insp.numero}</CardTitle>
                      <CardDescription>{recurso}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{insp.tipoInspecao}</Badge>
                      <Badge variant={insp.resultado === 'reprovada' ? 'destructive' : 'default'}>
                        {insp.resultado || 'aprovada'}
                      </Badge>
                      {vencida && <Badge variant="destructive">Vencida</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Inspeção: {new Date(insp.dataInspecao).toLocaleDateString('pt-PT')}
                    </div>
                    <div>
                      Próxima: {dataProxima ? dataProxima.toLocaleDateString('pt-PT') : 'N/D'}
                    </div>
                    <div>Técnico: {insp.tecnicoResponsavel}</div>
                    <div>Custo total: €{custoTotal.toLocaleString('pt-PT')}</div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Custos associados</h4>
                      {insp.custos?.length ? (
                        <ul className="text-sm text-slate-600 space-y-1">
                          {insp.custos.map((c: any) => (
                            <li key={c.id} className="flex justify-between">
                              <span>{c.descricao} ({c.tipoServico})</span>
                              <span>€{(c.valor * (c.quantidade || 1)).toLocaleString('pt-PT')}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Nenhum custo registado.</p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold mb-2">Histórico completo</h4>
                      {insp.historico?.length ? (
                        <ul className="text-sm text-slate-600 space-y-1">
                          {insp.historico.map((h: any) => (
                            <li key={h.id} className="flex justify-between">
                              <span>{new Date(h.dataRealizada).toLocaleDateString('pt-PT')} · {h.resultado}</span>
                              <span>{h.tecnico}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">Sem registos históricos.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal para adicionar nova inspeção */}
      <AddInspecaoForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          refetch()
          setShowAddForm(false)
        }}
      />
    </div>
  )
}

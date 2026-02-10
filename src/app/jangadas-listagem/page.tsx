"use client";
import { Skeleton } from '@/components/ui/skeleton';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, LifeBuoy, AlertCircle, CheckCircle, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { Jangada } from '@/components/modern-lists-and-forms'

export default function JangadasListagemPage() {
    // Exportação de dados
    const exportToExcel = () => {
      const header = ['Número de Série', 'Tipo', 'Marca', 'Modelo', 'Capacidade', 'Status'];
      const rows = jangadasFiltradas.map(j => [j.numeroSerie, j.tipo, j.marca?.nome, j.modelo?.nome, j.capacidade, j.status]);
      const csv = [header, ...rows].map(r => r.join(';')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jangadas.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    // PDF (simples)
    const exportToPDF = () => {
      window.print(); // Para exportação rápida, pode ser melhorado com libs
    };
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [marcaFilter, setMarcaFilter] = useState<string>('todos')
  const [modeloFilter, setModeloFilter] = useState<string>('todos')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [jangadas, setJangadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Importar lista moderna
  const ModernList = require('@/components/modern-lists-and-forms').JangadasList

  useEffect(() => {
    const fetchJangadas = async () => {
      try {
        const response = await fetch('/api/jangadas?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setJangadas(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar jangadas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJangadas()
  }, [])

  // Filtros avançados
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroMarca, setFiltroMarca] = useState('todos')
  const [filtroModelo, setFiltroModelo] = useState('todos')
  const [filtroCapacidade, setFiltroCapacidade] = useState('todos')
  const tipos = Array.from(new Set(jangadas.map(j => j.tipo || 'Desconhecido')))
  const marcas = Array.from(new Set(jangadas.map(j => j.marca?.nome || 'Desconhecida')))
  const modelos = Array.from(new Set(jangadas.map(j => j.modelo?.nome || 'Desconhecido')))
  const capacidades = Array.from(new Set(jangadas.map(j => j.capacidade || 'Desconhecida')))
  const statusList = Array.from(new Set(jangadas.map(j => j.status || 'Desconhecido')))
  const jangadasFiltradas = jangadas.filter(j =>
    (filtroStatus === 'todos' || j.status === filtroStatus) &&
    (filtroTipo === 'todos' || j.tipo === filtroTipo) &&
    (filtroMarca === 'todos' || j.marca?.nome === filtroMarca) &&
    (filtroModelo === 'todos' || j.modelo?.nome === filtroModelo) &&
    (filtroCapacidade === 'todos' || String(j.capacidade) === String(filtroCapacidade))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex flex-wrap gap-4">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {statusList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroMarca} onValueChange={setFiltroMarca}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {marcas.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroModelo} onValueChange={setFiltroModelo}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Modelo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {modelos.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filtroCapacidade} onValueChange={setFiltroCapacidade}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Capacidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {capacidades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-4 flex gap-4">
          <Button variant="outline" onClick={exportToExcel}>Exportar Excel</Button>
          <Button variant="outline" onClick={exportToPDF}>Exportar PDF</Button>
        </div>
        {loading ? <Skeleton className="h-40 w-full" /> : (
          <ModernList
            jangadas={jangadasFiltradas}
            onView={(jangada: Jangada) => router.push(`/jangadas/detalhes/${jangada.id}`)}
            onEdit={(jangada: Jangada) => router.push(`/jangadas/${jangada.id}/editar`)}
            onDelete={(jangada: Jangada) => router.push(`/jangadas/${jangada.id}/excluir`)}
            onAdd={() => router.push(`/jangadas/novo`)}
            onAddComponente={(jangada: Jangada) => router.push(`/jangadas/${jangada.id}/componentes/novo`)}
          />
        )}
      </div>
    </div>
  )

  const filteredJangadas = jangadas.filter(jangada => {
    const matchesSearch = jangada.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.navio?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.marca?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.modelo?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || jangada.status === statusFilter
    const matchesMarca = marcaFilter === 'todos' || jangada.marca?.nome === marcaFilter
    const matchesModelo = modeloFilter === 'todos' || jangada.modelo?.nome === modeloFilter
    const matchesTipo = tipoFilter === 'todos' || jangada.tipo === tipoFilter
    
    return matchesSearch && matchesStatus && matchesMarca && matchesModelo && matchesTipo
  })

  // Get unique values for filters
  const uniqueMarcas = [...new Set(jangadas.map(j => j.marca?.nome).filter(Boolean))]
  const uniqueModelos = [...new Set(jangadas.map(j => j.modelo?.nome).filter(Boolean))]
  const uniqueTipos = [...new Set(jangadas.map(j => j.tipo).filter(Boolean))]

  const getStatusBadge = (status: string): 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
    const statusMap: Record<string, 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost'> = {
      'ativo': 'default',
      'manutencao': 'secondary',
      'inativo': 'destructive'
    }
    return statusMap[status] || 'default'
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LifeBuoy className="h-8 w-8" />
            Listagem de Jangadas
          </h1>
          <p className="text-muted-foreground">Todas as jangadas salva-vidas registradas</p>
        </div>
      </div>

// ...existing code...
                  {filteredJangadas.map((jangada) => (
                    <TableRow 
                      key={jangada.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/jangadas/${jangada.id}`)}
                    >
                      <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                      <TableCell className="text-sm">{jangada.tipo}</TableCell>
                      <TableCell className="text-sm">{jangada.tipoPack || '-'}</TableCell>
                      <TableCell className="text-sm text-center">{jangada.capacidade || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.navio?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(jangada.status)}>
                          {jangada.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataFabricacao 
                          ? new Date(jangada.dataFabricacao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataProximaInspecao 
                          ? new Date(jangada.dataProximaInspecao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.hruAplicavel ? '✅ Sim' : '❌ Não'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="sm"
                          className="ml-2"
                          onClick={async (e) => {
                            e.stopPropagation()
                            // Registrar início da inspeção
                            const inicio = new Date()
                            // Duração máxima: 3h30
                            const fim = new Date(inicio.getTime() + 3.5 * 60 * 60 * 1000)
                            // Chamar API para criar inspeção e evento na agenda
                            await fetch(`/api/inspecoes`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                jangadaId: jangada.id,
                                dataInicio: inicio.toISOString(),
                                dataFimMax: fim.toISOString(),
                              })
                            })
                            // Redirecionar para tela de inspeção
                            router.push(`/inspecoes/${jangada.id}/checklist`)
                          }}
                        >
                          Iniciar Inspeção
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                          onClick={async (e) => {
                            e.stopPropagation()
                            // Chamar API para finalizar inspeção
                            await fetch(`/api/inspecoes/${jangada.id}/finalizar`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                            })
                            // Atualizar página ou mostrar confirmação
                            alert('Inspeção finalizada!')
                          }}
                        >
                          Finalizar Inspeção
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
      {/* Filtros */}
      <Card className="mb-6">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtros</CardTitle>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Número série, tipo, cliente, navio, marca, modelo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Marca</label>
                  <Select value={marcaFilter} onValueChange={setMarcaFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as marcas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as marcas</SelectItem>
                      {uniqueMarcas.map(marca => (
                        <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Modelo</label>
                  <Select value={modeloFilter} onValueChange={setModeloFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os modelos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os modelos</SelectItem>
                      {uniqueModelos.map(modelo => (
                        <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {uniqueTipos.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchTerm || statusFilter !== 'todos' || marcaFilter !== 'todos' || modeloFilter !== 'todos' || tipoFilter !== 'todos') && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('todos')
                      setMarcaFilter('todos')
                      setModeloFilter('todos')
                      setTipoFilter('todos')
                    }}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <LifeBuoy className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{jangadas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{jangadas.filter(j => j.status === 'ativo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Próx. Vencimento (30 dias)</p>
                <p className="text-2xl font-bold">
                  {jangadas.filter(j => {
                    if (!j.dataProximaInspecao) return false
                    const dias = Math.floor((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return dias > 0 && dias <= 30
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">
                  {jangadas.filter(j => {
                    if (!j.dataProximaInspecao) return false
                    const dias = Math.floor((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return dias < 0
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Jangadas</CardTitle>
          <CardDescription>
            {filteredJangadas.length} jangada(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredJangadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma jangada encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Série</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tipo Pack</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Navio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Fabricação</TableHead>
                    <TableHead>Próxima Inspeção</TableHead>
                    <TableHead>HRU</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJangadas.map((jangada) => (
                    <TableRow 
                      key={jangada.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/jangadas/${jangada.id}`)}
                    >
                      <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                      <TableCell className="text-sm">{jangada.tipo}</TableCell>
                      <TableCell className="text-sm">{jangada.tipoPack || '-'}</TableCell>
                      <TableCell className="text-sm text-center">{jangada.capacidade || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.navio?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(jangada.status)}>
                          {jangada.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataFabricacao 
                          ? new Date(jangada.dataFabricacao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataProximaInspecao 
                          ? new Date(jangada.dataProximaInspecao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.hruAplicavel ? '✅ Sim' : '❌ Não'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation() // Impede que o clique na linha seja acionado
                            router.push(`/jangadas/${jangada.id}`)
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

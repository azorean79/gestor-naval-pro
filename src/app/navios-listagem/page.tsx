'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ListPlus, Anchor, Ship, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export default function NaviosListagemPage() {
  const router = useRouter();
    // Exportação de dados
    const exportToExcel = () => {
      const header = ['Nome', 'Tipo', 'Matrícula', 'IMO', 'MMSI', 'Bandeira', 'Capacidade', 'Status'];
      const rows = naviosFiltrados.map(n => [n.nome, n.tipo, n.matricula, n.imo, n.mmsi, n.bandeira, n.capacidade, n.status]);
      const csv = [header, ...rows].map(r => r.join(';')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'navios.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    // PDF (simples)
    const exportToPDF = () => {
      window.print(); // Para exportação rápida, pode ser melhorado com libs
    };
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [bandeiraFilter, setBandeiraFilter] = useState<string>('todos')
  const [showFilters, setShowFilters] = useState(false)
  const [navios, setNavios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Importar lista moderna
  const ModernList = require('@/components/modern-lists-and-forms').NaviosList

  useEffect(() => {
    const fetchNavios = async () => {
      try {
        const response = await fetch('/api/navios?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setNavios(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar navios:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNavios()
  }, [])

  // Filtros avançados
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroBandeira, setFiltroBandeira] = useState('todos')
  const [filtroCapacidade, setFiltroCapacidade] = useState('todos')
  const tipos = Array.from(new Set(navios.map(n => n.tipo || 'Desconhecido')))
  const bandeiras = Array.from(new Set(navios.map(n => n.bandeira || 'Desconhecida')))
  const capacidades = Array.from(new Set(navios.map(n => n.capacidade || 'Desconhecida')))
  const statusList = Array.from(new Set(navios.map(n => n.status || 'Desconhecido')))
  const naviosFiltrados = navios.filter(n =>
    (filtroStatus === 'todos' || n.status === filtroStatus) &&
    (filtroTipo === 'todos' || n.tipo === filtroTipo) &&
    (filtroBandeira === 'todos' || n.bandeira === filtroBandeira) &&
    (filtroCapacidade === 'todos' || String(n.capacidade) === String(filtroCapacidade))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
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
          <Select value={filtroBandeira} onValueChange={setFiltroBandeira}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Bandeira" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {bandeiras.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
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
            navios={naviosFiltrados}
            onView={(navio: import('@/components/modern-lists-and-forms').Navio) => router.push(`/navios/detalhes/${navio.id}`)}
            onEdit={(navio: import('@/components/modern-lists-and-forms').Navio) => router.push(`/navios/${navio.id}/editar`)}
            onDelete={(navio: import('@/components/modern-lists-and-forms').Navio) => router.push(`/navios/${navio.id}/excluir`)}
            onAdd={() => router.push(`/navios/novo`)}
          />
        )}
      </div>
    </div>
  )

  const filteredNavios = navios.filter(navio => {
    const matchesSearch = navio.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         navio.matricula?.includes(searchTerm) ||
                         navio.imo?.includes(searchTerm) ||
                         navio.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         navio.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         navio.bandeira?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || navio.status === statusFilter
    const matchesTipo = tipoFilter === 'todos' || navio.tipo === tipoFilter
    const matchesBandeira = bandeiraFilter === 'todos' || navio.bandeira === bandeiraFilter
    
    return matchesSearch && matchesStatus && matchesTipo && matchesBandeira
  })

  // Get unique values for filters
  const uniqueTipos = [...new Set(navios.map(n => n.tipo).filter(Boolean))]
  const uniqueBandeiras = [...new Set(navios.map(n => n.bandeira).filter(Boolean))]

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
            <Ship className="h-8 w-8" />
            Listagem de Navios
          </h1>
          <p className="text-muted-foreground">Todos os navios e embarcações registrados</p>
        </div>
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <label className="text-sm font-medium mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome, matrícula, IMO, cliente, tipo, bandeira..."
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
                <div>
                  <label className="text-sm font-medium mb-2 block">Bandeira</label>
                  <Select value={bandeiraFilter} onValueChange={setBandeiraFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as bandeiras" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as bandeiras</SelectItem>
                      {uniqueBandeiras.map(bandeira => (
                        <SelectItem key={bandeira} value={bandeira}>{bandeira}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos' || bandeiraFilter !== 'todos') && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('todos')
                      setTipoFilter('todos')
                      setBandeiraFilter('todos')
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Ship className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Navios</p>
                <p className="text-2xl font-bold">{navios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Anchor className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{navios.filter(n => n.status === 'ativo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ListPlus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold">{navios.filter(n => n.status === 'manutencao').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Navios</CardTitle>
          <CardDescription>
            {filteredNavios.length} navio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredNavios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum navio encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>IMO</TableHead>
                    <TableHead>MMSI</TableHead>
                    <TableHead>Bandeira</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima Inspeção</TableHead>
                    <TableHead>Tecnico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNavios.map((navio) => (
                    <TableRow key={navio.id}>
                      <TableCell className="font-medium">{navio.nome}</TableCell>
                      <TableCell className="text-sm">{navio.tipo}</TableCell>
                      <TableCell className="text-sm">{navio.matricula || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.imo || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.mmsi || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.bandeira}</TableCell>
                      <TableCell className="text-sm">{navio.cliente?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(navio.status)}>
                          {navio.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {navio.dataProximaInspecao 
                          ? new Date(navio.dataProximaInspecao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">{navio.tecnico}</TableCell>
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

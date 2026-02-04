'use client'

import { useState } from 'react'
import { Cylinder, Search, Filter, Plus, AlertTriangle, CheckCircle, Calendar, Wrench, Eye, Edit, Trash2, Download, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { AddCilindroForm } from '@/components/cilindros/add-cilindro-form'
import { useCilindros } from '@/hooks/use-cilindros'
import { CilindroWithJangada } from '@/lib/types'
import { useQueryClient } from '@tanstack/react-query'

export default function CilindrosPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(50) // Aumentei o limite para mostrar mais cilindros
  const [showAddForm, setShowAddForm] = useState(false)

  const queryClient = useQueryClient()

  const { data: cilindrosResponse, isLoading, error } = useCilindros({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    tipo: tipoFilter !== 'todos' ? tipoFilter : undefined,
    page: currentPage,
    limit,
  })

  const cilindros = cilindrosResponse?.data ?? []
  const total = cilindrosResponse?.total ?? 0
  const totalPages = cilindrosResponse?.totalPages ?? 1

  // Separar cilindros por categoria de status
  const cilindrosAtivos = cilindros.filter((c: CilindroWithJangada) => c.status === 'ativo')
  const cilindrosManutencao = cilindros.filter((c: CilindroWithJangada) => c.status === 'manutencao')
  const cilindrosProblema = cilindros.filter(
    (c: CilindroWithJangada) => c.status === 'defeituoso' || c.status === 'expirado'
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>
      case 'defeituoso':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Defeituoso</Badge>
      case 'expirado':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Expirado</Badge>
      case 'manutencao':
        return <Badge className="bg-blue-100 text-blue-800"><Wrench className="w-3 h-3 mr-1" />Manutenção</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: string) => {
    return <Badge variant="outline">{tipo}</Badge>
  }

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return 'N/A'
    try {
      return format(new Date(dateValue), 'dd/MM/yyyy', { locale: pt })
    } catch {
      return 'N/A'
    }
  }

  const isProximoTesteExpirando = (dataProximoTeste: Date | string | null | undefined) => {
    if (!dataProximoTeste) return false
    const hoje = new Date()
    const dataTeste = new Date(dataProximoTeste)
    const diffTime = dataTeste.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 // 3 meses
  }

  const renderCilindrosTable = (cilindrosList: CilindroWithJangada[], title: string, description: string) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cylinder className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {cilindrosList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cilindro nesta categoria
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Pressão Trabalho</TableHead>
                  <TableHead>Pressão Teste</TableHead>
                  <TableHead>Próximo Teste</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cilindrosList.map((cilindro) => (
                  <TableRow key={cilindro.id}>
                    <TableCell className="font-medium">{cilindro.numeroSerie}</TableCell>
                    <TableCell>{getTipoBadge(cilindro.tipo)}</TableCell>
                    <TableCell>{cilindro.sistema?.nome || 'N/A'}</TableCell>
                    <TableCell>{cilindro.capacidade || 'N/A'}</TableCell>
                    <TableCell>{cilindro.pressaoTrabalho || 'N/A'}</TableCell>
                    <TableCell>{cilindro.pressaoTeste || 'N/A'}</TableCell>
                    <TableCell>
                      <div className={isProximoTesteExpirando(cilindro.dataProximoTeste) ? 'text-red-600 font-medium' : ''}>
                        {formatDate(cilindro.dataProximoTeste)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(cilindro.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar cilindros: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Cylinder className="h-8 w-8" />
            Gestão de Cilindros
          </h1>
          <p className="text-muted-foreground">Controle de cilindros de CO2 e gases para jangadas salva-vidas</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cilindro
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número de série, tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="defeituoso">Defeituoso</SelectItem>
                <SelectItem value="expirado">Expirado</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="CO2">CO2</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="CO2/N2">CO2/N2</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seções das Prateleiras */}
      {isLoading ? (
        <div className="text-center py-8">Carregando cilindros...</div>
      ) : (
        <>
          {/* Cilindros Ativos */}
          {renderCilindrosTable(
            cilindrosAtivos,
            "Cilindros Ativos",
            "Cilindros em operação regular"
          )}

          {/* Cilindros em Manutenção */}
          {renderCilindrosTable(
            cilindrosManutencao,
            "Cilindros em Manutenção",
            "Cilindros com manutenção em curso"
          )}

          {/* Cilindros com Problemas */}
          {renderCilindrosTable(
            cilindrosProblema,
            "Cilindros com Problemas",
            "Cilindros defeituosos ou expirados"
          )}
        </>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Cylinder className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Cilindros</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cilindros Ativos</p>
                <p className="text-2xl font-bold">{cilindrosAtivos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold">{cilindrosManutencao.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Cylinder className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Com Problemas</p>
                <p className="text-2xl font-bold">{cilindrosProblema.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Cylinder className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Próximos Testes</p>
                <p className="text-2xl font-bold">{cilindros.filter((c: CilindroWithJangada) => isProximoTesteExpirando(c.dataProximoTeste)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Cilindros Defeituosos</p>
                <p className="text-2xl font-bold">{cilindros.filter((c: CilindroWithJangada) => c.status === 'defeituoso').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar novo cilindro */}
      <AddCilindroForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['cilindros'] })
          setShowAddForm(false)
        }}
      />
    </div>
  )
}

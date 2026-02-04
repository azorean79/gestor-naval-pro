'use client'

import { useState } from 'react'
import { Wrench, Search, Filter, Plus, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useObras } from '@/hooks/use-obras'
import { AddObraForm } from '@/components/obras/add-obra-form'

type ObraItem = {
  id?: string
  titulo?: string
  descricao?: string
  status?: string
  prioridade?: string
  dataInicio?: string | Date
  dataFim?: string | Date
  responsavel?: string
  cliente?: { nome?: string }
}

export default function ObrasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: obrasResponse, isLoading, refetch } = useObras({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    limit: 100
  })

  const obras: ObraItem[] = obrasResponse?.data || []

  const filteredObras = obras.filter((obra) => {
    const matchesSearch = obra.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obra.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obra.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obra.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || obra.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>
      case 'em_andamento':
        return <Badge variant="default">Em Andamento</Badge>
      case 'concluida':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluída</Badge>
      case 'atrasada':
        return <Badge variant="destructive">Atrasada</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getPrioridadeBadge = (prioridade?: string) => {
    switch (prioridade) {
      case 'alta':
        return <Badge variant="destructive">Alta</Badge>
      case 'media':
        return <Badge variant="secondary">Média</Badge>
      case 'baixa':
        return <Badge variant="outline">Baixa</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getUniqueStatuses = () => {
    const statuses = obras
      .map((obra) => obra.status)
      .filter((status): status is string => Boolean(status))
    return [...new Set(statuses)]
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Gestão de Obras
          </h1>
          <p className="text-muted-foreground">Controle de manutenções e reparos</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Obra
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
                  placeholder="Buscar por título, descrição, navio ou técnico..."
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
                {getUniqueStatuses().map(status => (
                  <SelectItem key={status} value={status}>
                    {status === 'pendente' ? 'Pendente' :
                     status === 'em_andamento' ? 'Em Andamento' :
                     status === 'concluida' ? 'Concluída' : 'Atrasada'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Wrench className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Obras</p>
                <p className="text-2xl font-bold">{obras.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">{obras.filter(o => o.status === 'em_andamento').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{obras.filter(o => o.status === 'concluida').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold">{obras.filter(o => o.status === 'atrasada').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Obras */}
      <Card>
        <CardHeader>
          <CardTitle>Obras em Andamento</CardTitle>
          <CardDescription>
            Lista completa de manutenções e reparos programados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Navio</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma obra encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredObras.map((obra) => (
                  <TableRow key={obra.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{obra.titulo}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {obra.descricao}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{obra.cliente?.nome || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Normal</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(obra.status)}
                    </TableCell>
                    <TableCell>
                      {obra.dataFim ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(obra.dataFim).toLocaleDateString('pt-PT')}</span>
                        </div>
                      ) : (
                        'Não definida'
                      )}
                    </TableCell>
                    <TableCell>{obra.responsavel || 'Não atribuído'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: obra.status === 'concluida' ? '100%' : obra.status === 'em_andamento' ? '50%' : '0%' }}
                          ></div>
                        </div>
                        <span className="text-sm">{obra.status === 'concluida' ? '100' : obra.status === 'em_andamento' ? '50' : '0'}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para adicionar nova obra */}
      <AddObraForm
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
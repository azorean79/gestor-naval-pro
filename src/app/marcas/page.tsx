'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Package, FileText } from 'lucide-react'
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
import { useMarcasJangada } from '@/hooks/use-marcas-jangada'
import { AddMarcaForm } from '@/components/marcas/add-marca-form'

type MarcaItem = {
  id?: string
  nome?: string
  descricao?: string
  status?: string
  createdAt?: string
}

export default function MarcasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMarca, setEditingMarca] = useState<any>(null)
  const { data: marcasResponse, isLoading, refetch } = useMarcasJangada({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    limit: 9999
  })

  const marcas: MarcaItem[] = marcasResponse?.data || []

  const filteredMarcas = marcas.filter((marca) => {
    const matchesSearch = marca.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         marca.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || marca.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'inativo':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Marcas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Controle e gestão das marcas de jangadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => window.location.href = '/configuracoes'} variant="outline">
            Ver Configurações Integradas
          </Button>
          <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Marca
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Marcas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marcas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marcas Ativas</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {marcas.filter(m => m.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marcas Inativas</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {marcas.filter(m => m.status === 'inativo').length}
            </div>
          </CardContent>
        </Card>
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => window.location.href = '/especificacoes'}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Especificações</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Ver</div>
            <p className="text-xs text-muted-foreground mt-1">Dados técnicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marcas ({filteredMarcas.length})</CardTitle>
          <CardDescription>
            Lista de todas as marcas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando marcas...</div>
          ) : filteredMarcas.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma marca encontrada</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Marca
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarcas.map((marca) => (
                  <TableRow key={marca.id}>
                    <TableCell className="font-medium">{marca.nome}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {marca.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(marca.status || '')}
                    </TableCell>
                    <TableCell>
                      {marca.createdAt ? new Date(marca.createdAt).toLocaleDateString('pt-PT') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.location.href = `/especificacoes?marca=${marca.nome}`}
                          title="Ver especificações técnicas"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingMarca(marca)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Marca Form Modal */}
      {(showAddForm || editingMarca) && (
        <AddMarcaForm
          marca={editingMarca}
          onClose={() => {
            setShowAddForm(false)
            setEditingMarca(null)
          }}
          onSuccess={() => {
            setShowAddForm(false)
            setEditingMarca(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
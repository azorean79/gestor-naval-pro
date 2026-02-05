'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, CheckCircle } from 'lucide-react'
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
import { useComponentesJangada } from '@/hooks/use-componentes-jangada'
import { AddComponenteForm } from '@/components/componentes/add-componente-form'

type ComponenteItem = {
  id?: string
  nome?: string
  descricao?: string
  categoria?: string
  quantidade?: number
  quantidadeMinima?: number
  precoUnitario?: number
  fornecedor?: string
  localizacao?: string
  status?: string
  createdAt?: string
}

export default function ComponentesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingComponente, setEditingComponente] = useState<any>(null)

  const { data: componentesResponse, isLoading, refetch } = useComponentesJangada({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    categoria: categoriaFilter !== 'todos' ? categoriaFilter : undefined,
    limit: 100
  })

  const componentes: ComponenteItem[] = componentesResponse?.data || []

  const filteredComponentes = componentes.filter((componente) => {
    const matchesSearch = componente.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         componente.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         componente.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || componente.status === statusFilter
    const matchesCategoria = categoriaFilter === 'todos' || componente.categoria === categoriaFilter
    return matchesSearch && matchesStatus && matchesCategoria
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>
      case 'inativo':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>
      case 'baixo_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Baixo Stock</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStockStatus = (quantidade: number, quantidadeMinima: number) => {
    if (quantidade <= quantidadeMinima) {
      return <div className="flex items-center gap-1 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span>Baixo</span>
      </div>
    }
    return <div className="flex items-center gap-1 text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span>OK</span>
    </div>
  }

  const categorias = [...new Set(componentes.map(c => c.categoria).filter(Boolean))]

  const totalComponentes = componentes.length
  const componentesAtivos = componentes.filter(c => c.status === 'ativo').length
  const componentesBaixoStock = componentes.filter(c => (c.quantidade || 0) <= (c.quantidadeMinima || 0)).length
  const valorTotalStock = componentes.reduce((sum, c) => sum + ((c.quantidade || 0) * (c.precoUnitario || 0)), 0)

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Componentes
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Controle e gestão dos componentes de jangadas
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Componente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Componentes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalComponentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Componentes Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{componentesAtivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{componentesBaixoStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">€{valorTotalStock.toLocaleString('pt-PT')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Categorias</SelectItem>
                {categorias.filter((categoria): categoria is string => Boolean(categoria)).map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="baixo_stock">Baixo Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Componentes ({filteredComponentes.length})</CardTitle>
          <CardDescription>
            Lista de todos os componentes cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando componentes...</div>
          ) : filteredComponentes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum componente encontrado</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Componente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponentes.map((componente) => (
                  <TableRow key={componente.id}>
                    <TableCell className="font-medium">{componente.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{componente.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{componente.quantidade}</span>
                        {getStockStatus(componente.quantidade || 0, componente.quantidadeMinima || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {componente.precoUnitario ? `€${componente.precoUnitario.toLocaleString('pt-PT')}` : '-'}
                    </TableCell>
                    <TableCell>{componente.fornecedor || '-'}</TableCell>
                    <TableCell>
                      {getStatusBadge(componente.status || '')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingComponente(componente)}
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

      {/* Add/Edit Componente Form Modal */}
      {(showAddForm || editingComponente) && (
        <AddComponenteForm
          componente={editingComponente}
          onClose={() => {
            setShowAddForm(false)
            setEditingComponente(null)
          }}
          onSuccess={() => {
            setShowAddForm(false)
            setEditingComponente(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
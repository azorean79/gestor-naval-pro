'use client'

import { useState } from 'react'
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react'
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
import { useModelosJangada } from '@/hooks/use-modelos-jangada'
import { useMarcasJangada } from '@/hooks/use-marcas-jangada'
import { AddModeloForm } from '@/components/modelos/add-modelo-form'

type ModeloItem = {
  id?: string
  nome?: string
  descricao?: string
  status?: string
  marca?: { nome?: string }
  createdAt?: string
}

export default function ModelosManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [marcaFilter, setMarcaFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingModelo, setEditingModelo] = useState<any>(null)

  const { data: modelosResponse, isLoading, refetch } = useModelosJangada({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    marcaId: marcaFilter !== 'todos' ? marcaFilter : undefined,
    limit: 100
  })

  const { data: marcasResponse } = useMarcasJangada({ limit: 100 })

  const modelos: ModeloItem[] = modelosResponse?.data || []
  const marcas = marcasResponse?.data || []

  const filteredModelos = modelos.filter((modelo) => {
    const matchesSearch = modelo.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         modelo.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         modelo.marca?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || modelo.status === statusFilter
    const matchesMarca = marcaFilter === 'todos' || modelo.marca?.nome === marcaFilter
    return matchesSearch && matchesStatus && matchesMarca
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Modelos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modelos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modelos Ativos</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {modelos.filter(m => m.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marcas Disponíveis</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {marcas.filter((m: any) => m.status === 'ativo').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Add Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtros e Pesquisa</CardTitle>
            <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Modelo
            </Button>
          </div>
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
            <Select value={marcaFilter} onValueChange={setMarcaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Marcas</SelectItem>
                {marcas.map((marca: any) => (
                  <SelectItem key={marca.id} value={marca.nome || ''}>
                    {marca.nome}
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
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos ({filteredModelos.length})</CardTitle>
          <CardDescription>
            Lista de todos os modelos cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando modelos...</div>
          ) : filteredModelos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum modelo encontrado</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Modelo
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModelos.map((modelo) => (
                  <TableRow key={modelo.id}>
                    <TableCell className="font-medium">{modelo.nome}</TableCell>
                    <TableCell>{modelo.marca?.nome || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {modelo.descricao || '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(modelo.status || '')}
                    </TableCell>
                    <TableCell>
                      {modelo.createdAt ? new Date(modelo.createdAt).toLocaleDateString('pt-PT') : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setEditingModelo(modelo)}
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

      {/* Add/Edit Modelo Form Modal */}
      {(showAddForm || editingModelo) && (
        <AddModeloForm
          modelo={editingModelo}
          onClose={() => {
            setShowAddForm(false)
            setEditingModelo(null)
          }}
          onSuccess={() => {
            setShowAddForm(false)
            setEditingModelo(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}

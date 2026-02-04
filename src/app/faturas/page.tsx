'use client'

import { useState } from 'react'
import { FileText, Search, Filter, Plus, Euro, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
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
import { useFaturas } from '@/hooks/use-faturas'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AddFaturaForm } from '@/components/faturas/add-fatura-form'

type FaturaItem = {
  id?: string
  numero?: string
  dataEmissao?: string | Date
  dataVencimento?: string | Date
  valor?: number
  status?: string
  descricao?: string
  cliente?: { nome?: string }
  navio?: { nome?: string }
  jangada?: { numeroSerie?: string }
}

export default function FaturasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)

  const { data: faturasResponse, isLoading, refetch } = useFaturas({
    search: searchTerm || undefined,
    status: statusFilter !== 'todos' ? statusFilter : undefined,
    limit: 100
  })

  const faturas: FaturaItem[] = faturasResponse?.data || []

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesSearch = fatura.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fatura.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fatura.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fatura.navio?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fatura.jangada?.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || fatura.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paga':
        return <Badge className="bg-green-100 text-green-800">Paga</Badge>
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'atrasada':
        return <Badge className="bg-red-100 text-red-800">Atrasada</Badge>
      case 'cancelada':
        return <Badge className="bg-gray-100 text-gray-800">Cancelada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'atrasada':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />
    }
  }

  const totalFaturas = faturas.length
  const faturasPagas = faturas.filter(f => f.status === 'paga').length
  const faturasPendentes = faturas.filter(f => f.status === 'pendente').length
  const faturasAtrasadas = faturas.filter(f => f.status === 'atrasada').length
  const valorTotal = faturas.reduce((sum, f) => sum + (f.valor || 0), 0)
  const valorPago = faturas.filter(f => f.status === 'paga').reduce((sum, f) => sum + (f.valor || 0), 0)
  const valorPendente = faturas.filter(f => f.status === 'pendente').reduce((sum, f) => sum + (f.valor || 0), 0)

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestão de Faturas
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Controle e gestão de todas as faturas do sistema
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Fatura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Faturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFaturas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{valorTotal.toLocaleString('pt-PT')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{valorPago.toLocaleString('pt-PT')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">€{valorPendente.toLocaleString('pt-PT')}</div>
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
                  placeholder="Buscar por número, descrição, cliente..."
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
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Faturas ({filteredFaturas.length})</CardTitle>
          <CardDescription>
            Lista de todas as faturas cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando faturas...</div>
          ) : filteredFaturas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma fatura encontrada</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Fatura
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Data Vencimento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaturas.map((fatura) => (
                  <TableRow key={fatura.id}>
                    <TableCell className="font-medium">{fatura.numero}</TableCell>
                    <TableCell>
                      {fatura.dataEmissao ? format(new Date(fatura.dataEmissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>
                      {fatura.dataVencimento ? format(new Date(fatura.dataVencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>
                    <TableCell>{fatura.cliente?.nome || '-'}</TableCell>
                    <TableCell className="font-medium">
                      €{fatura.valor?.toLocaleString('pt-PT') || '0'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fatura.status || '')}
                        {getStatusBadge(fatura.status || '')}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {fatura.descricao || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Fatura Form Modal */}
      {showAddForm && (
        <AddFaturaForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}
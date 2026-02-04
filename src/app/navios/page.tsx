'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Ship, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNavios, useDeleteNavio } from '@/hooks/use-navios'
import { Navio } from '@/lib/types'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ImportDialog } from '@/components/ui/import-dialog'
import { DocumentUploadDialog } from '@/components/ui/document-upload-dialog'

export default function NaviosPage() {
  const router = useRouter()
  const { data: naviosResponse, isLoading } = useNavios()
  const navios = naviosResponse?.data || []
  const deleteNavioMutation = useDeleteNavio()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  const filteredNavios = navios.filter((navio: Navio) => {
    const matchesSearch = navio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         navio.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         navio.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || navio.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este navio?')) {
      await deleteNavioMutation.mutateAsync(id)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ativo': return 'default'
      case 'manutencao': return 'destructive'
      case 'inativo': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo'
      case 'manutencao': return 'Manutenção'
      case 'inativo': return 'Inativo'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando navios...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navios</h1>
          <p className="text-muted-foreground">
            Gerencie sua frota de navios e embarcações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={() => setShowDocumentUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload com IA
          </Button>
          <Button onClick={() => router.push('/navios/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Navio
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Navios</CardTitle>
          <CardDescription>
            {filteredNavios.length} navio{filteredNavios.length !== 1 ? 's' : ''} encontrado{filteredNavios.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, matrícula ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próxima Inspeção</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNavios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum navio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNavios.map((navio: Navio) => (
                    <TableRow 
                      key={navio.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/navios/${navio.id}`)}
                    >
                      <TableCell className="font-medium">{navio.nome}</TableCell>
                      <TableCell>{navio.tipo}</TableCell>
                      <TableCell>{navio.matricula}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(navio.status)}>
                          {getStatusLabel(navio.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {navio.dataProximaInspecao
                          ? format(new Date(navio.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{navio.clienteId || '-'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/navios/${navio.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(navio.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        title="Importar Navios"
        description="Importe múltiplos navios de uma vez usando um arquivo CSV ou Excel"
        templateUrl="/templates/navios-template.csv"
        endpoint="/api/navios/import"
        onSuccess={() => {
          setShowImportDialog(false)
          window.location.reload()
        }}
      />

      <DocumentUploadDialog 
        open={showDocumentUpload}
        onOpenChange={setShowDocumentUpload}
      />
    </div>
  )
}
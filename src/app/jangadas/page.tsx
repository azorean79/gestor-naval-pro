'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, LifeBuoy, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useJangadas, useDeleteJangada } from '@/hooks/use-jangadas'
import { Jangada } from '@/lib/types'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ImportDialog } from '@/components/ui/import-dialog'
import { DocumentUploadDialog } from '@/components/ui/document-upload-dialog'
import { QuadroInspecaoUploadDialog } from '@/components/ui/quadro-inspecao-upload'

export default function JangadasPage() {
  const router = useRouter()
  const { data: jangadasResponse, isLoading } = useJangadas()
  const jangadas = jangadasResponse?.data || []
  const deleteJangadaMutation = useDeleteJangada()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDocumentUpload, setShowDocumentUpload] = useState(false)

  const filteredJangadas = jangadas.filter((jangada: Jangada) => {
    const matchesSearch = jangada.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         jangada.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (jangada.marca?.nome && jangada.marca.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (jangada.modelo?.nome && jangada.modelo.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (jangada.tipoPack && jangada.tipoPack.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'todos' || jangada.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta jangada?')) {
      await deleteJangadaMutation.mutateAsync(id)
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
        <div className="text-lg">Carregando jangadas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jangadas</h1>
          <p className="text-muted-foreground">
            Gerencie jangadas de salvamento e equipamentos de segurança
          </p>
        </div>
        <div className="flex gap-2">
          <QuadroInspecaoUploadDialog />
          <Button variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={() => setShowDocumentUpload(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload com IA
          </Button>
          <Button onClick={() => router.push('/jangadas/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Jangada
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Jangadas</CardTitle>
          <CardDescription>
            {filteredJangadas.length} jangada{filteredJangadas.length !== 1 ? 's' : ''} encontrada{filteredJangadas.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de série, marca, modelo, tipo..."
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
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Marca/Modelo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Tipo Pack</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próxima Inspeção</TableHead>
                  <TableHead className="w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJangadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma jangada encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJangadas.map((jangada: Jangada) => (
                    <TableRow key={jangada.id}>
                      <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                      <TableCell>{jangada.marca?.nome && jangada.modelo?.nome ? `${jangada.marca.nome} ${jangada.modelo.nome}` : jangada.marca?.nome || jangada.modelo?.nome || '-'}</TableCell>
                      <TableCell>{jangada.tipo}</TableCell>
                      <TableCell>{jangada.lotacao?.capacidade ? `${jangada.lotacao.capacidade} pessoas` : '-'}</TableCell>
                      <TableCell>{jangada.tipoPack || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(jangada.status)}>
                          {getStatusLabel(jangada.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {jangada.dataProximaInspecao
                          ? format(new Date(jangada.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/jangadas/${jangada.id}`)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(jangada.id)}
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
        title="Importar Jangadas"
        description="Importe múltiplas jangadas de uma vez usando um arquivo CSV ou Excel"
        templateUrl="/templates/jangadas-template.csv"
        endpoint="/api/jangadas/import"
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
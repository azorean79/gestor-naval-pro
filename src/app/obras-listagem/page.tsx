'use client'

import { useState, useEffect } from 'react'
import { Search, Briefcase, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function ObrasListagemPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [obras, setObras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await fetch('/api/obras?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setObras(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar obras:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchObras()
  }, [])

  const filteredObras = obras.filter(obra =>
    obra.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    obra.responsavel?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string): 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
    const statusMap: Record<string, 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost'> = {
      'planeada': 'outline',
      'em_curso': 'secondary',
      'concluida': 'default',
      'cancelada': 'destructive'
    }
    return statusMap[status] || 'outline'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'planeada': 'Planeada',
      'em_curso': 'Em Curso',
      'concluida': 'Concluída',
      'cancelada': 'Cancelada'
    }
    return labels[status] || status
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Listagem de Obras
          </h1>
          <p className="text-muted-foreground">Todas as obras e projetos registrados</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, cliente ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
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
                <p className="text-sm font-medium text-muted-foreground">Em Curso</p>
                <p className="text-2xl font-bold">{obras.filter(o => o.status === 'em_curso').length}</p>
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
              <AlertCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Planeadas</p>
                <p className="text-2xl font-bold">{obras.filter(o => o.status === 'planeada').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Obras</CardTitle>
          <CardDescription>
            {filteredObras.length} obra(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredObras.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma obra encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                    <TableHead>Orçamento</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredObras.map((obra) => (
                    <TableRow key={obra.id}>
                      <TableCell className="font-medium">{obra.titulo}</TableCell>
                      <TableCell className="text-sm">{obra.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-sm">{obra.responsavel || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(obra.status)}>
                          {getStatusLabel(obra.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {obra.dataInicio 
                          ? new Date(obra.dataInicio).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {obra.dataFim 
                          ? new Date(obra.dataFim).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {obra.orcamento ? `${obra.orcamento.toFixed(2)}€` : '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(obra.createdAt).toLocaleDateString('pt-PT')}
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

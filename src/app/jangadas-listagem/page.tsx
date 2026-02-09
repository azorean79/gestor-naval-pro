'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, LifeBuoy, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function JangadasListagemPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [jangadas, setJangadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJangadas = async () => {
      try {
        const response = await fetch('/api/jangadas?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setJangadas(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar jangadas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJangadas()
  }, [])

  const filteredJangadas = jangadas.filter(jangada =>
    jangada.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jangada.tipo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jangada.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jangada.navio?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
            <LifeBuoy className="h-8 w-8" />
            Listagem de Jangadas
          </h1>
          <p className="text-muted-foreground">Todas as jangadas salva-vidas registradas</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número de série, tipo, cliente ou navio..."
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
              <LifeBuoy className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{jangadas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold">{jangadas.filter(j => j.status === 'ativo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Próx. Vencimento (30 dias)</p>
                <p className="text-2xl font-bold">
                  {jangadas.filter(j => {
                    if (!j.dataProximaInspecao) return false
                    const dias = Math.floor((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return dias > 0 && dias <= 30
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">
                  {jangadas.filter(j => {
                    if (!j.dataProximaInspecao) return false
                    const dias = Math.floor((new Date(j.dataProximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return dias < 0
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Jangadas</CardTitle>
          <CardDescription>
            {filteredJangadas.length} jangada(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredJangadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma jangada encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número de Série</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Tipo Pack</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Navio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Fabricação</TableHead>
                    <TableHead>Próxima Inspeção</TableHead>
                    <TableHead>HRU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJangadas.map((jangada) => (
                    <TableRow key={jangada.id}>
                      <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                      <TableCell className="text-sm">{jangada.tipo}</TableCell>
                      <TableCell className="text-sm">{jangada.tipoPack || '-'}</TableCell>
                      <TableCell className="text-sm text-center">{jangada.capacidade || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.cliente?.nome || '-'}</TableCell>
                      <TableCell className="text-sm">{jangada.navio?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(jangada.status)}>
                          {jangada.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataFabricacao 
                          ? new Date(jangada.dataFabricacao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.dataProximaInspecao 
                          ? new Date(jangada.dataProximaInspecao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">
                        {jangada.hruAplicavel ? '✅ Sim' : '❌ Não'}
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

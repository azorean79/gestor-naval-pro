'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, ListPlus, Anchor, Ship } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function NaviosListagemPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [navios, setNavios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNavios = async () => {
      try {
        const response = await fetch('/api/navios?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setNavios(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar navios:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchNavios()
  }, [])

  const filteredNavios = navios.filter(navio =>
    navio.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    navio.matricula?.includes(searchTerm) ||
    navio.imo?.includes(searchTerm) ||
    navio.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <Ship className="h-8 w-8" />
            Listagem de Navios
          </h1>
          <p className="text-muted-foreground">Todos os navios e embarcações registrados</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, matrícula, IMO ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Ship className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Navios</p>
                <p className="text-2xl font-bold">{navios.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Anchor className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{navios.filter(n => n.status === 'ativo').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <ListPlus className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Em Manutenção</p>
                <p className="text-2xl font-bold">{navios.filter(n => n.status === 'manutencao').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Navios</CardTitle>
          <CardDescription>
            {filteredNavios.length} navio(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredNavios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum navio encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>IMO</TableHead>
                    <TableHead>MMSI</TableHead>
                    <TableHead>Bandeira</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima Inspeção</TableHead>
                    <TableHead>Tecnico</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNavios.map((navio) => (
                    <TableRow key={navio.id}>
                      <TableCell className="font-medium">{navio.nome}</TableCell>
                      <TableCell className="text-sm">{navio.tipo}</TableCell>
                      <TableCell className="text-sm">{navio.matricula || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.imo || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.mmsi || '-'}</TableCell>
                      <TableCell className="text-sm">{navio.bandeira}</TableCell>
                      <TableCell className="text-sm">{navio.cliente?.nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(navio.status)}>
                          {navio.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {navio.dataProximaInspecao 
                          ? new Date(navio.dataProximaInspecao).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">{navio.tecnico}</TableCell>
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

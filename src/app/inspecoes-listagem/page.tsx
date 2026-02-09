'use client'

import { useState, useEffect } from 'react'
import { Search, ClipboardList, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default function InspecoesListagemPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [inspecoes, setInspecoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInspecoes = async () => {
      try {
        const response = await fetch('/api/inspecoes?limit=1000')
        if (response.ok) {
          const data = await response.json()
          setInspecoes(data.data || [])
        }
      } catch (error) {
        console.error('Erro ao buscar inspeções:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchInspecoes()
  }, [])

  const filteredInspecoes = inspecoes.filter(inspecao =>
    inspecao.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspecao.tecnico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspecao.navio?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspecao.jangada?.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getResultadoBadge = (resultado: string): 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
    const badges: Record<string, 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost'> = {
      'aprovada': 'default',
      'reprovada': 'destructive',
      'pendente': 'secondary'
    }
    return badges[resultado] || 'outline'
  }

  const getStatusBadge = (status: string): 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost' => {
    const badges: Record<string, 'default' | 'link' | 'destructive' | 'outline' | 'secondary' | 'ghost'> = {
      'realizada': 'default',
      'pendente': 'secondary',
      'cancelada': 'destructive'
    }
    return badges[status] || 'outline'
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="h-8 w-8" />
            Listagem de Inspeções
          </h1>
          <p className="text-muted-foreground">Todas as inspeções realizadas e pendentes</p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, técnico, navio ou jangada..."
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
              <ClipboardList className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{inspecoes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">{inspecoes.filter(i => i.resultado === 'aprovada').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Reprovadas</p>
                <p className="text-2xl font-bold">{inspecoes.filter(i => i.resultado === 'reprovada').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{inspecoes.filter(i => i.status === 'pendente').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Inspeções</CardTitle>
          <CardDescription>
            {filteredInspecoes.length} inspeção(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredInspecoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma inspeção encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Inspeção</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Navio</TableHead>
                    <TableHead>Jangada</TableHead>
                    <TableHead>Próxima</TableHead>
                    <TableHead>Obra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspecoes.map((inspecao) => (
                    <TableRow key={inspecao.id}>
                      <TableCell className="font-medium">{inspecao.numero}</TableCell>
                      <TableCell className="text-sm">{inspecao.tipoInspecao}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(inspecao.dataInspecao).toLocaleDateString('pt-PT')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getResultadoBadge(inspecao.resultado)}>
                          {inspecao.resultado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(inspecao.status)}>
                          {inspecao.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{inspecao.tecnico}</TableCell>
                      <TableCell className="text-sm">{inspecao.navio?.nome || '-'}</TableCell>
                      <TableCell className="text-sm">{inspecao.jangada?.numeroSerie || '-'}</TableCell>
                      <TableCell className="text-sm">
                        {inspecao.dataProxima 
                          ? new Date(inspecao.dataProxima).toLocaleDateString('pt-PT')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-sm">{inspecao.obra?.titulo || '-'}</TableCell>
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

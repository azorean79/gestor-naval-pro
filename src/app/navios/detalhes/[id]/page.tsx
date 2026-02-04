'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Ship, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditNavioForm } from '@/components/navios/edit-navio-form'

export default function NavioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/navios/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar navio')
      return res.json()
    },
  })

  const { data: jangadas = [] } = useQuery({
    queryKey: ['jangadas', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas?navioId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar jangadas')
      return res.json()
    },
    enabled: !!id,
  })

  const { data: inspecoes = [] } = useQuery({
    queryKey: ['inspecoes', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes?navioId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar inspeções')
      return res.json()
    },
    enabled: !!id,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este navio?')) return
    try {
      const response = await fetch(`/api/navios/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar navio')
      toast.success('Navio eliminado com sucesso!')
      router.push('/navios')
    } catch (error) {
      toast.error('Erro ao eliminar navio')
    }
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    refetch()
    toast.success('Navio atualizado com sucesso!')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      inativo: 'bg-red-100 text-red-800',
      desativado: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-blue-100 text-blue-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/navios')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Navio não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const navio = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/navios')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Ship className="h-10 w-10 text-blue-600" />
              {navio.nome}
            </h1>
            <p className="text-gray-600 mt-2">{navio.tipo} • IMO: {navio.imo} • Matrícula: {navio.matricula}</p>
          </div>
          <div className="flex gap-2">
            <EditNavioForm 
              navio={navio} 
              open={editOpen} 
              onOpenChange={setEditOpen}
              onSuccess={handleEditSuccess}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditOpen(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <Badge className={`${getStatusColor(navio.status)} px-4 py-2 text-base`}>
            {navio.status.charAt(0).toUpperCase() + navio.status.slice(1)}
          </Badge>
        </div>

        {/* Specs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Comprimento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{navio.comprimento || '-'} <span className="text-sm text-gray-600">m</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Largura</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{navio.largura || '-'} <span className="text-sm text-gray-600">m</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Calado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{navio.calado || '-'} <span className="text-sm text-gray-600">m</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Capacidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{navio.capacidade || '-'} <span className="text-sm text-gray-600">pax</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="identificacao">Identificação</TabsTrigger>
            <TabsTrigger value="jangadas">Jangadas ({(jangadas as any)?.length || 0})</TabsTrigger>
            <TabsTrigger value="inspecoes">Inspeções ({(inspecoes as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Navio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.tipo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Comprimento</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.comprimento || '-'} m</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Largura</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.largura || '-'} m</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Calado</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.calado || '-'} m</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Capacidade</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.capacidade || '-'} passageiros</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Ano de Construção</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.anoConstrucao || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(navio.status)} mt-2`}>
                        {navio.status.charAt(0).toUpperCase() + navio.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identificacao" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Identificação do Navio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Matrícula</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{navio.matricula || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">IMO</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{navio.imo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">MMSI</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{navio.mmsi || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Call Sign</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{navio.callSign || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Bandeira</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.bandeira || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Delegação</p>
                      <p className="text-lg font-semibold text-gray-900">{navio.delegacao || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jangadas" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Jangadas Associadas</CardTitle>
                <CardDescription>{(jangadas as any)?.length || 0} jangada(s) associada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!(jangadas as any) || (jangadas as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma jangada associada a este navio</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Série</TableHead>
                        <TableHead>Fabricação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Última Inspeção</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(jangadas as any).map((j: any) => (
                        <TableRow key={j.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/jangadas/${j.id}`)}>
                          <TableCell className="font-mono">{j.numeroSerie}</TableCell>
                          <TableCell>{j.dataFabricacao ? format(new Date(j.dataFabricacao), 'dd/MM/yyyy', { locale: pt }) : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={j.status === 'ativo' ? 'default' : 'secondary'}>
                              {j.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{j.dataUltimaInspecao ? format(new Date(j.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt }) : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspecoes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Inspeções Registadas</CardTitle>
                <CardDescription>{(inspecoes as any)?.length || 0} inspeção(ões) registada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!(inspecoes as any) || (inspecoes as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma inspeção registada para este navio</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(inspecoes as any).map((i: any) => (
                        <TableRow key={i.id}>
                          <TableCell>{i.data ? format(new Date(i.data), 'dd/MM/yyyy', { locale: pt }) : '-'}</TableCell>
                          <TableCell>{i.tipo || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={i.resultado === 'aprovado' ? 'default' : 'destructive'}>
                              {i.resultado || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{i.observacoes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

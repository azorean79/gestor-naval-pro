'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Cylinder, AlertCircle, Calendar } from 'lucide-react'
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

export default function CilindroDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cilindro', id],
    queryFn: async () => {
      const res = await fetch(`/api/cilindros/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar cilindro')
      return res.json()
    },
  })

  const { data: inspecoes = [] } = useQuery({
    queryKey: ['inspecoes', 'cilindro', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes?cilindroId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar inspeções')
      return res.json()
    },
    enabled: !!id,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este cilindro?')) return
    try {
      const response = await fetch(`/api/cilindros/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar cilindro')
      toast.success('Cilindro eliminado com sucesso!')
      router.push('/cilindros')
    } catch (error) {
      toast.error('Erro ao eliminar cilindro')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      inativo: 'bg-red-100 text-red-800',
      teste: 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/cilindros')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Cilindro não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const cilindro = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/cilindros')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Cylinder className="h-10 w-10 text-cyan-600" />
              Cilindro {cilindro.numeroSerie}
            </h1>
            <p className="text-gray-600 mt-2">{cilindro.tipoCilindro?.nome} • Volume: {cilindro.volume || '-'} L</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
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
          <Badge className={`${getStatusColor(cilindro.status)} px-4 py-2 text-base`}>
            {cilindro.status.charAt(0).toUpperCase() + cilindro.status.slice(1)}
          </Badge>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-cyan-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Número de Série</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900 font-mono">{cilindro.numeroSerie}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{cilindro.volume || '-'} <span className="text-sm text-gray-600">L</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pressão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{cilindro.pressao || '-'} <span className="text-sm text-gray-600">bar</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Validade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {cilindro.dataValidade ? format(new Date(cilindro.dataValidade), 'dd/MM/yyyy', { locale: pt }) : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="manutencao">Manutenção</TabsTrigger>
            <TabsTrigger value="inspecoes">Inspeções ({(inspecoes as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Cilindro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Número de Série</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{cilindro.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Cilindro</p>
                      <p className="text-lg font-semibold text-gray-900">{cilindro.tipoCilindro?.nome || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Volume</p>
                      <p className="text-lg font-semibold text-gray-900">{cilindro.volume || '-'} L</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pressão</p>
                      <p className="text-lg font-semibold text-gray-900">{cilindro.pressao || '-'} bar</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Válvula</p>
                      <p className="text-lg font-semibold text-gray-900">{cilindro.tipoValvula?.nome || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(cilindro.status)} mt-2`}>
                        {cilindro.status.charAt(0).toUpperCase() + cilindro.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {cilindro.notas && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Notas</p>
                    <p className="text-gray-700">{cilindro.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manutencao" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Histórico de Manutenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cilindro.dataUltimaInspecao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Última Inspeção</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(cilindro.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                  )}
                  {cilindro.dataValidade && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Válido Até</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(cilindro.dataValidade), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                  )}
                </div>
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
                  <p className="text-center text-gray-500 py-8">Nenhuma inspeção registada para este cilindro</p>
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

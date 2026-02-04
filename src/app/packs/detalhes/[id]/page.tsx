'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Box, Component } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function PackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pack', id],
    queryFn: async () => {
      const res = await fetch(`/api/packs/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar pack')
      return res.json()
    },
  })

  const { data: componentes = [] } = useQuery({
    queryKey: ['componentes', 'pack', id],
    queryFn: async () => {
      const res = await fetch(`/api/packs/${id}/componentes`)
      if (!res.ok) throw new Error('Erro ao buscar componentes do pack')
      return res.json()
    },
    enabled: !!id,
  })

  const { data: jangadas = [] } = useQuery({
    queryKey: ['jangadas', 'pack', id],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas?packId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar jangadas com este pack')
      return res.json()
    },
    enabled: !!id,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este pack?')) return
    try {
      const response = await fetch(`/api/packs/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar pack')
      toast.success('Pack eliminado com sucesso!')
      router.push('/packs')
    } catch (error) {
      toast.error('Erro ao eliminar pack')
    }
  }

  const getPackIcon = (nome: string) => {
    if (nome.toLowerCase().includes('standard')) return '📦'
    if (nome.toLowerCase().includes('premium')) return '👑'
    if (nome.toLowerCase().includes('professional')) return '🏢'
    if (nome.toLowerCase().includes('advanced')) return '⚡'
    return '📦'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/packs')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Pack não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pack = data
  const totalComponentes = (componentes as any)?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/packs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Box className="h-10 w-10 text-indigo-600" />
              <span>{pack.nome}</span>
              <span className="text-3xl">{getPackIcon(pack.nome)}</span>
            </h1>
            <p className="text-gray-600 mt-2">{totalComponentes} componente(s) inclusos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-indigo-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Nome do Pack</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{pack.nome}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-violet-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Componentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{totalComponentes} <span className="text-sm text-gray-600">componente(s)</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Jangadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{(jangadas as any)?.length || 0} <span className="text-sm text-gray-600">jangada(s)</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="componentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border-b">
            <TabsTrigger value="componentes">Componentes ({totalComponentes})</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="jangadas">Jangadas ({(jangadas as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="componentes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Component className="h-5 w-5" />
                  Componentes Inclusos no Pack
                </CardTitle>
                <CardDescription>Lista completa de componentes que integram este pack</CardDescription>
              </CardHeader>
              <CardContent>
                {!(componentes as any) || (componentes as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Este pack não tem componentes associados</p>
                ) : (
                  <div className="space-y-3">
                    {(componentes as any).map((comp: any, idx: number) => (
                      <div 
                        key={comp.id} 
                        className="p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/componentes/${comp.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold">
                                {idx + 1}
                              </span>
                              {comp.nome}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{comp.categoria?.nome || '-'}</p>
                          </div>
                          <div className="ml-4">
                            <Badge variant={comp.status === 'ativo' ? 'default' : 'secondary'}>
                              {comp.status}
                            </Badge>
                          </div>
                        </div>
                        {comp.descricao && (
                          <p className="text-sm text-gray-600 mt-2">{comp.descricao}</p>
                        )}
                        <div className="flex gap-2 mt-3 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded">Código: <span className="font-mono font-semibold text-gray-700">{comp.codigo}</span></span>
                          {comp.marca && <span className="px-2 py-1 bg-gray-100 rounded">Marca: {comp.marca}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Pack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome do Pack</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{pack.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total de Componentes</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{totalComponentes}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo de Pack</p>
                      <Badge className="mt-2 bg-indigo-100 text-indigo-900">
                        {pack.tipo || 'Padrão'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className="mt-2" variant={pack.status === 'ativo' ? 'default' : 'secondary'}>
                        {pack.status || 'Ativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {pack.descricao && (
                  <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Descrição</p>
                    <p className="text-gray-700">{pack.descricao}</p>
                  </div>
                )}
                {pack.notas && (
                  <div className="mt-6 p-4 bg-violet-50 border border-violet-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Observações</p>
                    <p className="text-gray-700">{pack.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jangadas" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Jangadas com Este Pack</CardTitle>
                <CardDescription>{(jangadas as any)?.length || 0} jangada(s) utiliza(m) este pack</CardDescription>
              </CardHeader>
              <CardContent>
                {!(jangadas as any) || (jangadas as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma jangada está utilizando este pack</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Série</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Navio</TableHead>
                        <TableHead>Última Inspeção</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(jangadas as any).map((j: any) => (
                        <TableRow 
                          key={j.id} 
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => router.push(`/jangadas/${j.id}`)}
                        >
                          <TableCell className="font-mono font-semibold">{j.numeroSerie}</TableCell>
                          <TableCell>
                            <Badge variant={j.status === 'ativo' ? 'default' : 'secondary'}>
                              {j.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{j.navio?.nome || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {j.dataUltimaInspecao ? new Date(j.dataUltimaInspecao).toLocaleDateString('pt-PT') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Componentes Grid View (Optional) */}
        {(componentes as any)?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumo Visual dos Componentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(componentes as any).map((comp: any) => (
                <Card 
                  key={comp.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/componentes/${comp.id}`)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{comp.nome}</CardTitle>
                    <CardDescription className="text-xs">{comp.codigo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500">Categoria</p>
                        <p className="text-sm font-semibold text-gray-900">{comp.categoria?.nome || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Marca</p>
                        <p className="text-sm font-semibold text-gray-900">{comp.marca || '-'}</p>
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {comp.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

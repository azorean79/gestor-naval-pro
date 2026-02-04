'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Wrench, AlertCircle } from 'lucide-react'
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

export default function ComponenteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['componente', id],
    queryFn: async () => {
      const res = await fetch(`/api/componentes/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar componente')
      return res.json()
    },
  })

  const { data: localizacoes = [] } = useQuery({
    queryKey: ['localizacoes', 'componente', id],
    queryFn: async () => {
      const res = await fetch(`/api/componentes/${id}/localizacoes`)
      if (!res.ok) throw new Error('Erro ao buscar localizações')
      return res.json()
    },
    enabled: !!id,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este componente?')) return
    try {
      const response = await fetch(`/api/componentes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar componente')
      toast.success('Componente eliminado com sucesso!')
      router.push('/componentes')
    } catch (error) {
      toast.error('Erro ao eliminar componente')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/componentes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Componente não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const componente = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/componentes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Wrench className="h-10 w-10 text-red-600" />
              {componente.nome}
            </h1>
            <p className="text-gray-600 mt-2">{componente.categoria?.nome || '-'} • Código: {componente.codigo}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-red-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Código</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900 font-mono">{componente.codigo}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{componente.categoria?.nome || '-'}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{componente.tipo || '-'}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-fuchsia-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={componente.status === 'ativo' ? 'default' : 'secondary'}>
                {componente.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="localizacoes">Localizações ({(localizacoes as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Componente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-lg font-semibold text-gray-900">{componente.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Código</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{componente.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Categoria</p>
                      <p className="text-lg font-semibold text-gray-900">{componente.categoria?.nome || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo</p>
                      <p className="text-lg font-semibold text-gray-900">{componente.tipo || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Marca</p>
                      <p className="text-lg font-semibold text-gray-900">{componente.marca || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge variant={componente.status === 'ativo' ? 'default' : 'secondary'} className="mt-2">
                        {componente.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {componente.descricao && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Descrição</p>
                    <p className="text-gray-700">{componente.descricao}</p>
                  </div>
                )}
                {componente.notas && (
                  <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Notas Técnicas</p>
                    <p className="text-gray-700">{componente.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="localizacoes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Localizações</CardTitle>
                <CardDescription>{(localizacoes as any)?.length || 0} localização(ões) registada(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!(localizacoes as any) || (localizacoes as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma localização registada para este componente</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Local</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(localizacoes as any).map((l: any) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-semibold">{l.local || '-'}</TableCell>
                          <TableCell>{l.tipo || '-'}</TableCell>
                          <TableCell>{l.data ? format(new Date(l.data), 'dd/MM/yyyy', { locale: pt }) : '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{l.observacoes || '-'}</TableCell>
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

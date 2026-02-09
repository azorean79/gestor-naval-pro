'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, LifeBuoy, AlertCircle, Calendar, CheckCircle, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditJangadaForm } from '@/components/jangadas/edit-jangada-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
  // Fetch componentes associados à jangada
  const { data: componentes = [] } = useQuery({
    queryKey: ['componentes', 'jangada', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecao-componente?jangadaId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar componentes')
      return res.json()
    },
    enabled: !!id,
  })

  // Inline edit mutation
  const mutation = useMutation({
    mutationFn: async ({ componenteId, validade, estado }: { componenteId: string, validade?: string, estado?: string }) => {
      const res = await fetch(`/api/inspecao-componente/${componenteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validade, estado }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar componente')
      return res.json()
    },
  })
  // Estado local para edição inline
  const [editComponent, setEditComponent] = useState<{ [id: string]: { validade?: string, estado?: string } }>({})
  // Estados possíveis para componentes
  const estados = [
    { value: 'ok', label: '✓ OK' },
    { value: 'aviso', label: '⚠ Aviso' },
    { value: 'reparo', label: '🔧 Precisa Reparo' },
    { value: 'substituir', label: '❌ Substituir' },
  ]
        {/* Componentes Table with Inline Editing */}
        <div className="mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Componentes Associados</CardTitle>
              <CardDescription>{(componentes as any)?.length || 0} componente(s) associado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {!(componentes as any) || (componentes as any).length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum componente associado a esta jangada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(componentes as any).map((c: any) => {
                      const edit = editComponent[c.id] || {}
                      // Validação de status
                      let status = 'OK';
                      let dias = null;
                      if (c.validade) {
                        dias = Math.ceil((new Date(c.validade) - new Date()) / (1000 * 60 * 60 * 24));
                        if (dias < 0) status = 'EXPIRADO';
                        else if (dias < 365) status = 'ALERTA';
                      }
                      return (
                        <TableRow key={c.id}>
                          <TableCell>{c.nome || '-'}</TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={edit.validade ?? (c.validade ? new Date(c.validade).toISOString().slice(0, 10) : '')}
                              onChange={e => setEditComponent(prev => ({ ...prev, [c.id]: { ...prev[c.id], validade: e.target.value } }))}
                              className="w-36"
                            />
                            {status === 'EXPIRADO' && <Badge variant="destructive" className="ml-2">Expirado</Badge>}
                            {status === 'ALERTA' && <Badge variant="warning" className="ml-2">Alerta</Badge>}
                          </TableCell>
                          <TableCell>
                            <Select
                              onValueChange={value => setEditComponent(prev => ({ ...prev, [c.id]: { ...prev[c.id], estado: value } }))}
                              value={edit.estado ?? c.estado ?? ''}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {estados.map(e => (
                                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={async () => {
                                try {
                                  await mutation.mutateAsync({
                                    componenteId: c.id,
                                    validade: editComponent[c.id]?.validade,
                                    estado: editComponent[c.id]?.estado,
                                  })
                                  toast.success('Componente atualizado!')
                                  setEditComponent(prev => ({ ...prev, [c.id]: {} }))
                                  refetch()
                                } catch (err) {
                                  toast.error('Erro ao atualizar componente')
                                }
                              }}
                              disabled={mutation.isLoading}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

export default function JangadaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const numeroSerie = params.id as string
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jangada', numeroSerie],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${numeroSerie}`)
      if (!res.ok) throw new Error('Erro ao buscar jangada')
      return res.json()
    },
  })

  const { data: cilindros = [] } = useQuery({
    queryKey: ['cilindros', 'jangada', numeroSerie],
    queryFn: async () => {
      const res = await fetch(`/api/cilindros?jangadaId=${numeroSerie}`)
      if (!res.ok) throw new Error('Erro ao buscar cilindros')
      return res.json()
    },
    enabled: !!numeroSerie,
  })

  const { data: inspecoes = [] } = useQuery({
    queryKey: ['inspecoes', 'jangada', numeroSerie],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes?jangadaId=${numeroSerie}`)
      if (!res.ok) throw new Error('Erro ao buscar inspeções')
      return res.json()
    },
    enabled: !!numeroSerie,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar esta jangada?')) return
    try {
      const response = await fetch(`/api/jangadas/${numeroSerie}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar jangada')
      toast.success('Jangada eliminada com sucesso!')
      router.push('/jangadas')
    } catch (error) {
      toast.error('Erro ao eliminar jangada')
    }
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    refetch()
    toast.success('Jangada atualizada com sucesso!')
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

  const isCertificateValid = data?.dataValidadeCertificado 
    ? new Date(data.dataValidadeCertificado) > new Date() 
    : false

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/jangadas')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Jangada não encontrada
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const jangada = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/jangadas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <LifeBuoy className="h-10 w-10 text-teal-600" />
              Jangada {jangada.numeroSerie}
            </h1>
            <p className="text-gray-600 mt-2">Fabricada em {jangada.dataFabricacao ? format(new Date(jangada.dataFabricacao), 'MMMM yyyy', { locale: pt }) : '-'}</p>
          </div>
          <div className="flex gap-2">
            <EditJangadaForm 
              jangada={jangada} 
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
        <div className="mb-6 flex gap-2">
          <Badge className={`${getStatusColor(jangada.status)} px-4 py-2 text-base`}>
            {jangada.status.charAt(0).toUpperCase() + jangada.status.slice(1)}
          </Badge>
          {isCertificateValid && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-base">
              <CheckCircle className="mr-2 h-4 w-4" />
              Certificado Válido
            </Badge>
          )}
          {!isCertificateValid && jangada.dataValidadeCertificado && (
            <Badge className="bg-red-100 text-red-800 px-4 py-2 text-base">
              <AlertCircle className="mr-2 h-4 w-4" />
              Certificado Expirado
            </Badge>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-teal-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Número de Série</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900 font-mono">{jangada.numeroSerie}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-cyan-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Data de Fabricação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {jangada.dataFabricacao ? format(new Date(jangada.dataFabricacao), 'dd/MM/yyyy', { locale: pt }) : '-'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Última Inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {jangada.dataUltimaInspecao ? format(new Date(jangada.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt }) : '-'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Próxima Inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">
                {jangada.dataProximaInspecao ? format(new Date(jangada.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt }) : '-'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="certificado">Certificado</TabsTrigger>
            <TabsTrigger value="cilindros">Cilindros ({(cilindros as any)?.length || 0})</TabsTrigger>
            <TabsTrigger value="inspecoes">Inspeções ({(inspecoes as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações da Jangada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Número de Série</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{jangada.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Fabricação</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {jangada.dataFabricacao ? format(new Date(jangada.dataFabricacao), 'dd/MM/yyyy', { locale: pt }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge className={`${getStatusColor(jangada.status)} mt-2`}>
                        {jangada.status.charAt(0).toUpperCase() + jangada.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Última Inspeção</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {jangada.dataUltimaInspecao ? format(new Date(jangada.dataUltimaInspecao), 'dd/MM/yyyy', { locale: pt }) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Próxima Inspeção</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {jangada.dataProximaInspecao ? format(new Date(jangada.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificado" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Certificado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Certificado</p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">{jangada.certificado || '-'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Número do Certificado</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{jangada.numCertificado || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Válido Até</p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-lg font-semibold text-gray-900">
                          {jangada.dataValidadeCertificado ? format(new Date(jangada.dataValidadeCertificado), 'dd/MM/yyyy', { locale: pt }) : '-'}
                        </p>
                        {isCertificateValid && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {!isCertificateValid && jangada.dataValidadeCertificado && (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cilindros" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Cilindros Associados</CardTitle>
                <CardDescription>{(cilindros as any)?.length || 0} cilindro(s) associado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!(cilindros as any) || (cilindros as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum cilindro associado a esta jangada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Série</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Volume</TableHead>
                        <TableHead>Pressão</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(cilindros as any).map((c: any) => (
                        <TableRow key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/cilindros/${c.id}`)}>
                          <TableCell className="font-mono">{c.numeroSerie}</TableCell>
                          <TableCell>{c.tipoCilindro?.nome || '-'}</TableCell>
                          <TableCell>{c.volume || '-'} L</TableCell>
                          <TableCell>{c.pressao || '-'} bar</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'ativo' ? 'default' : 'secondary'}>
                              {c.status}
                            </Badge>
                          </TableCell>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Inspeções Registadas</CardTitle>
                  <CardDescription>{(inspecoes as any)?.length || 0} inspeção(ões) registada(s)</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => router.push(`/jangadas/${id}/inspecoes/quadro`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Quadro Técnico
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(`/jangadas/${id}/inspecoes/imo-solas`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    IMO SOLAS
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => router.push(`/jangadas/${id}/inspecoes/nova`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Inspeção
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!(inspecoes as any) || (inspecoes as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhuma inspeção registada para esta jangada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Técnico</TableHead>
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
                          <TableCell>{i.tecnico?.nome || '-'}</TableCell>
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

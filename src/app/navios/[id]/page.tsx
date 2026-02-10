'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Ship, Trash2, MapPin, Calendar, Anchor, Ruler, User, LifeBuoy, Shield, Plus, Search, Link, Unlink, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useNavio } from '@/hooks/use-navios'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { EditNavioForm } from '@/components/navios/edit-navio-form'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function NavioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [openEdit, setOpenEdit] = useState(false)
  const [activeTab, setActiveTab] = useState('jangadas')
  const [showAssociateDialog, setShowAssociateDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMarca, setSelectedMarca] = useState('')
  const [selectedModelo, setSelectedModelo] = useState('')
  const [newJangadaData, setNewJangadaData] = useState({
    numeroSerie: '',
    marcaId: '',
    modeloId: '',
    lotacaoId: '',
    tipo: 'bote-salva-vidas',
    estado: 'novo'
  })

  const { data: navioData, isLoading, error, refetch } = useNavio(id)
  
  // Buscar jangadas associadas ao navio
  const { data: jangadas = [] } = useQuery({
    queryKey: ['jangadas', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas?navioId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar jangadas')
      return res.json()
    },
    enabled: !!id
  })

  // Buscar jangadas disponíveis (não associadas a nenhum navio)
  const { data: jangadasDisponiveis = [] } = useQuery({
    queryKey: ['jangadas', 'disponiveis'],
    queryFn: async () => {
      const res = await fetch('/api/jangadas?status=ativo&navioId=null')
      if (!res.ok) throw new Error('Erro ao buscar jangadas disponíveis')
      return res.json()
    }
  })

  // Buscar opções para criação de jangada
  const { data: marcas = [] } = useQuery({
    queryKey: ['marcas-jangada'],
    queryFn: async () => {
      const res = await fetch('/api/marcas-jangada')
      if (!res.ok) throw new Error('Erro ao buscar marcas')
      return res.json()
    }
  })

  const { data: lotacoes = [] } = useQuery({
    queryKey: ['lotacoes-jangada'],
    queryFn: async () => {
      const res = await fetch('/api/lotacoes-jangada')
      if (!res.ok) throw new Error('Erro ao buscar lotações')
      return res.json()
    }
  })

  // Buscar modelos baseado na marca selecionada
  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos-jangada', selectedMarca],
    queryFn: async () => {
      if (!selectedMarca) return []
      const res = await fetch(`/api/modelos-jangada?marcaId=${selectedMarca}`)
      if (!res.ok) throw new Error('Erro ao buscar modelos')
      return res.json()
    },
    enabled: !!selectedMarca
  })

  // Buscar inspeções do navio
  const { data: inspecoes = [] } = useQuery({
    queryKey: ['inspecoes', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes?navioId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar inspeções')
      return res.json()
    },
    enabled: !!id
  })

  // Buscar embarcações de marítimo turístico do mesmo cliente
  const { data: embarcacoesMaritimoTuristico = [] } = useQuery({
    queryKey: ['embarcacoes-maritimo-turistico', navioData?.clienteId],
    queryFn: async () => {
      if (!navioData?.clienteId) return []
      const res = await fetch(`/api/navios?clienteId=${navioData.clienteId}&tipo=maritimo-turistica`)
      if (!res.ok) throw new Error('Erro ao buscar embarcações de marítimo turístico')
      return res.json()
    },
    enabled: !!navioData?.clienteId
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

  const handleAssociateJangada = async (jangadaId: string) => {
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navioId: id })
      })
      if (!response.ok) throw new Error('Erro ao associar jangada')
      toast.success('Jangada associada com sucesso!')
      // Refetch das queries
      window.location.reload()
    } catch (error) {
      toast.error('Erro ao associar jangada')
    }
  }

  const handleRemoveJangada = async (jangadaId: string) => {
    if (!confirm('Tem certeza que deseja remover esta jangada do navio?')) return
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ navioId: null })
      })
      if (!response.ok) throw new Error('Erro ao remover jangada')
      toast.success('Jangada removida com sucesso!')
      // Refetch das queries
      window.location.reload()
    } catch (error) {
      toast.error('Erro ao remover jangada')
    }
  }

  const handleCreateJangada = async () => {
    try {
      const response = await fetch('/api/jangadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJangadaData,
          navioId: id,
          status: 'ativo'
        })
      })
      if (!response.ok) throw new Error('Erro ao criar jangada')
      toast.success('Jangada criada e associada com sucesso!')
      setShowCreateDialog(false)
      setNewJangadaData({
        numeroSerie: '',
        marcaId: '',
        modeloId: '',
        lotacaoId: '',
        tipo: 'bote-salva-vidas',
        estado: 'novo'
      })
      // Refetch das queries
      window.location.reload()
    } catch (error) {
      toast.error('Erro ao criar jangada')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800',
      manutencao: 'bg-yellow-100 text-yellow-800',
      inativo: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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

  if (error || !navioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
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

  const navio = navioData

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

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'cargueiro': 'Cargueiro',
      'pesca-costeiro': 'Pesca Costeira',
      'pesca-local': 'Pesca Local',
      'pesca-alto-mar': 'Pesca Alto Mar',
      'pesca-arrasto': 'Pesca Arrasto',
      'pesca-cerco': 'Pesca Cerco',
      'passageiros': 'Passageiros',
      'recreativo': 'Recreativo',
      'recreio': 'Recreio',
      'iate': 'Iate',
      'maritimo-turistica': 'Marítimo Turística',
      'offshore': 'Offshore',
      'outro': 'Outro'
    }
    return tipos[tipo] || tipo
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push('/navios')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Ship className="h-8 w-8" />
            {navio.nome}
          </h1>
          <p className="text-muted-foreground">Detalhes do navio</p>
        </div>
        <Button onClick={() => setOpenEdit(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="font-medium">{navio.nome}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tipo</label>
              <p className="font-medium">{getTipoLabel(navio.tipo)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Matrícula</label>
              <p className="font-medium">{navio.matricula || 'Não informado'}</p>
            </div>
            {navio.bandeira && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Bandeira</label>
                <p className="font-medium">{navio.bandeira}</p>
              </div>
            )}
            {navio.imo && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">IMO</label>
                <p className="font-medium">{navio.imo}</p>
              </div>
            )}
            {navio.mmsi && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">MMSI</label>
                <p className="font-medium">{navio.mmsi}</p>
              </div>
            )}
            {navio.callSign && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Call Sign</label>
                <p className="font-medium">{navio.callSign}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadgeVariant(navio.status)}>
                  {getStatusLabel(navio.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Especificações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Especificações Técnicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {navio.comprimento && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                <p className="font-medium">{navio.comprimento}m</p>
              </div>
            )}
            {navio.largura && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Largura</label>
                <p className="font-medium">{navio.largura}m</p>
              </div>
            )}
            {navio.calado && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Calado</label>
                <p className="font-medium">{navio.calado}m</p>
              </div>
            )}
            {navio.capacidade && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Capacidade</label>
                <p className="font-medium">{navio.capacidade} ton</p>
              </div>
            )}
            {navio.anoConstrucao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ano de Construção</label>
                <p className="font-medium">{navio.anoConstrucao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspeções e Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Inspeções e Manutenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {navio.dataInspecao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última Inspeção</label>
                <p className="font-medium">
                  {format(new Date(navio.dataInspecao), 'dd/MM/yyyy', { locale: pt })}
                </p>
              </div>
            )}
            {navio.dataProximaInspecao && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Próxima Inspeção</label>
                <p className="font-medium">
                  {format(new Date(navio.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cliente e Proprietário */}
        {(navio.cliente || navio.proprietario) && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente e Proprietário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {navio.cliente && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                    <div className="mt-1 p-3 border rounded-lg">
                      <p className="font-medium">{navio.cliente.nome}</p>
                      {navio.cliente.email && (
                        <p className="text-sm text-muted-foreground">{navio.cliente.email}</p>
                      )}
                      {navio.cliente.telefone && (
                        <p className="text-sm text-muted-foreground">{navio.cliente.telefone}</p>
                      )}
                    </div>
                  </div>
                )}
                {navio.proprietario && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Proprietário</label>
                    <div className="mt-1 p-3 border rounded-lg">
                      <p className="font-medium">{navio.proprietario.nome}</p>
                      {navio.proprietario.email && (
                        <p className="text-sm text-muted-foreground">{navio.proprietario.email}</p>
                      )}
                      {navio.proprietario.telefone && (
                        <p className="text-sm text-muted-foreground">{navio.proprietario.telefone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs para Jangadas, Embarcações e Inspeções */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jangadas">
            <LifeBuoy className="h-4 w-4 mr-2" />
            Jangadas ({(jangadas as any)?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="embarcacoes">
            <Bot className="h-4 w-4 mr-2" />
            Embarcações MT ({(embarcacoesMaritimoTuristico as any)?.data?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="inspecoes">
            <Shield className="h-4 w-4 mr-2" />
            Inspeções ({(inspecoes as any)?.data?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Aba de Jangadas */}
        <TabsContent value="jangadas" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Jangadas Associadas ao Navio</CardTitle>
                  <CardDescription>
                    Lista de todas as jangadas (botes salva-vidas) associadas a este navio
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={showAssociateDialog} onOpenChange={setShowAssociateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Link className="h-4 w-4 mr-2" />
                        Associar Jangada
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Associar Jangada Existente</DialogTitle>
                        <DialogDescription>
                          Selecione uma jangada disponível para associar a este navio
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label htmlFor="search">Buscar por série</Label>
                            <Input
                              id="search"
                              placeholder="Digite o número de série..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor="marca">Marca</Label>
                            <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                              <SelectTrigger>
                                <SelectValue placeholder="Todas as marcas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todas as marcas</SelectItem>
                                {marcas?.data?.map((marca: any) => (
                                  <SelectItem key={marca.id} value={marca.id}>
                                    {marca.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Série</TableHead>
                                <TableHead>Marca/Modelo</TableHead>
                                <TableHead>Capacidade</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Ação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(jangadasDisponiveis as any)?.data
                                ?.filter((jangada: any) => {
                                  const matchesSearch = !searchTerm || 
                                    jangada.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase())
                                  const matchesMarca = !selectedMarca || jangada.marcaId === selectedMarca
                                  return matchesSearch && matchesMarca
                                })
                                ?.map((jangada: any) => (
                                <TableRow key={jangada.id}>
                                  <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                                  <TableCell>
                                    {jangada.marca?.nome} {jangada.modelo?.nome}
                                  </TableCell>
                                  <TableCell>{jangada.lotacao?.capacidade} pessoas</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{jangada.estado}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAssociateJangada(jangada.id)}
                                    >
                                      <Link className="h-4 w-4 mr-1" />
                                      Associar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Jangada
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Nova Jangada</DialogTitle>
                        <DialogDescription>
                          Crie uma nova jangada e associe automaticamente a este navio
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="numeroSerie">Número de Série *</Label>
                          <Input
                            id="numeroSerie"
                            value={newJangadaData.numeroSerie}
                            onChange={(e) => setNewJangadaData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                            placeholder="Ex: JNG-001"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="marca">Marca *</Label>
                            <Select 
                              value={newJangadaData.marcaId} 
                              onValueChange={(value) => {
                                setNewJangadaData(prev => ({ ...prev, marcaId: value, modeloId: '' }))
                                setSelectedMarca(value)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a marca" />
                              </SelectTrigger>
                              <SelectContent>
                                {marcas?.data?.map((marca: any) => (
                                  <SelectItem key={marca.id} value={marca.id}>
                                    {marca.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="modelo">Modelo *</Label>
                            <Select 
                              value={newJangadaData.modeloId} 
                              onValueChange={(value) => setNewJangadaData(prev => ({ ...prev, modeloId: value }))}
                              disabled={!newJangadaData.marcaId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {modelos?.data?.map((modelo: any) => (
                                  <SelectItem key={modelo.id} value={modelo.id}>
                                    {modelo.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lotacao">Capacidade *</Label>
                            <Select 
                              value={newJangadaData.lotacaoId} 
                              onValueChange={(value) => setNewJangadaData(prev => ({ ...prev, lotacaoId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a capacidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {lotacoes?.data?.map((lotacao: any) => (
                                  <SelectItem key={lotacao.id} value={lotacao.id}>
                                    {lotacao.capacidade} pessoas
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tipo">Tipo</Label>
                            <Select 
                              value={newJangadaData.tipo} 
                              onValueChange={(value) => setNewJangadaData(prev => ({ ...prev, tipo: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bote-salva-vidas">Bote Salva-Vidas</SelectItem>
                                <SelectItem value="bote-resgate">Bote de Resgate</SelectItem>
                                <SelectItem value="jangada">Jangada</SelectItem>
                                <SelectItem value="bote-livre">Bote Livre</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancelar
                          </Button>
                          <Button 
                            onClick={handleCreateJangada}
                            disabled={!newJangadaData.numeroSerie || !newJangadaData.marcaId || !newJangadaData.modeloId || !newJangadaData.lotacaoId}
                          >
                            Criar e Associar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!(jangadas as any)?.data || (jangadas as any)?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <LifeBuoy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma jangada associada a este navio</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Use os botões acima para associar jangadas existentes ou criar novas.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Série</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Próxima Inspeção</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(jangadas as any)?.data?.map((jangada: any) => (
                      <TableRow 
                        key={jangada.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/jangadas/${jangada.id}`)}
                      >
                        <TableCell className="font-medium">{jangada.numeroSerie}</TableCell>
                        <TableCell>
                          {jangada.marca?.nome} {jangada.modelo?.nome}
                        </TableCell>
                        <TableCell>{jangada.tipo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{jangada.estado}</Badge>
                        </TableCell>
                        <TableCell>{jangada.lotacao?.capacidade || 'N/A'} pessoas</TableCell>
                        <TableCell>
                          <Badge variant={jangada.status === 'ativo' ? 'default' : 'destructive'}>
                            {jangada.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {jangada.dataProximaInspecao
                            ? format(new Date(jangada.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })
                            : 'N/A'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveJangada(jangada.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Unlink className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Embarcações de Marítimo Turístico */}
        <TabsContent value="embarcacoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Embarcações de Marítimo Turístico</CardTitle>
              <CardDescription>
                Lista de embarcações de marítimo turístico do mesmo cliente/operador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(embarcacoesMaritimoTuristico as any)?.data || (embarcacoesMaritimoTuristico as any)?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma embarcação de marítimo turístico encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Este cliente não possui outras embarcações de marítimo turístico cadastradas.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Próxima Inspeção</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(embarcacoesMaritimoTuristico as any)?.data
                      ?.filter((embarcacao: any) => embarcacao.id !== id) // Excluir o navio atual
                      ?.map((embarcacao: any) => (
                      <TableRow
                        key={embarcacao.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/navios/${embarcacao.id}`)}
                      >
                        <TableCell className="font-medium">{embarcacao.nome}</TableCell>
                        <TableCell>{embarcacao.matricula || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {embarcacao.tipo === 'maritimo-turistica' ? 'Marítimo Turística' : embarcacao.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{embarcacao.capacidade ? `${embarcacao.capacidade} pessoas` : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={embarcacao.status === 'ativo' ? 'default' : 'destructive'}>
                            {embarcacao.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {embarcacao.dataProximaInspecao
                            ? format(new Date(embarcacao.dataProximaInspecao), 'dd/MM/yyyy', { locale: pt })
                            : 'N/A'}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/navios/${embarcacao.id}`)}
                          >
                            <Ship className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Inspeções */}
        <TabsContent value="inspecoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspeções Recentes</CardTitle>
              <CardDescription>
                Histórico de inspeções das jangadas deste navio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(inspecoes as any)?.data || (inspecoes as any)?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma inspeção encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jangada</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(inspecoes as any)?.data?.slice(0, 20)?.map((inspecao: any) => (
                      <TableRow key={inspecao.id}>
                        <TableCell className="font-medium">
                          {inspecao.jangada?.numeroSerie || 'N/A'}
                        </TableCell>
                        <TableCell>{inspecao.tipoInspecao}</TableCell>
                        <TableCell>
                          {format(new Date(inspecao.dataInspecao), 'dd/MM/yyyy', { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              inspecao.resultado === 'aprovada' 
                                ? 'default' 
                                : inspecao.resultado === 'reprovada' 
                                ? 'destructive' 
                                : 'secondary'
                            }
                          >
                            {inspecao.resultado}
                          </Badge>
                        </TableCell>
                        <TableCell>{inspecao.tecnico}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={inspecao.status === 'concluída' ? 'default' : 'secondary'}
                          >
                            {inspecao.status}
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
      </Tabs>
    </div>
  )
}
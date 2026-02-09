'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Ship, Trash2, MapPin, Calendar, Anchor, Ruler, User, LifeBuoy, Shield } from 'lucide-react'
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

export default function NavioDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [openEdit, setOpenEdit] = useState(false)
  const [activeTab, setActiveTab] = useState('jangadas')

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

      {/* Tabs para Jangadas e Inspeções */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jangadas">
            <LifeBuoy className="h-4 w-4 mr-2" />
            Jangadas ({(jangadas as any)?.data?.length || 0})
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
              <CardTitle>Jangadas Associadas ao Navio</CardTitle>
              <CardDescription>
                Lista de todas as jangadas (botes salva-vidas) associadas a este navio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!(jangadas as any)?.data || (jangadas as any)?.data?.length === 0 ? (
                <div className="text-center py-8">
                  <LifeBuoy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhuma jangada associada a este navio</p>
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
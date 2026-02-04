'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, User, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditClienteForm } from '@/components/clientes/edit-cliente-form'

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const res = await fetch(`/api/clientes/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar cliente')
      return res.json()
    },
  })

  const { data: navios = [] } = useQuery({
    queryKey: ['navios', 'cliente', id],
    queryFn: async () => {
      const res = await fetch(`/api/navios?clienteId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar navios')
      return res.json()
    },
    enabled: !!id,
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este cliente?')) return
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar cliente')
      toast.success('Cliente eliminado com sucesso!')
      router.push('/clientes')
    } catch (error) {
      toast.error('Erro ao eliminar cliente')
    }
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    refetch()
    toast.success('Cliente atualizado com sucesso!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/clientes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Cliente não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const cliente = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/clientes')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <User className="h-10 w-10 text-purple-600" />
              {cliente.nome}
            </h1>
            <p className="text-gray-600 mt-2">{cliente.email || '-'} • NIF: {cliente.nif || '-'}</p>
          </div>
          <div className="flex gap-2">
            <EditClienteForm 
              cliente={cliente} 
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

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-l-4 border-l-purple-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{cliente.email || '-'}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-pink-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{cliente.telefone || '-'}</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-fuchsia-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Localidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{cliente.localidade || '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="endereco">Endereço</TabsTrigger>
            <TabsTrigger value="navios">Navios ({(navios as any)?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <a href={`mailto:${cliente.email}`} className="text-lg font-semibold text-purple-600 hover:underline">
                        {cliente.email || '-'}
                      </a>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Telefone</p>
                      <a href={`tel:${cliente.telefone}`} className="text-lg font-semibold text-purple-600 hover:underline">
                        {cliente.telefone || '-'}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">NIF</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{cliente.nif || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Contacto Principal</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.contactoPrincipal || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Cargo</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.cargo || '-'}</p>
                    </div>
                  </div>
                </div>
                {cliente.notasEspeciais && (
                  <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">Notas Especiais</p>
                    <p className="text-gray-700">{cliente.notasEspeciais}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Morada</p>
                    <p className="text-lg font-semibold text-gray-900">{cliente.morada || '-'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Código Postal</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.codigoPostal || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Localidade</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.localidade || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">País</p>
                      <p className="text-lg font-semibold text-gray-900">{cliente.pais || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navios" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Navios Associados</CardTitle>
                <CardDescription>{(navios as any)?.length || 0} navio(s) associado(s)</CardDescription>
              </CardHeader>
              <CardContent>
                {!(navios as any) || (navios as any).length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Nenhum navio associado a este cliente</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(navios as any).map((n: any) => (
                        <TableRow key={n.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/navios/${n.id}`)}>
                          <TableCell className="font-semibold">{n.nome}</TableCell>
                          <TableCell>{n.tipo || '-'}</TableCell>
                          <TableCell className="font-mono">{n.matricula || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={n.status === 'ativo' ? 'default' : 'secondary'}>
                              {n.status}
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
    </div>
  )
}

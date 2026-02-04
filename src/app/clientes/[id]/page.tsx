'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { useCliente } from '@/hooks/use-clientes'
import { useAutoSaveCliente } from '@/hooks/use-autosave-cliente'
import { useJangadas } from '@/hooks/use-jangadas'
import { AutoSaveStatus } from '@/components/ui/autosave-status'
import { clienteSchema, type ClienteForm } from '@/lib/validation-schemas'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { ArrowLeft, User, Mail, Phone, MapPin, FileText, Ship, LifeBuoy, Plus } from 'lucide-react'
import { AddNavioDialog } from '@/components/clientes/add-navio-dialog'
import { AddJangadaDialog } from '@/components/clientes/add-jangada-dialog'

export default function ClienteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { data: clienteResponse, isLoading } = useCliente(id)
  const cliente = clienteResponse?.data

  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      nif: '',
    },
  })

  // Use autosave hook
  const autoSave = useAutoSaveCliente(id, form.watch())

  // Load cliente data when available
  useEffect(() => {
    if (cliente) {
      form.reset({
        nome: cliente.nome || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        endereco: cliente.endereco || '',
        nif: cliente.nif || '',
      })
    }
  }, [cliente, form])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando cliente...</div>
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cliente não encontrado</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6" />
              {cliente.nome}
            </h1>
            <p className="text-muted-foreground">
              Detalhes do cliente
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AutoSaveStatus
            isSaving={autoSave.isSaving}
            hasUnsavedChanges={autoSave.hasUnsavedChanges}
            error={autoSave.error}
            lastSaved={autoSave.lastSaved}
          />
        </div>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Editar Cliente</CardTitle>
          <CardDescription>
            As alterações são salvas automaticamente
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Nome *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do cliente" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="cliente@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+351 123 456 789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nif"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          NIF
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Morada completa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Criado em: {format(new Date(cliente.createdAt), 'dd/MM/yyyy HH:mm', { locale: pt })}</span>
                    <span>Atualizado em: {format(new Date(cliente.updatedAt), 'dd/MM/yyyy HH:mm', { locale: pt })}</span>
                  </div>
                </div>
              </form>
            </Form>
        </CardContent>
      </Card>

      {/* Navios Associados */}
      <NaviosAssociados clienteId={id} />

      {/* Jangadas Associadas */}
      <JangadasAssociadas clienteId={id} />
    </div>
  )
}

function NaviosAssociados({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [showAddDialog, setShowAddDialog] = useState(false)
  
  const { data: naviosData, refetch } = useQuery({
    queryKey: ['navios', 'cliente', clienteId],
    queryFn: async () => {
      const res = await fetch(`/api/navios?clienteId=${clienteId}`)
      if (!res.ok) throw new Error('Erro ao buscar navios')
      return res.json()
    },
    enabled: !!clienteId
  })

  const navios = naviosData?.data || []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Navios Associados
              </CardTitle>
              <CardDescription>
                Lista de navios deste cliente
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Navio
            </Button>
          </div>
        </CardHeader>
      <CardContent>
        {navios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum navio associado a este cliente</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {navios.map((navio: any) => (
              <Card 
                key={navio.id} 
                className="border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => router.push(`/navios/${navio.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{navio.nome}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Tipo: {navio.tipo}</span>
                        {navio.matricula && <span>Matrícula: {navio.matricula}</span>}
                        {navio.bandeira && <span>Bandeira: {navio.bandeira}</span>}
                      </div>
                    </div>
                    <Badge variant={navio.status === 'ativo' ? 'default' : 'secondary'}>
                      {navio.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

      <AddNavioDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        clienteId={clienteId}
        onSuccess={() => refetch()}
      />
    </>
  )
}

function JangadasAssociadas({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [showAddDialog, setShowAddDialog] = useState(false)

  const { data: jangadasData, refetch } = useJangadas({ clienteId })

  const jangadas = jangadasData || []

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                Jangadas Associadas
              </CardTitle>
              <CardDescription>
                Jangadas/botes salva-vidas deste cliente
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Jangada
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {jangadas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LifeBuoy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma jangada associada a este cliente</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {jangadas.map((jangada: any) => (
                <Card
                  key={jangada.id}
                  className="border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
                  onClick={() => router.push(`/jangadas/${jangada.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{jangada.numeroSerie}</h3>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Tipo: {jangada.tipo}</span>
                        {jangada.marca?.nome && <span>Marca: {jangada.marca.nome}</span>}
                        {jangada.navio?.nome && <span>Navio: {jangada.navio.nome}</span>}
                      </div>
                    </div>
                    <Badge variant={jangada.status === 'ativo' ? 'default' : 'secondary'}>
                      {jangada.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <AddJangadaDialog
      open={showAddDialog}
      onOpenChange={setShowAddDialog}
      clienteId={clienteId}
      onSuccess={() => {
        refetch()
        setShowAddDialog(false)
      }}
    />
  </>
  )
}
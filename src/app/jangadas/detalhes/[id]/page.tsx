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

export default function JangadaDetalhesPage() {
  const { id } = useParams()
  const router = useRouter()

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Componentes Table with Inline Editing */}
        <div className="mb-8">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle>Componentes Associados</CardTitle>
              <CardDescription>{(componentes as any)?.length || 0} componente(s) associado(s)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(componentes as any[])?.map((componente) => (
                    <TableRow key={componente.id}>
                      <TableCell className="font-medium">{componente.nome}</TableCell>
                      <TableCell>
                        {editComponent[componente.id]?.estado !== undefined ? (
                          <Select
                            value={editComponent[componente.id].estado}
                            onValueChange={(value) => setEditComponent(prev => ({
                              ...prev,
                              [componente.id]: { ...prev[componente.id], estado: value }
                            }))}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {estados.map((estado) => (
                                <SelectItem key={estado.value} value={estado.value}>
                                  {estado.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={
                            componente.estado === 'ok' ? 'default' :
                            componente.estado === 'aviso' ? 'secondary' :
                            componente.estado === 'reparo' ? 'destructive' :
                            'outline'
                          }>
                            {estados.find(e => e.value === componente.estado)?.label || componente.estado}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editComponent[componente.id]?.validade !== undefined ? (
                          <Input
                            type="date"
                            value={editComponent[componente.id].validade}
                            onChange={(e) => setEditComponent(prev => ({
                              ...prev,
                              [componente.id]: { ...prev[componente.id], validade: e.target.value }
                            }))}
                            className="w-40"
                          />
                        ) : (
                          componente.validade ? format(new Date(componente.validade), 'dd/MM/yyyy') : '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editComponent[componente.id] ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  mutation.mutate({
                                    componenteId: componente.id,
                                    validade: editComponent[componente.id].validade,
                                    estado: editComponent[componente.id].estado,
                                  }, {
                                    onSuccess: () => {
                                      setEditComponent(prev => {
                                        const newState = { ...prev }
                                        delete newState[componente.id]
                                        return newState
                                      })
                                      toast.success('Componente atualizado!')
                                    },
                                    onError: () => toast.error('Erro ao atualizar componente'),
                                  })
                                }}
                                disabled={mutation.isPending}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditComponent(prev => {
                                  const newState = { ...prev }
                                  delete newState[componente.id]
                                  return newState
                                })}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditComponent(prev => ({
                                ...prev,
                                [componente.id]: {
                                  validade: componente.validade ? format(new Date(componente.validade), 'yyyy-MM-dd') : '',
                                  estado: componente.estado
                                }
                              }))}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

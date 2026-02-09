'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Package, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StockSearchSelect } from '@/components/ui/stock-search-select'

export default function ModeloDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState('geral')
  
  // Estados para tipo de pack
  const [selectedTipoPackId, setSelectedTipoPackId] = useState<string | undefined>(undefined)
  const [isSavingTipoPack, setIsSavingTipoPack] = useState(false)
  
  // Estados para componentes
  const [selectedStockId, setSelectedStockId] = useState<string | undefined>(undefined)
  const [quantidadeComponente, setQuantidadeComponente] = useState(1)
  const [componenteObrigatorio, setComponenteObrigatorio] = useState(true)
  const [observacoesComponente, setObservacoesComponente] = useState('')
  const [editingComponente, setEditingComponente] = useState<any>(null)
  const [isSavingComponente, setIsSavingComponente] = useState(false)

  // Buscar dados do modelo
  const { data: modeloResponse, refetch: refetchModelo } = useQuery({
    queryKey: ['modelo-jangada', id],
    queryFn: async () => {
      const res = await fetch(`/api/modelos-jangada/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar modelo')
      return res.json()
    },
    enabled: !!id,
  })

  const modelo = modeloResponse?.data

  // Buscar componentes do modelo
  const { data: componentesResponse, refetch: refetchComponentes } = useQuery({
    queryKey: ['modelo-componentes', id],
    queryFn: async () => {
      const res = await fetch(`/api/modelos-jangada/${id}/componentes`)
      if (!res.ok) throw new Error('Erro ao buscar componentes')
      return res.json()
    },
    enabled: !!id,
  })

  const componentes = componentesResponse?.data || []

  // Buscar tipos de pack
  const { data: tiposPackResponse } = useQuery({
    queryKey: ['tipos-pack'],
    queryFn: async () => {
      const res = await fetch('/api/tipos-pack')
      if (!res.ok) throw new Error('Erro ao buscar tipos de pack')
      return res.json()
    },
  })

  const tiposPack = tiposPackResponse?.data || []

  // Buscar todos os itens de stock
  const { data: stockItems = [] } = useQuery({
    queryKey: ['stock-all'],
    queryFn: async () => {
      const res = await fetch('/api/stock?limit=1000')
      if (!res.ok) throw new Error('Erro ao buscar stock')
      const data = await res.json()
      return data.data || []
    },
  })

  // Atualizar tipo de pack do modelo
  const handleAtualizarTipoPack = async () => {
    if (!selectedTipoPackId) {
      toast.error('Selecione um tipo de pack')
      return
    }

    setIsSavingTipoPack(true)
    try {
      const response = await fetch(`/api/modelos-jangada/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoPackId: selectedTipoPackId }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar tipo de pack')

      toast.success('Tipo de pack atualizado')
      refetchModelo()
      setSelectedTipoPackId(undefined)
    } catch (error) {
      toast.error('Erro ao atualizar tipo de pack')
    } finally {
      setIsSavingTipoPack(false)
    }
  }

  // Adicionar componente
  const handleAdicionarComponente = async () => {
    if (!selectedStockId) {
      toast.error('Selecione um item do stock')
      return
    }

    setIsSavingComponente(true)
    try {
      const response = await fetch(`/api/modelos-jangada/${id}/componentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockId: selectedStockId,
          quantidade: quantidadeComponente,
          obrigatorio: componenteObrigatorio,
          observacoes: observacoesComponente || undefined,
        }),
      })

      if (!response.ok) throw new Error('Erro ao adicionar componente')

      toast.success('Componente adicionado ao modelo')
      setSelectedStockId(undefined)
      setQuantidadeComponente(1)
      setComponenteObrigatorio(true)
      setObservacoesComponente('')
      refetchComponentes()
    } catch (error) {
      toast.error('Erro ao adicionar componente')
    } finally {
      setIsSavingComponente(false)
    }
  }

  // Atualizar componente
  const handleAtualizarComponente = async (componenteId: string) => {
    const componente = componentes.find((c: any) => c.id === componenteId)
    if (!componente) return

    setIsSavingComponente(true)
    try {
      const response = await fetch(`/api/modelos-jangada/${id}/componentes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componenteId,
          quantidade: componente.quantidade,
          obrigatorio: componente.obrigatorio,
          observacoes: componente.observacoes,
        }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar componente')

      toast.success('Componente atualizado')
      refetchComponentes()
      setEditingComponente(null)
    } catch (error) {
      toast.error('Erro ao atualizar componente')
    } finally {
      setIsSavingComponente(false)
    }
  }

  // Remover componente
  const handleRemoverComponente = async (componenteId: string) => {
    if (!confirm('Tem certeza que deseja remover este componente?')) return

    setIsSavingComponente(true)
    try {
      const response = await fetch(`/api/modelos-jangada/${id}/componentes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componenteId }),
      })

      if (!response.ok) throw new Error('Erro ao remover componente')

      toast.success('Componente removido do modelo')
      refetchComponentes()
    } catch (error) {
      toast.error('Erro ao remover componente')
    } finally {
      setIsSavingComponente(false)
    }
  }

  if (!modelo) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/modelos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {modelo.nome}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Marca: {modelo.marca?.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geral">
            <Package className="h-4 w-4 mr-2" />
            Informação Geral
          </TabsTrigger>
          <TabsTrigger value="componentes">
            <Package className="h-4 w-4 mr-2" />
            Componentes ({componentes.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="geral" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informação do Modelo</CardTitle>
              <CardDescription>
                Detalhes e configurações do modelo de jangada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Modelo</Label>
                  <p className="text-lg font-medium">{modelo.nome}</p>
                </div>
                <div>
                  <Label>Marca</Label>
                  <p className="text-lg font-medium">{modelo.marca?.nome}</p>
                </div>
                {modelo.sistemaInsuflacao && (
                  <div>
                    <Label>Sistema de Insuflação</Label>
                    <p className="text-lg font-medium">{modelo.sistemaInsuflacao}</p>
                  </div>
                )}
                {modelo.valvulasPadrao && (
                  <div>
                    <Label>Válvulas Padrão</Label>
                    <p className="text-lg font-medium">{modelo.valvulasPadrao}</p>
                  </div>
                )}
              </div>

              {/* Tipo de Pack */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Tipo de Pack Padrão</h3>
                {modelo.tipoPack && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{modelo.tipoPack.nome}</p>
                        {modelo.tipoPack.categoria && (
                          <Badge variant="outline" className="mt-1">
                            {modelo.tipoPack.categoria}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Remover tipo de pack deste modelo?')) {
                            handleAtualizarTipoPack()
                          }
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <Label>Selecionar Tipo de Pack</Label>
                    <Select
                      value={selectedTipoPackId}
                      onValueChange={setSelectedTipoPackId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um tipo de pack" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposPack.map((tipo: any) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nome} {tipo.categoria && `(${tipo.categoria})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAtualizarTipoPack}
                    disabled={!selectedTipoPackId || isSavingTipoPack}
                  >
                    Atualizar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Componentes */}
        <TabsContent value="componentes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Componentes do Modelo</CardTitle>
              <CardDescription>
                Itens do stock que compõem este modelo de jangada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário de adicionar componente */}
              <div className="border p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-4">Adicionar Componente</h4>
                <div className="grid gap-4">
                  <div>
                    <Label>Item do Stock</Label>
                    <StockSearchSelect
                      items={stockItems}
                      value={selectedStockId}
                      onValueChange={setSelectedStockId}
                      placeholder="Pesquisar item do stock"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        value={quantidadeComponente}
                        onChange={(e) => setQuantidadeComponente(Number(e.target.value || 1))}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Checkbox
                        id="obrigatorio"
                        checked={componenteObrigatorio}
                        onCheckedChange={(checked) => setComponenteObrigatorio(checked as boolean)}
                      />
                      <Label htmlFor="obrigatorio" className="cursor-pointer">
                        Obrigatório
                      </Label>
                    </div>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      placeholder="Notas sobre este componente (opcional)"
                      value={observacoesComponente}
                      onChange={(e) => setObservacoesComponente(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAdicionarComponente}
                    disabled={!selectedStockId || isSavingComponente}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Componente
                  </Button>
                </div>
              </div>

              {/* Lista de componentes */}
              {componentes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum componente adicionado a este modelo
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Obrigatório</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentes.map((componente: any) => (
                      <TableRow key={componente.id}>
                        <TableCell className="font-medium">
                          {componente.stock?.nome}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{componente.stock?.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          {editingComponente === componente.id ? (
                            <Input
                              type="number"
                              min={1}
                              defaultValue={componente.quantidade}
                              className="w-20"
                              onChange={(e) => {
                                componente.quantidade = Number(e.target.value || 1)
                              }}
                            />
                          ) : (
                            componente.quantidade
                          )}
                        </TableCell>
                        <TableCell>
                          {editingComponente === componente.id ? (
                            <Checkbox
                              defaultChecked={componente.obrigatorio}
                              onCheckedChange={(checked) => {
                                componente.obrigatorio = checked
                              }}
                            />
                          ) : (
                            <Badge variant={componente.obrigatorio ? 'default' : 'secondary'}>
                              {componente.obrigatorio ? 'Sim' : 'Não'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {componente.observacoes || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {editingComponente === componente.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleAtualizarComponente(componente.id)}
                                  disabled={isSavingComponente}
                                >
                                  Guardar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingComponente(null)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingComponente(componente.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoverComponente(componente.id)}
                                  disabled={isSavingComponente}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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

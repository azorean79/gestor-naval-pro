'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditStockItemForm } from '@/components/stock/edit-stock-item-form'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [editOpen, setEditOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stock', id],
    queryFn: async () => {
      const res = await fetch(`/api/stock/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar item de stock')
      return res.json()
    },
  })

  const handleDelete = async () => {
    if (!confirm('Tem a certeza que deseja eliminar este item de stock?')) return
    try {
      const response = await fetch(`/api/stock/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Erro ao eliminar item')
      toast.success('Item de stock eliminado com sucesso!')
      router.push('/stock')
    } catch (error) {
      toast.error('Erro ao eliminar item de stock')
    }
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    refetch()
    toast.success('Item de stock atualizado com sucesso!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Button variant="ghost" className="mb-6" onClick={() => router.push('/stock')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              Item de stock não encontrado
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const item = data
  const totalValue = (item.quantidade || 0) * (item.precoCompra || 0)
  const lowStock = item.quantidade && item.quantidade < (item.quantidadeMinima || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/stock')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="h-10 w-10 text-amber-600" />
              {item.nome}
            </h1>
            <p className="text-gray-600 mt-2">{item.categoria?.nome || '-'} • Código: {item.codigo}</p>
          </div>
          <div className="flex gap-2">
            <EditStockItemForm 
              item={item} 
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

        {/* Alerts */}
        {lowStock && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Stock Baixo</p>
              <p className="text-sm text-red-800">A quantidade em stock está abaixo do mínimo recomendado</p>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-amber-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Quantidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{item.quantidade || 0} <span className="text-sm text-gray-600">unidades</span></p>
              {item.quantidadeMinima && (
                <p className="text-xs text-gray-500 mt-1">Mínimo: {item.quantidadeMinima}</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Preço de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{item.precoCompra?.toFixed(2) || '-'} <span className="text-sm text-gray-600">€</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Preço de Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{item.precoVenda?.toFixed(2) || '-'} <span className="text-sm text-gray-600">€</span></p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-600 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-gray-900">{totalValue.toFixed(2)} <span className="text-sm text-gray-600">€</span></p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detalhes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-b">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="informacoes">Informações Adicionais</TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações do Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Nome</p>
                      <p className="text-lg font-semibold text-gray-900">{item.nome}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Código</p>
                      <p className="text-lg font-semibold text-gray-900 font-mono">{item.codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Categoria</p>
                      <p className="text-lg font-semibold text-gray-900">{item.categoria?.nome || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quantidade em Stock</p>
                      <p className="text-lg font-semibold text-gray-900">{item.quantidade || 0} unidades</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Quantidade Mínima</p>
                      <p className="text-lg font-semibold text-gray-900">{item.quantidadeMinima || '-'} unidades</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Preço de Compra</p>
                      <p className="text-lg font-semibold text-gray-900">{item.precoCompra?.toFixed(2) || '-'} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Preço de Venda</p>
                      <p className="text-lg font-semibold text-gray-900">{item.precoVenda?.toFixed(2) || '-'} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Margem de Lucro</p>
                      {item.precoCompra && item.precoVenda ? (
                        <p className="text-lg font-semibold text-green-600">
                          {(((item.precoVenda - item.precoCompra) / item.precoCompra) * 100).toFixed(1)}%
                        </p>
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">-</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="informacoes" className="mt-6">
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Descrição</p>
                    <p className="text-lg text-gray-900 mt-1">{item.descricao || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Localização no Armazém</p>
                    <p className="text-lg text-gray-900 mt-1 font-mono">{item.localizacao || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fornecedor</p>
                    <p className="text-lg text-gray-900 mt-1">{item.fornecedor || '-'}</p>
                  </div>
                  {item.dataCadastro && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data de Cadastro</p>
                      <p className="text-lg text-gray-900 mt-1">
                        {format(new Date(item.dataCadastro), 'dd/MM/yyyy', { locale: pt })}
                      </p>
                    </div>
                  )}
                  {item.dataUltimaAtualizacao && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Última Atualização</p>
                      <p className="text-lg text-gray-900 mt-1">
                        {format(new Date(item.dataUltimaAtualizacao), 'dd/MM/yyyy HH:mm', { locale: pt })}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Package, Search, Filter, Plus, AlertTriangle, CheckCircle, Loader2, Upload, Barcode, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStock } from '@/hooks/use-stock'
import { AddStockItemForm } from '@/components/stock/add-stock-item-form'
import { EditStockItemForm } from '@/components/stock/edit-stock-item-form'
import { BulkLabelPrint } from '@/components/stock/bulk-label-print'
import { StockBarcode } from '@/components/stock/barcode-display'

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState<any>(null)
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false)

  const { data: stockData, isLoading, error, refetch } = useStock({
    search: searchTerm || undefined,
    categoria: categoriaFilter !== 'todos' ? categoriaFilter : undefined,
  })

  const stockItems = stockData?.data || []

  const filteredItems = stockItems.filter((item: any) => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.fornecedor && item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.descricao && item.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategoria = categoriaFilter === 'todos' || item.categoria === categoriaFilter
    return matchesSearch && matchesCategoria
  })

  // Helper to extract reference from description
  const extractRef = (description: string | null, prefix: string): string => {
    if (!description) return '-'
    const regex = new RegExp(`${prefix}:\\s*([^|\\-]+)`)
    const match = description.match(regex)
    return match ? match[1].trim() : '-'
  }

  // Helper to extract lote from description
  const extractLote = (description: string | null): string => {
    if (!description) return '-'
    const match = description.match(/Lote:\s*([^|\-]+)/)
    return match ? match[1].trim() : '-'
  }

  const getStatusBadge = (quantidade: number, quantidadeMinima: number) => {
    if (quantidade === 0) {
      return <Badge variant="destructive">Esgotado</Badge>
    } else if (quantidade <= quantidadeMinima) {
      return <Badge variant="destructive">Stock Baixo</Badge>
    } else {
      return <Badge variant="default">Normal</Badge>
    }
  }

  const getUniqueCategorias = (): string[] => {
    const categorias = stockItems.map((item: any) => item.categoria)
    return [...new Set(categorias)] as string[]
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600">Erro ao carregar dados do stock</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8" />
            Gestão de Stock
          </h1>
          <p className="text-muted-foreground">Controle de inventário e materiais</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkPrintModal(true)} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Etiquetas
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, categoria ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as categorias</SelectItem>
                {getUniqueCategorias().map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total de Itens</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stockItems.length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Stock Baixo</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stockItems.filter((item: any) => item.quantidade > 0 && item.quantidade <= item.quantidadeMinima).length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Esgotados</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{stockItems.filter((item: any) => item.quantidade === 0).length}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">
                    €{stockItems.reduce((total: number, item: any) => total + (item.quantidade * (item.precoVenda || item.precoUnitario || 0)), 0).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Itens em Stock</CardTitle>
          <CardDescription>
            Lista completa de materiais e equipamentos disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ref. Orey</TableHead>
                  <TableHead>Ref. Fabricante</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Código de Barras</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Compra</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell>{extractRef(item.descricao, 'Ref\\. Orey')}</TableCell>
                      <TableCell>{extractRef(item.descricao, 'Ref\\. Fabricante')}</TableCell>
                      <TableCell>{extractLote(item.descricao)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {item.codigoBarra ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{item.codigoBarra}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBarcodeItem(item)
                                setShowBarcodeModal(true)
                              }}
                            >
                              <Barcode className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não gerado</span>
                        )}
                      </TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{item.quantidade}</span>
                          {item.quantidade <= item.quantidadeMinima && item.quantidade > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (mín: {item.quantidadeMinima})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>€{item.precoUnitario ? item.precoUnitario.toFixed(2) : '-'}</TableCell>
                      <TableCell>{item.fornecedor || 'N/A'}</TableCell>
                      <TableCell>
                        {getStatusBadge(item.quantidade, item.quantidadeMinima)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingItem(item)
                            setShowEditForm(true)
                          }}
                        >
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo item */}
      <AddStockItemForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSuccess={() => {
          refetch()
          setShowAddForm(false)
        }}
      />

      {/* Modal para editar item */}
      <EditStockItemForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        item={editingItem}
        onSuccess={() => {
          refetch()
          setShowEditForm(false)
          setEditingItem(null)
        }}
      />

      {/* Modal para códigos de barras */}
      <Dialog open={showBarcodeModal} onOpenChange={setShowBarcodeModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Código de Barras</DialogTitle>
          </DialogHeader>
          {selectedBarcodeItem && (
            <StockBarcode stockItem={selectedBarcodeItem} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para impressão em lote de etiquetas */}
      <BulkLabelPrint
        stockItems={stockItems}
        open={showBulkPrintModal}
        onOpenChange={setShowBulkPrintModal}
      />
    </div>
  )
}
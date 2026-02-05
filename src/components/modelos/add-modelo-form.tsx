'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateModeloJangada, useUpdateModeloJangada } from '@/hooks/use-modelos-jangada'
import { useMarcasJangada } from '@/hooks/use-marcas-jangada'
import { useStock } from '@/hooks/use-stock'

interface AddModeloFormProps {
  modelo?: any
  onClose: () => void
  onSuccess: () => void
}

export function AddModeloForm({ modelo, onClose, onSuccess }: AddModeloFormProps) {
  const [formData, setFormData] = useState({
    nome: modelo?.nome || '',
    marcaId: modelo?.marcaId || '',
    descricao: modelo?.descricao || '',
    status: modelo?.status || 'ativo',
  })
  const [itemSearch, setItemSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantidade: number }>>({})

  const createModelo = useCreateModeloJangada()
  const updateModelo = useUpdateModeloJangada()
  const { data: marcasResponse } = useMarcasJangada({ limit: 100 })
  const { data: stockResponse, isLoading: stockLoading } = useStock({
    search: itemSearch || undefined,
    status: 'ativo',
    limit: 200,
  })

  const marcas = marcasResponse?.data || []
  const stockItems = stockResponse?.data || []
  const isEditing = !!modelo

  useEffect(() => {
    if (modelo?.itensModelo && Array.isArray(modelo.itensModelo)) {
      const initial: Record<string, { quantidade: number }> = {}
      modelo.itensModelo.forEach((item: any) => {
        if (item?.stockId) {
          initial[item.stockId] = { quantidade: item.quantidade || 1 }
        }
      })
      setSelectedItems(initial)
    }
  }, [modelo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.marcaId) {
      alert('Por favor, selecione uma marca.')
      return
    }

    try {
      const itensModelo = Object.entries(selectedItems).map(([stockId, value]) => ({
        stockId,
        quantidade: value.quantidade || 1,
      }))

      if (isEditing) {
        await updateModelo.mutateAsync({
          id: modelo.id,
          data: {
            nome: formData.nome,
            marcaId: formData.marcaId,
            descricao: formData.descricao || undefined,
            status: formData.status,
            itensModelo,
          },
        })
      } else {
        await createModelo.mutateAsync({
          nome: formData.nome,
          marcaId: formData.marcaId,
          descricao: formData.descricao || undefined,
          status: formData.status,
          itensModelo,
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Erro ao salvar modelo:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleToggleItem = (stockId: string, checked: boolean) => {
    setSelectedItems((prev) => {
      if (!checked) {
        const { [stockId]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [stockId]: { quantidade: prev[stockId]?.quantidade || 1 },
      }
    })
  }

  const handleQuantidadeChange = (stockId: string, value: string) => {
    const quantidade = Math.max(1, Number(value) || 1)
    setSelectedItems((prev) => ({
      ...prev,
      [stockId]: { quantidade },
    }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Modelo' : 'Criar Novo Modelo'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os dados do modelo de jangada. Campos marcados com * são obrigatórios.'
              : 'Preencha os dados do novo modelo de jangada. Campos marcados com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome do Modelo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Hurricane 6.0, MK6, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="marcaId">Marca *</Label>
            <Select value={formData.marcaId} onValueChange={(value) => handleInputChange('marcaId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma marca" />
              </SelectTrigger>
              <SelectContent>
                {marcas
                  .filter((marca: any) => marca.status === 'ativo')
                  .map((marca: any) => (
                    <SelectItem key={marca.id} value={marca.id}>
                      {marca.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição do modelo..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Componentes e Itens do Modelo</Label>
              <span className="text-sm text-muted-foreground">
                {Object.keys(selectedItems).length} selecionado(s)
              </span>
            </div>
            <Input
              placeholder="Buscar itens no stock..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />

            <div className="max-h-64 overflow-auto rounded-md border p-2">
              {stockLoading ? (
                <div className="text-sm text-muted-foreground">Carregando itens...</div>
              ) : stockItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">Nenhum item encontrado</div>
              ) : (
                <div className="space-y-2">
                  {stockItems.map((item: any) => {
                    const checked = !!selectedItems[item.id]
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => handleToggleItem(item.id, Boolean(value))}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.nome}</div>
                          <div className="text-xs text-muted-foreground">{item.categoria}</div>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          className="w-20"
                          value={selectedItems[item.id]?.quantidade || 1}
                          onChange={(e) => handleQuantidadeChange(item.id, e.target.value)}
                          disabled={!checked}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createModelo.isPending || updateModelo.isPending}>
              {createModelo.isPending || updateModelo.isPending 
                ? (isEditing ? 'Salvando...' : 'Criando...') 
                : (isEditing ? 'Salvar Alterações' : 'Criar Modelo')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
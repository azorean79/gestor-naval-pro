'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

  const createModelo = useCreateModeloJangada()
  const updateModelo = useUpdateModeloJangada()
  const { data: marcasResponse } = useMarcasJangada({ limit: 100 })

  const marcas = marcasResponse?.data || []
  const isEditing = !!modelo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.marcaId) {
      alert('Por favor, selecione uma marca.')
      return
    }

    try {
      if (isEditing) {
        await updateModelo.mutateAsync({
          id: modelo.id,
          data: {
            nome: formData.nome,
            marcaId: formData.marcaId,
            descricao: formData.descricao || undefined,
            status: formData.status,
          },
        })
      } else {
        await createModelo.mutateAsync({
          nome: formData.nome,
          marcaId: formData.marcaId,
          descricao: formData.descricao || undefined,
          status: formData.status,
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
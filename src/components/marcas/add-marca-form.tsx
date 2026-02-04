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
import { useCreateMarcaJangada, useUpdateMarcaJangada } from '@/hooks/use-marcas-jangada'

interface AddMarcaFormProps {
  marca?: any
  onClose: () => void
  onSuccess: () => void
}

export function AddMarcaForm({ marca, onClose, onSuccess }: AddMarcaFormProps) {
  const [formData, setFormData] = useState({
    nome: marca?.nome || '',
    descricao: marca?.descricao || '',
    status: marca?.status || 'ativo',
  })

  const createMarca = useCreateMarcaJangada()
  const updateMarca = useUpdateMarcaJangada()
  const isEditing = !!marca

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing) {
        await updateMarca.mutateAsync({
          id: marca.id,
          data: {
            nome: formData.nome,
            descricao: formData.descricao || undefined,
            status: formData.status,
          },
        })
      } else {
        await createMarca.mutateAsync({
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          status: formData.status,
        })
      }
      onSuccess()
    } catch (error) {
      console.error('Erro ao salvar marca:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Marca' : 'Criar Nova Marca'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os dados da marca de jangada. Campos marcados com * são obrigatórios.'
              : 'Preencha os dados da nova marca de jangada. Campos marcados com * são obrigatórios.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da Marca *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              placeholder="Ex: Zodiac, Avon, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da marca..."
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
            <Button type="submit" disabled={createMarca.isPending || updateMarca.isPending}>
              {createMarca.isPending || updateMarca.isPending 
                ? (isEditing ? 'Salvando...' : 'Criando...') 
                : (isEditing ? 'Salvar Alterações' : 'Criar Marca')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
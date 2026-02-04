'use client'

import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SelectWithAddProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder: string
  options: Array<{ id: string; nome: string }>
  onAddNew: (nome: string) => Promise<void>
  loading?: boolean
  disabled?: boolean
}

export default function SelectWithAdd({
  value,
  onValueChange,
  placeholder,
  options,
  onAddNew,
  loading = false,
  disabled = false,
}: SelectWithAddProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddNew = async () => {
    if (!newItemName.trim()) return

    try {
      setIsAdding(true)
      await onAddNew(newItemName.trim())
      setNewItemName('')
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error adding new item:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            title="Adicionar novo"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo</DialogTitle>
            <DialogDescription>
              Digite o nome do novo item para adicionar à lista.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-item-name">Nome</Label>
              <Input
                id="new-item-name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Digite o nome..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNew()
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAddNew}
                disabled={!newItemName.trim() || isAdding}
              >
                {isAdding ? (
                  'Adicionando...'
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

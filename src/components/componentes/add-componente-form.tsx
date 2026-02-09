'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { useCreateComponenteJangada, useUpdateComponenteJangada } from '@/hooks/use-componentes-jangada'
import { toast } from 'sonner'

const componenteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  quantidade: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  quantidadeMinima: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0'),
  precoUnitario: z.number().min(0, 'Preço unitário deve ser maior ou igual a 0').optional(),
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  codigoFabricante: z.string().optional(),
  referenciaOrey: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'baixo_stock']),
})

type ComponenteFormData = z.infer<typeof componenteSchema>

interface AddComponenteFormProps {
  componente?: any
  onClose: () => void
  onSuccess: () => void
}

export function AddComponenteForm({ componente, onClose, onSuccess }: AddComponenteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createComponente = useCreateComponenteJangada()
  const updateComponente = useUpdateComponenteJangada()
  const isEditing = !!componente

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ComponenteFormData>({
    resolver: zodResolver(componenteSchema),
    defaultValues: {
      nome: componente?.nome || '',
      descricao: componente?.descricao || '',
      categoria: componente?.categoria || '',
      quantidade: componente?.quantidade || 0,
      quantidadeMinima: componente?.quantidadeMinima || 0,
      precoUnitario: componente?.precoUnitario || undefined,
      fornecedor: componente?.fornecedor || '',
      localizacao: componente?.localizacao || '',
      codigoFabricante: componente?.codigoFabricante || '',
      referenciaOrey: componente?.referenciaOrey || '',
      status: componente?.status || 'ativo',
    },
  })

  const onSubmit = async (data: ComponenteFormData) => {
    try {
      setIsSubmitting(true)
      if (isEditing) {
        await updateComponente.mutateAsync({
          id: componente.id,
          data: data,
        })
        toast.success('Componente atualizado com sucesso!')
      } else {
        await createComponente.mutateAsync(data)
        toast.success('Componente criado com sucesso!')
      }
      onSuccess()
    } catch (error) {
      console.error('Erro ao salvar componente:', error)
      toast.error('Erro ao salvar componente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categorias = [
    'Estrutura',
    'Equipamento de Segurança',
    'Sistema de Flutuação',
    'Acessórios',
    'Manutenção',
    'Eletrônicos',
    'Outros'
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Componente' : 'Adicionar Novo Componente'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite os dados do componente de jangada.'
              : 'Preencha os dados do novo componente de jangada.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Ex: Motor de Popa, Coletes Salva-Vidas..."
              />
              {errors.nome && (
                <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Select onValueChange={(value) => setValue('categoria', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-red-600 mt-1">{errors.categoria.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select onValueChange={(value: 'ativo' | 'inativo' | 'baixo_stock') => setValue('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="baixo_stock">Baixo Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quantidade */}
            <div>
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="0"
                {...register('quantidade', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.quantidade && (
                <p className="text-sm text-red-600 mt-1">{errors.quantidade.message}</p>
              )}
            </div>

            {/* Quantidade Mínima */}
            <div>
              <Label htmlFor="quantidadeMinima">Quantidade Mínima</Label>
              <Input
                id="quantidadeMinima"
                type="number"
                min="0"
                {...register('quantidadeMinima', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.quantidadeMinima && (
                <p className="text-sm text-red-600 mt-1">{errors.quantidadeMinima.message}</p>
              )}
            </div>

            {/* Preço Unitário */}
            <div>
              <Label htmlFor="precoUnitario">Preço Unitário (€)</Label>
              <Input
                id="precoUnitario"
                type="number"
                min="0"
                step="0.01"
                {...register('precoUnitario', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.precoUnitario && (
                <p className="text-sm text-red-600 mt-1">{errors.precoUnitario.message}</p>
              )}
            </div>

            {/* Fornecedor */}
            <div>
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                {...register('fornecedor')}
                placeholder="Nome do fornecedor"
              />
            </div>

            {/* Código Fabricante */}
            <div>
              <Label htmlFor="codigoFabricante">Código Fabricante</Label>
              <Input
                id="codigoFabricante"
                {...register('codigoFabricante')}
                placeholder="Ex: 12345ABC"
              />
            </div>

            {/* Referência OREY */}
            <div>
              <Label htmlFor="referenciaOrey">Referência OREY</Label>
              <Input
                id="referenciaOrey"
                {...register('referenciaOrey')}
                placeholder="Ex: OY-123456"
              />
            </div>

            {/* Localização */}
            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                {...register('localizacao')}
                placeholder="Armazém, prateleira, etc."
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              {...register('descricao')}
              placeholder="Descrição detalhada do componente..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (isEditing ? 'Salvando...' : 'Criando...') 
                : (isEditing ? 'Salvar Alterações' : 'Criar Componente')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ImageUpload, useImageUpload } from '@/components/ui/image-upload'
import { useUpdateStockItem } from '@/hooks/use-stock'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Schema de validação para editar item ao stock
const editStockItemSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  referenciaOrey: z.string().optional(),
  referenciaFabricante: z.string().optional(),
  lote: z.string().optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  quantidade: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  quantidadeMinima: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a 0'),
  precoCompra: z.number().min(0, 'Preço de compra deve ser maior ou igual a 0').optional(),
  precoVenda: z.number().min(0, 'Preço de venda deve ser maior ou igual a 0').optional(),
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  descricao: z.string().optional(),
  imagem: z.string().optional(),
  status: z.string().optional(),
})

type EditStockItemFormData = z.infer<typeof editStockItemSchema>

interface EditStockItemFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: any
  onSuccess?: () => void
}

// Categorias disponíveis
const CATEGORIAS = [
  'Componentes Jangada',
  'Equipamento de Segurança',
  'Sinalização',
  'Iluminação',
  'Ferramentas',
  'Material de Limpeza',
  'Utensílios',
  'Equipamento de Sobrevivência',
  'Documentação',
  'Material de Reparação',
  'Equipamento Náutico',
  'EPIs',
  'Outros'
]

export function EditStockItemForm({ open, onOpenChange, item, onSuccess }: EditStockItemFormProps) {
  const updateMutation = useUpdateStockItem()
  const [imagePreview, setImagePreview] = useState('')

  const form = useForm<EditStockItemFormData>({
    resolver: zodResolver(editStockItemSchema),
    defaultValues: {
      nome: '',
      referenciaOrey: '',
      referenciaFabricante: '',
      lote: '',
      categoria: '',
      quantidade: 0,
      quantidadeMinima: 1,
      precoCompra: undefined,
      precoVenda: undefined,
      fornecedor: '',
      localizacao: '',
      descricao: '',
      imagem: '',
      status: 'ativo',
    },
  })

  // Preencher o formulário quando o item muda
  useEffect(() => {
    if (item) {
      form.reset({
        nome: item.nome || '',
        referenciaOrey: item.refOrey || '',
        referenciaFabricante: item.refFabricante || '',
        lote: item.lote || '',
        categoria: item.categoria || '',
        quantidade: item.quantidade || 0,
        quantidadeMinima: item.quantidadeMinima || 1,
        precoCompra: item.precoUnitario || undefined,
        precoVenda: undefined,
        fornecedor: item.fornecedor || '',
        localizacao: item.localizacao || '',
        descricao: item.descricao || '',
        imagem: item.imagem || '',
        status: item.status || 'ativo',
      })
      setImagePreview(item.imagem || '')
    }
  }, [item, form])

  const onSubmit = async (data: EditStockItemFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ...data,
        }
      })

      toast.success('Item atualizado com sucesso!')
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar item do stock')
    }
  }

  // Handler para colar imagem (Ctrl+V)
  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault()
          const file = item.getAsFile()
          if (file) {
            const { uploadImage } = useImageUpload();
            uploadImage(file).then(url => {
              form.setValue('imagem', url);
              setImagePreview(url);
            });
          }
          break
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onPaste={handlePaste}>
        <DialogHeader>
          <DialogTitle>Editar Item do Stock</DialogTitle>
          <DialogDescription>
            Edite as informações do item no inventário do stock
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="referenciaOrey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ref. Orey</FormLabel>
                    <FormControl>
                      <Input placeholder="Referência Orey" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenciaFabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ref. Fabricante</FormLabel>
                    <FormControl>
                      <Input placeholder="Referência do fabricante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Número do lote" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidadeMinima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="precoCompra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Compra (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precoVenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fornecedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Localização no armazém" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do item"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de upload de imagem */}
            <div className="space-y-2">
              <Label>Imagem do Item (Opcional)</Label>
              <ImageUpload
                currentImage={imagePreview}
                onImageUpload={async (file) => {
                  const { uploadImage } = useImageUpload();
                  const url = await uploadImage(file);
                  form.setValue('imagem', url);
                  setImagePreview(url);
                  return url;
                }}
                onImageRemove={() => {
                  form.setValue('imagem', '');
                  setImagePreview('');
                }}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
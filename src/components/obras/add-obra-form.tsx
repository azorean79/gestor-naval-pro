'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClientes } from '@/hooks/use-clientes'
import { useCreateObra } from '@/hooks/use-obras'
import { toast } from 'sonner'

interface AddObraFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddObraForm({ open, onOpenChange, onSuccess }: AddObraFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'planeada',
    dataInicio: '',
    dataFim: '',
    orcamento: '',
    clienteId: '',
    responsavel: ''
  })

  const { data: clientesResponse } = useClientes({ limit: 100 })
  const createObra = useCreateObra()

  const clientes = clientesResponse?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await createObra.mutateAsync({
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        status: formData.status,
        dataInicio: formData.dataInicio || undefined,
        dataFim: formData.dataFim || undefined,
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : undefined,
        clienteId: formData.clienteId || undefined,
        responsavel: formData.responsavel || undefined,
      })

      toast.success('Obra criada com sucesso!')
      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        titulo: '',
        descricao: '',
        status: 'planeada',
        dataInicio: '',
        dataFim: '',
        orcamento: '',
        clienteId: '',
        responsavel: ''
      })
    } catch (error) {
      console.error('Erro ao criar obra:', error)
      toast.error('Erro ao criar obra')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Obra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título da Obra</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Nome da obra"
              required
            />
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição detalhada da obra"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planeada">Planeada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="orcamento">Orçamento (€)</Label>
              <Input
                id="orcamento"
                type="number"
                step="0.01"
                value={formData.orcamento}
                onChange={(e) => handleInputChange('orcamento', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={formData.dataFim}
                onChange={(e) => handleInputChange('dataFim', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clienteId">Cliente (opcional)</Label>
              <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente: any) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Input
                id="responsavel"
                value={formData.responsavel}
                onChange={(e) => handleInputChange('responsavel', e.target.value)}
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Obra'}
            </Button>
          </div>

          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={async () => {
              // Chama endpoint para download do Word
              const clienteId = formData.clienteId;
              const res = await fetch(`/api/obras/baixar-iva?clienteId=${clienteId}`);
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `declaracao-iva-obra-${clienteId}.docx`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
          >
            Baixar Declaração de IVA
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
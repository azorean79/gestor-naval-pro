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
import { useCreateFatura } from '@/hooks/use-faturas'
import { useClientes } from '@/hooks/use-clientes'
import { useNavios } from '@/hooks/use-navios'
import { useJangadas } from '@/hooks/use-jangadas'
import { format } from 'date-fns'

interface AddFaturaFormProps {
  onClose: () => void
  onSuccess: () => void
}

export function AddFaturaForm({ onClose, onSuccess }: AddFaturaFormProps) {
  const [formData, setFormData] = useState({
    numero: '',
    dataEmissao: format(new Date(), 'yyyy-MM-dd'),
    dataVencimento: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 dias
    valor: '',
    status: 'pendente',
    descricao: '',
    clienteId: '',
    navioId: '',
    jangadaId: '',
  })

  const createFatura = useCreateFatura()
  const { data: clientesResponse } = useClientes({ limit: 100 })
  const { data: naviosResponse } = useNavios({ limit: 100 })
  const { data: jangadasResponse } = useJangadas({ limit: 100 })

  const clientes = clientesResponse?.data || []
  const navios = naviosResponse?.data || []
  const jangadas = jangadasResponse?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createFatura.mutateAsync({
        numero: formData.numero,
        dataEmissao: formData.dataEmissao,
        dataVencimento: formData.dataVencimento,
        valor: parseFloat(formData.valor),
        status: formData.status,
        descricao: formData.descricao || undefined,
        clienteId: formData.clienteId || undefined,
        navioId: formData.navioId || undefined,
        jangadaId: formData.jangadaId || undefined,
      })
      onSuccess()
    } catch (error) {
      console.error('Erro ao criar fatura:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-fill related fields when cliente is selected
    if (field === 'clienteId' && value) {
      const cliente = clientes.find((c: any) => c.id === value)
      if (cliente) {
        // Clear navio and jangada when cliente changes
        setFormData(prev => ({ ...prev, clienteId: value, navioId: '', jangadaId: '' }))
      }
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Fatura</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova fatura. Campos marcados com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">Número da Fatura *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="FAT-2024-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="valor">Valor (€) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => handleInputChange('valor', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataEmissao">Data de Emissão *</Label>
              <Input
                id="dataEmissao"
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => handleInputChange('dataEmissao', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="clienteId">Cliente</Label>
            <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
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

          {formData.clienteId && (
            <>
              <div>
                <Label htmlFor="navioId">Navio (opcional)</Label>
                <Select value={formData.navioId} onValueChange={(value) => handleInputChange('navioId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um navio" />
                  </SelectTrigger>
                  <SelectContent>
                    {navios
                      .filter((navio: any) => navio.clienteId === formData.clienteId)
                      .map((navio: any) => (
                        <SelectItem key={navio.id} value={navio.id}>
                          {navio.nome} ({navio.matricula})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jangadaId">Jangada (opcional)</Label>
                <Select value={formData.jangadaId} onValueChange={(value) => handleInputChange('jangadaId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma jangada" />
                  </SelectTrigger>
                  <SelectContent>
                    {jangadas
                      .filter((jangada: any) => jangada.clienteId === formData.clienteId)
                      .map((jangada: any) => (
                        <SelectItem key={jangada.id} value={jangada.id}>
                          {jangada.numeroSerie} - {jangada.tipo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descrição da fatura..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createFatura.isPending}>
              {createFatura.isPending ? 'Criando...' : 'Criar Fatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
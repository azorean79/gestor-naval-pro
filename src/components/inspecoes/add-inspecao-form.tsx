'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useInspecoes } from '@/hooks/use-inspecoes'
import { useNavios } from '@/hooks/use-navios'
import { useJangadas } from '@/hooks/use-jangadas'
import { useCilindros } from '@/hooks/use-cilindros'
import { toast } from 'sonner'

interface AddInspecaoFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddInspecaoForm({ open, onOpenChange, onSuccess }: AddInspecaoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipoInspecao: '',
    resultado: 'aprovada',
    observacoes: '',
    tecnicoResponsavel: '',
    navioId: '',
    jangadaId: '',
    cilindroId: '',
    dataProxima: '',
    criarCronograma: false,
    frequenciaManutencao: '',
    tipoManutencao: 'preventiva',
    tituloCronograma: '',
    custoEstimado: '',
    responsavelManutencao: ''
  })

  const { data: naviosResponse } = useNavios({ limit: 100 })
  const { data: jangadasResponse } = useJangadas({ limit: 100 })
  const { data: cilindrosResponse } = useCilindros({ limit: 100 })

  const navios = naviosResponse?.data || []
  const jangadas = jangadasResponse?.data || []
  const cilindros = cilindrosResponse?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar inspeção')
      }

      toast.success('Inspeção criada com sucesso!')
      onOpenChange(false)
      onSuccess?.()

      // Reset form
      setFormData({
        tipoInspecao: '',
        resultado: 'aprovada',
        observacoes: '',
        tecnicoResponsavel: '',
        navioId: '',
        jangadaId: '',
        cilindroId: '',
        dataProxima: '',
        criarCronograma: false,
        frequenciaManutencao: '',
        tipoManutencao: 'preventiva',
        tituloCronograma: '',
        custoEstimado: '',
        responsavelManutencao: ''
      })
    } catch (error) {
      console.error('Erro ao criar inspeção:', error)
      toast.error('Erro ao criar inspeção')
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
          <DialogTitle>Nova Inspeção</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipoInspecao">Tipo de Inspeção</Label>
              <Select value={formData.tipoInspecao} onValueChange={(value) => handleInputChange('tipoInspecao', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rotineira">Rotineira</SelectItem>
                  <SelectItem value="emergencial">Emergencial</SelectItem>
                  <SelectItem value="periodica">Periódica</SelectItem>
                  <SelectItem value="reparacao">Reparação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resultado">Resultado</Label>
              <Select value={formData.resultado} onValueChange={(value) => handleInputChange('resultado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="reprovada">Reprovada</SelectItem>
                  <SelectItem value="condicional">Condicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tecnicoResponsavel">Técnico Responsável</Label>
            <Input
              id="tecnicoResponsavel"
              value={formData.tecnicoResponsavel}
              onChange={(e) => handleInputChange('tecnicoResponsavel', e.target.value)}
              placeholder="Nome do técnico"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="navioId">Navio (opcional)</Label>
              <Select value={formData.navioId} onValueChange={(value) => handleInputChange('navioId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um navio" />
                </SelectTrigger>
                <SelectContent>
                  {navios.map((navio: any) => (
                    <SelectItem key={navio.id} value={navio.id}>
                      {navio.nome}
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
                  {jangadas.map((jangada: any) => (
                    <SelectItem key={jangada.id} value={jangada.id}>
                      {jangada.numeroSerie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cilindroId">Cilindro (opcional)</Label>
              <Select value={formData.cilindroId} onValueChange={(value) => handleInputChange('cilindroId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cilindro" />
                </SelectTrigger>
                <SelectContent>
                  {cilindros.map((cilindro: any) => (
                    <SelectItem key={cilindro.id} value={cilindro.id}>
                      {cilindro.numeroSerie}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações da inspeção"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataProxima">Data Próxima Inspeção</Label>
              <Input
                id="dataProxima"
                type="date"
                value={formData.dataProxima}
                onChange={(e) => handleInputChange('dataProxima', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="custoEstimado">Custo Estimado (€)</Label>
              <Input
                id="custoEstimado"
                type="number"
                step="0.01"
                value={formData.custoEstimado}
                onChange={(e) => handleInputChange('custoEstimado', e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="criarCronograma"
              checked={formData.criarCronograma}
              onChange={(e) => handleInputChange('criarCronograma', e.target.checked)}
            />
            <Label htmlFor="criarCronograma">Criar cronograma de manutenção automático</Label>
          </div>

          {formData.criarCronograma && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="tituloCronograma">Título do Cronograma</Label>
                <Input
                  id="tituloCronograma"
                  value={formData.tituloCronograma}
                  onChange={(e) => handleInputChange('tituloCronograma', e.target.value)}
                  placeholder="Título da manutenção"
                />
              </div>

              <div>
                <Label htmlFor="tipoManutencao">Tipo de Manutenção</Label>
                <Select value={formData.tipoManutencao} onValueChange={(value) => handleInputChange('tipoManutencao', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventiva">Preventiva</SelectItem>
                    <SelectItem value="corretiva">Corretiva</SelectItem>
                    <SelectItem value="preditiva">Preditiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="frequenciaManutencao">Frequência</Label>
                <Select value={formData.frequenciaManutencao} onValueChange={(value) => handleInputChange('frequenciaManutencao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsavelManutencao">Responsável Manutenção</Label>
                <Input
                  id="responsavelManutencao"
                  value={formData.responsavelManutencao}
                  onChange={(e) => handleInputChange('responsavelManutencao', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Inspeção'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
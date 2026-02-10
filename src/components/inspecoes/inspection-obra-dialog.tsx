'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Link2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface InspectionObraDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jangadaId: string
  numeroSerie: string
}

export function InspectionObraDialog({
  open,
  onOpenChange,
  jangadaId,
  numeroSerie,
}: InspectionObraDialogProps) {
  const router = useRouter()
  const [tipoObra, setTipoObra] = useState<'nova' | 'existente' | ''>('')
  const [obraId, setObraId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const { data: obras = [] } = useQuery({
    queryKey: ['obras-jangada', jangadaId],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${jangadaId}/obras`)
      if (!res.ok) throw new Error('Erro ao buscar obras')
      return res.json()
    },
    enabled: tipoObra === 'existente',
  })

  const handleContinuar = async () => {
    if (!tipoObra) {
      toast.error('Selecione o tipo de obra')
      return
    }

    if (tipoObra === 'existente' && !obraId) {
      toast.error('Selecione uma obra existente')
      return
    }

    setIsLoading(true)
    try {
      // Criar inspeção
      const inspectionRes = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jangadaId,
          tipo: 'completa',
          status: 'em_progresso',
          dataInicio: new Date().toISOString(),
          obraId: tipoObra === 'existente' ? obraId : null,
          criarCronograma: false, // Não criar agendamentos automáticos
        }),
      })

      if (!inspectionRes.ok) {
        throw new Error('Erro ao criar inspeção')
      }

      const inspecao = await inspectionRes.json()
      toast.success('Inspeção iniciada com sucesso!')
      onOpenChange(false)

      // Redirecionar para checklist
      setTimeout(() => {
        router.push(
          `/inspecoes/${inspecao.id}/checklist?obraType=${tipoObra}${
            tipoObra === 'existente' ? `&obraId=${obraId}` : ''
          }`
        )
      }, 500)
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao iniciar inspeção'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleNovaObra = async () => {
    setIsLoading(true)
    try {
      // Criar nova obra
      const obraRes = await fetch('/api/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jangadaId,
          tipo: 'inspecao',
          dataInicio: new Date().toISOString(),
          status: 'em_progresso',
        }),
      })

      if (!obraRes.ok) {
        throw new Error('Erro ao criar obra')
      }

      const obra = await obraRes.json()

      // Criar inspeção
      const inspectionRes = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jangadaId,
          tipo: 'completa',
          status: 'em_progresso',
          dataInicio: new Date().toISOString(),
          obraId: obra.id,
        }),
      })

      if (!inspectionRes.ok) {
        throw new Error('Erro ao criar inspeção')
      }

      const inspecao = await inspectionRes.json()
      toast.success('Obra e inspeção criadas com sucesso!')
      onOpenChange(false)

      // Redirecionar para checklist
      setTimeout(() => {
        router.push(
          `/inspecoes/${inspecao.id}/checklist?obraType=nova&obraId=${obra.id}`
        )
      }, 500)
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar obra'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Iniciar Inspeção
          </DialogTitle>
          <DialogDescription>
            Defina como deseja associar a inspeção a uma obra
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Jangada Info */}
          <Card className="bg-slate-50 p-4 border-blue-200">
            <p className="text-sm font-medium text-slate-600">Jangada</p>
            <p className="text-lg font-semibold text-slate-900">{numeroSerie}</p>
          </Card>

          {/* Tipo de Obra */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">
              Tipo de Obra
            </label>

            {/* Opção 1: Obra Nova */}
            <Card
              className={`p-4 cursor-pointer transition-all border-2 ${
                tipoObra === 'nova'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTipoObra('nova')}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Obra Nova</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Criar uma nova obra de inspeção para esta jangada
                  </p>
                </div>
                <div className="pt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      tipoObra === 'nova'
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {tipoObra === 'nova' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Opção 2: Juntar a Existente */}
            <Card
              className={`p-4 cursor-pointer transition-all border-2 ${
                tipoObra === 'existente'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTipoObra('existente')}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">
                      Juntar a Obra Existente
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Associar inspeção a uma obra já em progresso
                  </p>

                  {tipoObra === 'existente' && (
                    <div className="mt-3 space-y-2">
                      <Select value={obraId} onValueChange={setObraId}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione uma obra..." />
                        </SelectTrigger>
                        <SelectContent>
                          {obras.length === 0 ? (
                            <div className="p-2 text-sm text-gray-500">
                              Nenhuma obra em progresso
                            </div>
                          ) : (
                            obras.map((obra: any) => (
                              <SelectItem key={obra.id} value={obra.id}>
                                <div className="flex items-center gap-2">
                                  <span>{obra.tipo}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {new Date(obra.dataInicio).toLocaleDateString(
                                      'pt-PT'
                                    )}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="pt-1">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      tipoObra === 'existente'
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {tipoObra === 'existente' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Aviso */}
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              📋 Você será redirecionado para o formulário de checklist de inspeção
            </AlertDescription>
          </Alert>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            {tipoObra === 'nova' ? (
              <Button
                onClick={handleNovaObra}
                disabled={isLoading}
                className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Criando...' : 'Criar Obra Nova'}
              </Button>
            ) : tipoObra === 'existente' ? (
              <Button
                onClick={handleContinuar}
                disabled={isLoading || !obraId}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? 'Iniciando...' : 'Continuar'}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

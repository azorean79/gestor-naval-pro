'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayCircle, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface StartInspectionButtonProps {
  jangadaId: string
  numeroSerie: string
  onSuccess?: () => void
}

export function StartInspectionButton({
  jangadaId,
  numeroSerie,
  onSuccess
}: StartInspectionButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStartInspection = async () => {
    try {
      setLoading(true)

      // Criar nova inspeção
      const response = await fetch('/api/inspecoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jangadaId,
          tipo: 'completa',
          status: 'em_progresso',
          dataInicio: new Date().toISOString(),
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao criar inspeção')
      }

      const inspecao = await response.json()
      toast.success('Inspeção iniciada com sucesso!')
      setOpen(false)
      onSuccess?.()

      // Redirecionar para fluxo de inspeção
      setTimeout(() => {
        router.push(`/inspecoes/${inspecao.id}/quadro`)
      }, 500)
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar inspeção')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-blue-600 hover:bg-blue-700"
      >
        <PlayCircle className="h-4 w-4" />
        Iniciar Inspeção
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Iniciar Inspeção
            </DialogTitle>
            <DialogDescription>
              Você está prestes a iniciar uma nova inspeção para a jangada
            </DialogDescription>
          </DialogHeader>

          <Card className="p-4 bg-slate-50">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-600">Número de Série</p>
                <p className="text-lg font-semibold text-slate-900">{numeroSerie}</p>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-600 mb-2">Informações da Inspeção:</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Tipo: Inspeção Completa</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Status: Em Progresso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Data: {new Date().toLocaleDateString('pt-PT')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-200 bg-yellow-50 p-3 rounded">
                <p className="text-xs font-medium text-yellow-800 mb-1">⚠️ Vai ser redirecionado para:</p>
                <p className="text-sm text-yellow-700">Quadro de Inspeção - Preenchimento de Componentes</p>
              </div>
            </div>
          </Card>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStartInspection}
              disabled={loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <PlayCircle className="h-4 w-4" />
              {loading ? 'Iniciando...' : 'Iniciar Inspeção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

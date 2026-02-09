'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  AlertCircle,
  FileText,
  ClipboardCheck,
  Package,
  FileSignature
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InspectionStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending'
  route?: string
}

interface InspectionJourneyProps {
  inspecaoId: string
  currentStep: string
  onStepChange: (step: string) => void
}

export function InspectionJourney({
  inspecaoId,
  currentStep,
  onStepChange
}: InspectionJourneyProps) {
  const steps: InspectionStep[] = [
    {
      id: 'info',
      title: 'Informações',
      description: 'Dados da jangada e inspeção',
      icon: <FileText className="h-5 w-5" />,
      status: currentStep === 'info' ? 'current' : 'completed',
      route: `/inspecoes/${inspecaoId}`
    },
    {
      id: 'quadro',
      title: 'Quadro',
      description: 'Componentes e condições',
      icon: <ClipboardCheck className="h-5 w-5" />,
      status: currentStep === 'quadro' ? 'current' : currentStep === 'info' ? 'pending' : 'completed',
      route: `/inspecoes/${inspecaoId}/quadro`
    },
    {
      id: 'testes',
      title: 'Testes',
      description: 'Testes SOLAS e IMO',
      icon: <Package className="h-5 w-5" />,
      status: currentStep === 'testes' ? 'current' : ['info', 'quadro'].includes(currentStep) ? 'pending' : 'completed',
      route: `/inspecoes/${inspecaoId}/testes`
    },
    {
      id: 'assinatura',
      title: 'Finalizar',
      description: 'Revisão e assinatura',
      icon: <FileSignature className="h-5 w-5" />,
      status: currentStep === 'assinatura' ? 'current' : 'pending',
      route: `/inspecoes/${inspecaoId}/assinatura`
    }
  ]

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card className="p-4 bg-white">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Progresso da Inspeção</h3>
            <Badge variant="outline">{completedSteps} de {steps.length}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-600">{Math.round(progress)}% concluído</p>
        </div>
      </Card>

      {/* Steps Timeline */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card
            key={step.id}
            className={cn(
              'p-4 cursor-pointer transition-all hover:shadow-md',
              step.status === 'current' && 'border-blue-500 bg-blue-50',
              step.status === 'completed' && 'border-green-500 bg-green-50',
              step.status === 'pending' && 'border-slate-200 bg-slate-50 opacity-75 cursor-not-allowed'
            )}
            onClick={() => step.status !== 'pending' && onStepChange(step.id)}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                ) : step.status === 'current' ? (
                  <Circle className="h-6 w-6 text-blue-600 animate-pulse" />
                ) : (
                  <Circle className="h-6 w-6 text-slate-300" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Passo {index + 1}: {step.title}
                    </h4>
                    <p className="text-sm text-slate-600 mt-0.5">{step.description}</p>
                  </div>
                  {step.status !== 'pending' && (
                    <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-2">
                  {step.status === 'completed' && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      ✓ Completo
                    </Badge>
                  )}
                  {step.status === 'current' && (
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      → Em Progresso
                    </Badge>
                  )}
                  {step.status === 'pending' && (
                    <Badge variant="outline" className="text-slate-500">
                      Aguardando...
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Current Step Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 text-sm">
              Etapa Atual: {steps.find(s => s.status === 'current')?.title}
            </h4>
            <p className="text-sm text-blue-800 mt-1">
              {steps.find(s => s.status === 'current')?.description}
            </p>
          </div>
        </div>
      </Card>

      {/* Navigation Hints */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <h4 className="font-semibold text-slate-900 text-sm mb-2">💡 Dicas</h4>
        <ul className="space-y-1 text-xs text-slate-700">
          <li>• Complete todas as etapas para finalizar a inspeção</li>
          <li>• Clique em qualquer etapa concluída para revisitar</li>
          <li>• Não perca dados - salve regularmente</li>
          <li>• A assinatura digital é obrigatória no final</li>
        </ul>
      </Card>
    </div>
  )
}

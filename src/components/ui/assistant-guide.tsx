"use client";

import { useState, useEffect } from 'react';
import { Lightbulb, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AssistantStep {
  id: string;
  title: string;
  description: string;
  tips: string[];
  field?: string;
  required?: boolean;
}

interface AssistantGuideProps {
  currentStep: string;
  onStepComplete: (stepId: string) => void;
  onClose: () => void;
  className?: string;
}

const ASSISTANT_STEPS: AssistantStep[] = [
  {
    id: 'marca-modelo',
    title: 'Selecionar Marca e Modelo',
    description: 'Escolha a marca e modelo da jangada para obter sugestões automáticas.',
    tips: [
      'Verifique o certificado da jangada para confirmar marca e modelo',
      'Modelos mais recentes têm melhor durabilidade',
      'Consulte o manual do fabricante para especificações técnicas'
    ],
    field: 'marca',
    required: true
  },
  {
    id: 'numero-serie',
    title: 'Número de Série',
    description: 'Digite o número de série único da jangada.',
    tips: [
      'Localizado na placa de identificação da jangada',
      'Importante para rastreamento e manutenção',
      'Verifique se não há duplicatas no sistema'
    ],
    field: 'numeroSerie',
    required: true
  },
  {
    id: 'cilindros',
    title: 'Configuração dos Cilindros',
    description: 'Configure os cilindros de CO2 e válvulas.',
    tips: [
      'Capacidade baseada no volume da jangada',
      'Verificar pressão e validade dos cilindros',
      'Teste hidráulico obrigatório a cada 5 anos'
    ],
    field: 'cilindros',
    required: true
  },
  {
    id: 'validade',
    title: 'Datas de Validade',
    description: 'Defina as datas de validade dos componentes.',
    tips: [
      'Validade da jangada: geralmente 12 anos',
      'Cilindros CO2: 5 anos ou conforme fabricante',
      'Manter registro das últimas inspeções'
    ],
    field: 'validade',
    required: true
  },
  {
    id: 'cliente-navio',
    title: 'Associar Cliente e Navio',
    description: 'Vincule a jangada a um cliente e navio específico.',
    tips: [
      'Cliente deve estar cadastrado no sistema',
      'Verificar se o navio está autorizado para este tipo de jangada',
      'Manter histórico de localização da jangada'
    ],
    field: 'clienteId',
    required: true
  },
  {
    id: 'finalizar',
    title: 'Revisar e Salvar',
    description: 'Verifique todas as informações antes de salvar.',
    tips: [
      'Confirme se todos os campos obrigatórios estão preenchidos',
      'Verifique as datas de validade',
      'Salve o registro para gerar relatórios automáticos'
    ]
  }
];

export function AssistantGuide({ currentStep, onStepComplete, onClose, className }: AssistantGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stepIndex = ASSISTANT_STEPS.findIndex(step => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    onStepComplete(stepId);

    // Avançar para o próximo passo
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < ASSISTANT_STEPS.length) {
      setCurrentStepIndex(nextIndex);
    }
  };

  const currentStepData = ASSISTANT_STEPS[currentStepIndex];
  const isCompleted = completedSteps.has(currentStepData.id);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Assistente de Criação</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {ASSISTANT_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <Badge
                variant={index === currentStepIndex ? "default" :
                        completedSteps.has(step.id) ? "secondary" : "outline"}
                className="h-6 w-6 p-0 flex items-center justify-center text-xs"
              >
                {index + 1}
              </Badge>
              {index < ASSISTANT_STEPS.length - 1 && (
                <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        {/* Current Step */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStepData.description}
            </p>
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Dicas úteis:</h4>
            <ul className="space-y-1">
              {currentStepData.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Button */}
          {currentStepData.required && !isCompleted && (
            <Button
              onClick={() => handleStepComplete(currentStepData.id)}
              className="w-full"
              size="sm"
            >
              Marcar como Concluído
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
            disabled={currentStepIndex === 0}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentStepIndex(Math.min(ASSISTANT_STEPS.length - 1, currentStepIndex + 1))}
            disabled={currentStepIndex === ASSISTANT_STEPS.length - 1}
          >
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
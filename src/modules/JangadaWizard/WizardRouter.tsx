"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import WizardLayout from './WizardLayout';

import Step1_DadosGerais from './Step1_DadosGerais';
import Step2_Checklist from './Step2_Checklist';
import Step3_Componentes from './Step3_Componentes';
import Step4_PackMascara from './Step4_PackMascara';
import Step5_Cilindros from './Step5_Cilindros';
import Step6_Testes from './Step6_Testes';
import Step7_ResumoFinal from './Step7_ResumoFinal';
import Step8_Certificados from './Step8_Certificados';
import Step9_Historico from './Step9_Historico';

export default function WizardRouter() {
  const { currentStep } = useJangadaWizardStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_DadosGerais />;
      case 2: return <Step2_Checklist />;
      case 3: return <Step3_Componentes />;
      case 4: return <Step4_PackMascara />;
      case 5: return <Step5_Cilindros />;
      case 6:
        return <Step6_Testes />;
      case 7:
        return <Step7_ResumoFinal />;
      case 8:
        return <Step8_Certificados />;
      case 9:
        return <Step9_Historico />;
      default:
        return <Step1_DadosGerais />;
    }
  };

  return (
    <WizardLayout>
      {renderStep()}
    </WizardLayout>
  );
}

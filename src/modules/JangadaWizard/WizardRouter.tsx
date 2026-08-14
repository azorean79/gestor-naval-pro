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
import Step7_Orcamento from './Step7_Orcamento';
import Step8_ResumoFinal from './Step8_ResumoFinal';
import Step9_Certificados from './Step9_Certificados';
import Step10_Historico from './Step10_Historico';

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
        return <Step7_Orcamento />;
      case 8:
        return <Step8_ResumoFinal />;
      case 9:
        return <Step9_Certificados />;
      case 10:
        return <Step10_Historico />;
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

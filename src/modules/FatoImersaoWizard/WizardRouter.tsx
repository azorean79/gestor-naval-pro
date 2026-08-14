"use client";

import React from "react";
import Step1_Identificacao from "./Step1_Identificacao";
import Step2_Checklist from "./Step2_Checklist";
import Step3_Componentes from "./Step3_Componentes";
import Step4_LeakTest from "./Step4_LeakTest";
import Step5_Finalizar from "./Step5_Finalizar";

type Props = { step: number; setStep: (s: number) => void };

export default function WizardRouter({ step, setStep }: Props) {
  switch (step) {
    case 1:
      return <Step1_Identificacao onNext={() => setStep(2)} />;
    case 2:
      return <Step2_Checklist onNext={() => setStep(3)} onPrev={() => setStep(1)} />;
    case 3:
      return <Step3_Componentes onNext={() => setStep(4)} onPrev={() => setStep(2)} />;
    case 4:
      return <Step4_LeakTest onNext={() => setStep(5)} onPrev={() => setStep(3)} />;
    case 5:
      return <Step5_Finalizar onPrev={() => setStep(4)} />;
    default:
      return <div>Passo não encontrado.</div>;
  }
}

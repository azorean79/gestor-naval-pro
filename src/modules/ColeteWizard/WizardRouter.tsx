"use client";
import React from "react";
import Step1_Identificacao from "./Step1_Identificacao";
import Step2_Inspecao from "./Step2_Inspecao";
import Step3_Componentes from "./Step3_Componentes";
import Step4_Testes from "./Step4_Testes";
import Step5_Finalizar from "./Step5_Finalizar";

type Props = {
  step: number;
  setStep: (step: number) => void;
};

export default function WizardRouter({ step, setStep }: Props) {
  switch (step) {
    case 1:
      return <Step1_Identificacao onNext={() => setStep(2)} />;
    case 2:
      return <Step2_Inspecao onNext={() => setStep(3)} onPrev={() => setStep(1)} />;
    case 3:
      return <Step3_Componentes onNext={() => setStep(4)} onPrev={() => setStep(2)} />;
    case 4:
      return <Step4_Testes onNext={() => setStep(5)} onPrev={() => setStep(3)} />;
    case 5:
      return <Step5_Finalizar onPrev={() => setStep(4)} />;
    default:
      return <div>Passo não encontrado.</div>;
  }
}

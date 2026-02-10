"use client";

import { Suspense } from "react";
import { AgendamentoWorkflow } from "./agendamento-workflow";

export default function AgendamentoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AgendamentoWorkflow />
    </Suspense>
  );
}
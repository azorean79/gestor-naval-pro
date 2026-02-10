"use client";

import { Suspense } from "react";
import { AgendamentoWorkflow } from "./agendamento-workflow";

function AgendamentoPageContent() {
  return <AgendamentoWorkflow />;
}

export default function AgendamentoPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <AgendamentoPageContent />
    </Suspense>
  );
}
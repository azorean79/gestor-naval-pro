"use client";

import { AddAgendamentoForm } from "@/components/agenda/add-agendamento-form";

export default function NovoAgendamentoPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Agendamento</h1>
          <p className="text-muted-foreground">
            Criar um novo agendamento no sistema
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <AddAgendamentoForm />
      </div>
    </div>
  );
}
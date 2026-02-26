"use client";

import { AddClienteForm } from "@/components/clientes/add-cliente-form";

export default function NovoClientePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Cadastrar um novo cliente no sistema
          </p>
        </div>
      </div>
      <div className="flex justify-center">
        <AddClienteForm />
      </div>
    </div>
  );
}
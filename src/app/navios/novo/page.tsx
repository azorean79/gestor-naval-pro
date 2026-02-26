"use client";

import { AddNavioForm } from "@/components/navios/add-navio-form";

export default function NovoNavioPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Navio</h1>
          <p className="text-muted-foreground">
            Criar um novo navio no sistema
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <AddNavioForm />
      </div>
    </div>
  );
}
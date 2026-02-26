"use client";

import { AddStockItemForm } from "@/components/stock/add-stock-item-form";

export default function NovoStockItemPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Item de Stock</h1>
          <p className="text-muted-foreground">
            Cadastrar um novo item no estoque
          </p>
        </div>
      </div>
      <div className="flex justify-center">
        <AddStockItemForm />
      </div>
    </div>
  );
}
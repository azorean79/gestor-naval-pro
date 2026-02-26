"use client";
import { useParams, useRouter } from "next/navigation";
import { useStock } from "@/hooks/use-stock";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function EditStockItemPage() {
  const params = useParams();
  const router = useRouter();
  const { data: stock = [] } = useStock();
  const item = stock.find((s: any) => s.id === params.id);

  const [nome, setNome] = useState(item?.nome || "");
  const [quantidadeAtual, setQuantidadeAtual] = useState(item?.quantidadeAtual || 0);
  const [precoUnitario, setPrecoUnitario] = useState(item?.precoUnitario || 0);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Item não encontrado</h2>
          <Button onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    alert('Salvar alterações: ' + nome);
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Editar {item.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label>Nome</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} />
            </div>
            <div className="mb-4">
              <label>Quantidade</label>
              <Input type="number" value={quantidadeAtual} onChange={e => setQuantidadeAtual(Number(e.target.value))} />
            </div>
            <div className="mb-4">
              <label>Preço Unitário</label>
              <Input type="number" value={precoUnitario} onChange={e => setPrecoUnitario(Number(e.target.value))} />
            </div>
            <Button variant="default" onClick={handleSave}>Salvar</Button>
            <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

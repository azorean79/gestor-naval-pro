"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Package, Layers, MapPin, Calendar } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Mock data - será substituído por dados reais
const mockArtigos = [
  {
    id: "1",
    nome: "Coletes Salva-vidas",
    categoria: "Segurança",
    localizacao: "Armazém 1",
    quantidade: 50,
    status: "disponível",
    validade: "2026-12-31",
    descricao: "Coletes homologados para uso marítimo."
  },
  {
    id: "2",
    nome: "Extintores",
    categoria: "Segurança",
    localizacao: "Armazém 2",
    quantidade: 20,
    status: "em falta",
    validade: "2025-06-30",
    descricao: "Extintores de pó químico."
  }
];

export default function FichaArtigoStockPage() {
  const params = useParams();
  const router = useRouter();
  const [artigo, setArtigo] = useState<any>(null);

  useEffect(() => {
    const found = mockArtigos.find((a) => a.id === params.id);
    setArtigo(found);
  }, [params.id]);

  if (!artigo) return <div>Artigo não encontrado.</div>;

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 flex items-center gap-2">
        <ArrowLeft size={18} /> Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package /> {artigo.nome}
            <Badge variant={artigo.status === "disponível" ? "default" : "destructive"}>{artigo.status}</Badge>
          </CardTitle>
          <CardDescription>Categoria: {artigo.categoria}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-2">Localização: <span className="font-medium">{artigo.localizacao}</span></div>
          <div className="mb-2">Quantidade: <span className="font-medium">{artigo.quantidade}</span></div>
          <div className="mb-2">Validade: <span className="font-medium">{artigo.validade}</span></div>
          <div className="mb-2">Descrição: <span className="font-medium">{artigo.descricao}</span></div>
        </CardContent>
      </Card>
    </div>
  );
}

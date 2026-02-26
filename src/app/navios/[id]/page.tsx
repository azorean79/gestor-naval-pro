"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Ship, Calendar, MapPin, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useNavios } from "@/hooks/use-navios";
import { formatDate } from "@/lib/formatDate";
import { useState, useEffect } from "react";

// Mock data - será substituído por dados reais
const mockNavios = [
  {
    id: "1",
    nome: "Atlântico Express",
    imo: "IMO123456",
    matricula: "PT-1234-A",
    tipo: "Cargueiro",
    bandeira: "Portugal",
    proprietario: "Transportes Marítimos SA",
    status: "ativo",
    ultimaInspecao: "2024-01-15",
    proximaInspecao: "2024-07-15"
  },
  {
    id: "2",
    nome: "Costa Azul",
    imo: "IMO234567",
    matricula: "PT-2345-B",
    tipo: "Passageiro",
    bandeira: "Portugal",
    proprietario: "Linhas Azuis Ltd",
    status: "ativo",
    ultimaInspecao: "2024-01-10",
    proximaInspecao: "2024-07-10"
  }
];

export default function FichaNavioPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chamar o hook sempre (não condicional) para manter a ordem dos hooks
  const { data: navios, isLoading } = useNavios();

  // Usar dados reais se disponíveis, senão usar mock
  const displayNavios = navios || mockNavios;

  // Encontrar o navio pelo ID
  const navio = displayNavios.find(n => n.id === params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando navio...</p>
        </div>
      </div>
    );
  }

  if (!navio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Navio não encontrado</h2>
          <p className="text-gray-600 mb-4">O navio solicitado não existe.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ficha de Navio
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detalhes completos do navio
              </p>
            </div>
          </div>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ship className="h-5 w-5" />
                Informações do Navio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg font-semibold">{navio.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IMO</label>
                  <p>{navio.imo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Matrícula</label>
                  <p>{navio.matricula}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <p>{navio.tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Bandeira</label>
                  <p>{navio.bandeira}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={navio.status === 'ativo' ? 'default' : 'secondary'}>
                      {navio.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proprietário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{navio.proprietario}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspeções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Inspeções
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Última Inspeção</label>
                <p>{navio.ultimaInspecao ? formatDate(navio.ultimaInspecao) : 'Não informado'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Próxima Inspeção</label>
                <p>{navio.proximaInspecao ? formatDate(navio.proximaInspecao) : 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status da Inspeção</CardTitle>
            </CardHeader>
            <CardContent>
              {navio.proximaInspecao && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Próxima inspeção em:</span>
                    <span className="font-medium">
                      {Math.ceil((new Date(navio.proximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((new Date(navio.proximaInspecao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) * 100))}%`
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
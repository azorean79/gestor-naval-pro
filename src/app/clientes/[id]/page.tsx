"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Calendar, Building } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useClientes } from "@/hooks/use-clientes";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

// Adicione a definição do tipo Cliente para incluir dataNascimento
type Cliente = {
  id: string;
  nome: string;
  tipo: string;
  nif: string;
  email: string;
  telefone?: string;
  morada?: string;
  status: string;
  ilha?: string;
  portoEscala?: string;
  dataNascimento?: string;
  profissao?: string;
  empresa?: string | null;
  observacoes?: string;
};

// Mock data - será substituído por dados reais
const mockClientes = [
  {
    id: "1",
    nome: "João Silva",
    tipo: "individual",
    nif: "123456789",
    email: "joao.silva@email.com",
    telefone: "+351 912 345 678",
    morada: "Rua das Flores, 123, Lisboa",
    status: "ativo",
    ilha: "Lisboa",
    portoEscala: "Lisboa",
    dataNascimento: "1985-03-15",
    profissao: "Pescador",
    empresa: null,
    observacoes: "Cliente regular, paga em dia"
  },
  {
    id: "2",
    nome: "Maria Santos",
    tipo: "individual",
    nif: "234567890",
    email: "maria.santos@email.com",
    telefone: "+351 913 456 789",
    morada: "Avenida do Mar, 456, Porto",
    status: "ativo",
    ilha: "Porto",
    portoEscala: "Leixões",
    dataNascimento: "1990-07-22",
    profissao: "Empresária",
    empresa: "Pesca Sustentável Ltd",
    observacoes: "Proprietária de 3 jangadas"
  }
];

export default function FichaClientePage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Só chamar o hook quando montado
  const { data: clientes, isLoading } = mounted ? useClientes() : { data: null, isLoading: false };

  // Usar dados reais se disponíveis, senão usar mock
  const displayClientes: Cliente[] = clientes || mockClientes;

  // Encontrar o cliente pelo ID
  const cliente: Cliente | undefined = displayClientes.find(c => c.id === params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cliente...</p>
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Cliente não encontrado</h2>
          <p className="text-gray-600 mb-4">O cliente solicitado não existe.</p>
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
                Ficha de Cliente
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detalhes completos do cliente
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
                <Building className="h-5 w-5" />
                Informações Principais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg font-semibold">{cliente.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo</label>
                  <div className="mt-1">
                    <Badge variant={cliente.tipo === 'empresa' ? 'secondary' : 'default'}>
                      {cliente.tipo === 'empresa' ? 'Empresa' : 'Individual'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">NIF</label>
                  <p>{cliente.nif}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={cliente.status === 'ativo' ? 'default' : 'secondary'}>
                      {cliente.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{cliente.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{cliente.telefone}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-sm">{cliente.morada}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Ilha</label>
                <p>{cliente.ilha}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Porto de Escala</label>
                <p>{cliente.portoEscala}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cliente.dataNascimento && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                  <p>{formatDate(cliente.dataNascimento)}</p>
                </div>
              )}
              {cliente.profissao && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Profissão</label>
                  <p>{cliente.profissao}</p>
                </div>
              )}
              {cliente.empresa && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Empresa</label>
                  <p>{cliente.empresa}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Observações */}
        {cliente.observacoes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{cliente.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
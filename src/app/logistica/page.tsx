"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Anchor, ArrowRight, Ship, TrendingUp, Calendar, User, Building, Truck, Send, Download, Package, Plus, Eye, Edit, Trash2, FileText, Mail } from "lucide-react";
import Link from "next/link";
import { useEnvios } from "@/hooks/use-envios";
import CertificadoEnvioManager from "@/components/logistica/certificado-envio-manager";
import CorrespondenciaManager from "@/components/logistica/correspondencia-manager";

interface Porto {
  id: string;
  nome: string;
  pais: string;
  localizacao: { latitude: number; longitude: number };
  tipoFacilidades: string[];
  capacidade: string;
  telefone: string;
}

interface Rota {
  id: string;
  nome: string;
  origem: string;
  destino: string;
  distancia: number;
  tempoEstimado: number;
  status: string;
  ultimoTransporte: string;
  naveAtual: string;
  metodoTransporte: 'cliente' | 'empresa' | 'transitario';
  transitario?: string;
  dataChegadaEstacao?: string | null;
  dataPrevistaEnvio?: string | null;
}

export default function LogisticaPage() {
  const [portos, setPortos] = useState<Porto[]>([]);
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPorto, setSelectedPorto] = useState<Porto | null>(null);
  const [selectedRota, setSelectedRota] = useState<Rota | null>(null);
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [showRececaoModal, setShowRececaoModal] = useState(false);
  const [jangadasDisponiveis, setJangadasDisponiveis] = useState<any[]>([]);
  const [selectedJangadas, setSelectedJangadas] = useState<string[]>([]);
  const [destinoSelecionado, setDestinoSelecionado] = useState<string>('');

  const { envios, loading: enviosLoading, criarEnvio, atualizarEnvio, deletarEnvio } = useEnvios();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [portosRes, rotasRes] = await Promise.all([
          fetch('/api/logistica/portos'),
          fetch('/api/logistica/rotas')
        ]);

        if (portosRes.ok) {
          setPortos(await portosRes.json());
        }
        if (rotasRes.ok) {
          setRotas(await rotasRes.json());
        }
      } catch (error) {
        console.error('Erro ao carregar dados de logística:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEnviarJangadas = async () => {
    try {
      const response = await fetch('/api/estacao-servico/jangadas');
      if (response.ok) {
        const jangadas = await response.json();
        // Filtrar apenas jangadas inspecionadas (status diferente de "Aguardando Inspeção" e "Em Manutenção")
        const jangadasInspecionadas = jangadas.filter((j: any) =>
          j.status !== 'Aguardando Inspeção' && j.status !== 'Em Manutenção' && j.status !== 'Defeituoso'
        );
        setJangadasDisponiveis(jangadasInspecionadas);
        setShowEnvioModal(true);
      }
    } catch (error) {
      console.error('Erro ao carregar jangadas para envio:', error);
    }
  };

  const handleReceberJangadas = async () => {
    try {
      // Aqui seria uma API que retorna jangadas disponíveis nos portos para inspeção
      // Por enquanto, vamos simular com dados mockados
      const jangadasParaInspecao = [
        {
          id: 'receber-1',
          numeroSerie: 'JL-2024-010',
          modelo: 'Liferaft 20P',
          marca: 'Viking',
          localizacaoAtual: 'Porto de Ponta Delgada',
          cliente: 'Transportes Açores'
        },
        {
          id: 'receber-2',
          numeroSerie: 'JL-2024-011',
          modelo: 'Liferaft 15P',
          marca: 'RFD',
          localizacaoAtual: 'Porto da Ribeira Quente',
          cliente: 'Naviera Açor'
        }
      ];
      setJangadasDisponiveis(jangadasParaInspecao);
      setShowRececaoModal(true);
    } catch (error) {
      console.error('Erro ao carregar jangadas para receção:', error);
    }
  };

  const confirmarEnvio = async () => {
    if (selectedJangadas.length === 0 || !destinoSelecionado) {
      alert('Selecione pelo menos uma jangada e um destino');
      return;
    }

    try {
      // Aqui seria a chamada para a API de envio
      console.log('Enviando jangadas:', selectedJangadas, 'para:', destinoSelecionado);
      alert(`Enviadas ${selectedJangadas.length} jangadas para ${destinoSelecionado}`);
      setShowEnvioModal(false);
      setSelectedJangadas([]);
      setDestinoSelecionado('');
    } catch (error) {
      console.error('Erro ao enviar jangadas:', error);
    }
  };

  const confirmarRececao = async () => {
    if (selectedJangadas.length === 0) {
      alert('Selecione pelo menos uma jangada para receção');
      return;
    }

    try {
      // Aqui seria a chamada para a API de receção
      console.log('Recebendo jangadas:', selectedJangadas);
      alert(`Recebidas ${selectedJangadas.length} jangadas para inspeção`);
      setShowRececaoModal(false);
      setSelectedJangadas([]);
    } catch (error) {
      console.error('Erro ao receber jangadas:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="text-center text-gray-500">Carregando dados de logística...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Anchor className="h-8 w-8 text-blue-600" />
                Logística de Jangadas
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Transporte de jangadas entre portos e Estação de Serviço (Cabouco)
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">Voltar</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Ações de Envio e Receção */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Operações de Logística</h2>
          <div className="flex gap-4">
            <button
              onClick={handleEnviarJangadas}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Send className="w-5 h-5" />
              Enviar Jangadas Inspecionadas
            </button>
            <button
              onClick={handleReceberJangadas}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Receber Jangadas para Inspeção
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Tabs */}
        <Tabs defaultValue="portos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portos" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Portos ({portos.length})
            </TabsTrigger>
            <TabsTrigger value="rotas" className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Rotas ({rotas.length})
            </TabsTrigger>
            <TabsTrigger value="transportes" className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Transportes
            </TabsTrigger>
            <TabsTrigger value="envios" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Envios ({envios.length})
            </TabsTrigger>
            <TabsTrigger value="certificados" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Certificados
            </TabsTrigger>
            <TabsTrigger value="correspondencia" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Correspondência
            </TabsTrigger>
          </TabsList>

          {/* Portos Tab */}
          <TabsContent value="portos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portos.map((porto) => (
                <div
                  key={porto.id}
                  onClick={() => setSelectedPorto(selectedPorto?.id === porto.id ? null : porto)}
                  className="cursor-pointer"
                >
                  <Card className="h-full hover:shadow-lg hover:border-blue-500 transition-all">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          {porto.nome}
                        </div>
                        <Badge variant="outline">{porto.capacidade}</Badge>
                      </CardTitle>
                      <CardDescription>{porto.pais}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          Coordenadas
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {porto.localizacao.latitude.toFixed(4)}, {porto.localizacao.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                          Facilidades
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {porto.tipoFacilidades.map((f) => (
                            <Badge key={f} variant="secondary" className="text-xs">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Telefone:</strong> {porto.telefone}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Rotas Tab */}
          <TabsContent value="rotas" className="space-y-6">
            <div className="space-y-4">
              {rotas.map((rota) => (
                <div
                  key={rota.id}
                  onClick={() => setSelectedRota(selectedRota?.id === rota.id ? null : rota)}
                  className="cursor-pointer"
                >
                  <Card className="hover:shadow-lg hover:border-blue-500 transition-all">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ArrowRight className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-base">{rota.nome}</CardTitle>
                            <CardDescription>
                              {rota.origem} <ArrowRight className="inline h-3 w-3 mx-1" /> {rota.destino}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge className={rota.status === 'Ativa' ? 'bg-green-600' : 'bg-yellow-600'}>
                          {rota.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Distância
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {rota.distancia} km
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Tempo
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ~{rota.tempoEstimado}h
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Método
                          </p>
                          <div className="flex items-center gap-1">
                            {rota.metodoTransporte === 'cliente' && <User className="h-4 w-4 text-blue-600" />}
                            {rota.metodoTransporte === 'empresa' && <Building className="h-4 w-4 text-green-600" />}
                            {rota.metodoTransporte === 'transitario' && <Truck className="h-4 w-4 text-orange-600" />}
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {rota.metodoTransporte === 'cliente' ? 'Cliente' :
                               rota.metodoTransporte === 'empresa' ? 'Empresa' : 'Transitário'}
                            </p>
                          </div>
                          {rota.transitario && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {rota.transitario}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Nave Atual
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {rota.naveAtual}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">
                            Último Transporte
                          </p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {new Date(rota.ultimoTransporte).toLocaleDateString('pt-BR')}
                          </p>
                          {rota.dataPrevistaEnvio && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Envio: {new Date(rota.dataPrevistaEnvio).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {rota.dataChegadaEstacao && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Chegada: {new Date(rota.dataChegadaEstacao).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Transportes Tab */}
          <TabsContent value="transportes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ship className="h-5 w-5 text-blue-600" />
                  Transportes Ativos
                </CardTitle>
                <CardDescription>
                  Transportes ativos de jangadas entre portos e estação de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rotas
                    .filter((r) => r.status === 'Ativa' && r.naveAtual !== '-')
                    .map((rota) => (
                      <div
                        key={rota.id}
                        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{rota.naveAtual}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {rota.origem} → {rota.destino}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-500" />
                                <p className="text-xs text-gray-500">
                                  Saída: {new Date(rota.ultimoTransporte).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-600 mb-2">Em Trânsito</Badge>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {rota.distancia} km
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Envios Tab */}
          <TabsContent value="envios" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Envios</h2>
                <p className="text-gray-600 dark:text-gray-300">Gerencie envios de stock e jangadas</p>
              </div>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Envio
              </Button>
            </div>

            {enviosLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">Carregando envios...</p>
              </div>
            ) : envios.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">Nenhum envio encontrado</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Crie seu primeiro envio para começar a rastrear entregas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {envios.map((envio) => (
                  <Card key={envio.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {envio.numeroRastreio || `Envio ${envio.id.slice(-6)}`}
                        </CardTitle>
                        <Badge
                          variant={
                            envio.status === 'entregue' ? 'default' :
                            envio.status === 'em_transito' ? 'secondary' :
                            envio.status === 'enviado' ? 'outline' : 'destructive'
                          }
                        >
                          {envio.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {envio.destinatarioNome}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Package className="h-4 w-4" />
                          <span>{envio.itens.length} item(s)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Truck className="h-4 w-4" />
                          <span>{envio.metodoEnvio}</span>
                        </div>
                        {envio.transportadora && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Building className="h-4 w-4" />
                            <span>{envio.transportadora}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Criado em {new Date(envio.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificados Tab */}
          <TabsContent value="certificados" className="space-y-6">
            <CertificadoEnvioManager />
          </TabsContent>

          {/* Correspondência Tab */}
          <TabsContent value="correspondencia" className="space-y-6">
            <CorrespondenciaManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Envio */}
      {showEnvioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Enviar Jangadas Inspecionadas</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selecionar Destino
              </label>
              <select
                value={destinoSelecionado}
                onChange={(e) => setDestinoSelecionado(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Selecione um destino</option>
                {portos.filter(p => p.nome !== 'Estação de Serviço (Cabouco)').map(porto => (
                  <option key={porto.id} value={porto.nome}>{porto.nome}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Jangadas Disponíveis</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {jangadasDisponiveis.map(jangada => (
                  <div key={jangada.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedJangadas.includes(jangada.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJangadas([...selectedJangadas, jangada.id]);
                        } else {
                          setSelectedJangadas(selectedJangadas.filter(id => id !== jangada.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{jangada.numeroSerie}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{jangada.modelo} - {jangada.marca}</p>
                      <p className="text-sm text-gray-500">Cliente: {jangada.cliente}</p>
                    </div>
                    <Badge variant="secondary">{jangada.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEnvioModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEnvio}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Confirmar Envio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Receção */}
      {showRececaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Receber Jangadas para Inspeção</h3>

            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Jangadas Disponíveis nos Portos</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {jangadasDisponiveis.map(jangada => (
                  <div key={jangada.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedJangadas.includes(jangada.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedJangadas([...selectedJangadas, jangada.id]);
                        } else {
                          setSelectedJangadas(selectedJangadas.filter(id => id !== jangada.id));
                        }
                      }}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{jangada.numeroSerie}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{jangada.modelo} - {jangada.marca}</p>
                      <p className="text-sm text-gray-500">Localização: {jangada.localizacaoAtual}</p>
                      <p className="text-sm text-gray-500">Cliente: {jangada.cliente}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRececaoModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRececao}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Confirmar Receção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

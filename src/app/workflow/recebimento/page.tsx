"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Ship,
  Package,
  User,
  MapPin,
  Calendar,
  Save,
  ArrowLeft,
  QrCode,
  Camera,
  Upload
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Cliente {
  id: string;
  nome: string;
  nif: string;
  email: string;
}

interface Navio {
  id: string;
  nome: string;
  matricula: string;
  clienteId: string;
}

export default function RecebimentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [navios, setNavios] = useState<Navio[]>([]);
  const [filteredNavios, setFilteredNavios] = useState<Navio[]>([]);

  const [formData, setFormData] = useState({
    numeroSerie: '',
    modelo: '',
    marca: '',
    capacidade: '',
    tipoPack: '',
    clienteId: '',
    navioId: '',
    localizacaoAtual: 'Estação de Serviço',
    observacoes: '',
    dataRecebimento: new Date().toISOString().split('T')[0],
    tecnicoResponsavel: 'Julio Correia',
    condicaoGeral: 'boa',
    documentosAcompanhantes: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClientes();
    fetchNavios();
  }, []);

  useEffect(() => {
    if (formData.clienteId) {
      setFilteredNavios(navios.filter(navio => navio.clienteId === formData.clienteId));
    } else {
      setFilteredNavios([]);
    }
  }, [formData.clienteId, navios]);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      if (response.ok) {
        const data = await response.json();
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const fetchNavios = async () => {
    try {
      const response = await fetch('/api/navios');
      if (response.ok) {
        const data = await response.json();
        setNavios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar navios:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.numeroSerie.trim()) newErrors.numeroSerie = 'Número de série é obrigatório';
    if (!formData.modelo.trim()) newErrors.modelo = 'Modelo é obrigatório';
    if (!formData.marca.trim()) newErrors.marca = 'Marca é obrigatório';
    if (!formData.clienteId) newErrors.clienteId = 'Cliente é obrigatório';
    if (!formData.navioId) newErrors.navioId = 'Navio é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/jangadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: 'recebido',
          dataRecebimento: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        router.push('/workflow');
      } else {
        const error = await response.json();
        alert('Erro ao registrar recebimento: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao registrar recebimento');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // Simular leitura de QR code
    setFormData(prev => ({
      ...prev,
      numeroSerie: 'LR-' + Date.now().toString().slice(-6)
    }));
  };

  const handlePhotoUpload = () => {
    // Simular upload de foto
    alert('Funcionalidade de upload de foto em desenvolvimento');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recebimento de Jangada</h1>
          <p className="text-gray-600">Registrar entrada de nova jangada no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações da Jangada */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ship className="w-5 h-5 mr-2" />
              Informações da Jangada
            </CardTitle>
            <CardDescription>
              Dados técnicos e identificação da jangada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroSerie">Número de Série *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="numeroSerie"
                    value={formData.numeroSerie}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroSerie: e.target.value }))}
                    placeholder="Ex: LR-2024-001"
                    className={errors.numeroSerie ? 'border-red-500' : ''}
                  />
                  <Button type="button" variant="outline" onClick={handleScanQR}>
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
                {errors.numeroSerie && <p className="text-sm text-red-500">{errors.numeroSerie}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                  placeholder="Ex: MK4, LR97, MKIII"
                  className={errors.modelo ? 'border-red-500' : ''}
                />
                {errors.modelo && <p className="text-sm text-red-500">{errors.modelo}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ex: Seasava, Eurovinil, DSB"
                  className={errors.marca ? 'border-red-500' : ''}
                />
                {errors.marca && <p className="text-sm text-red-500">{errors.marca}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidade">Capacidade (pessoas)</Label>
                <Input
                  id="capacidade"
                  type="number"
                  value={formData.capacidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacidade: e.target.value }))}
                  placeholder="Ex: 6, 10, 25"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoPack">Tipo de Pack</Label>
                <Select value={formData.tipoPack} onValueChange={(value) => setFormData(prev => ({ ...prev, tipoPack: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLAS">SOLAS</SelectItem>
                    <SelectItem value="ORC">ORC</SelectItem>
                    <SelectItem value="ISO">ISO</SelectItem>
                    <SelectItem value="MSC">MSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condicaoGeral">Condição Geral</Label>
                <Select value={formData.condicaoGeral} onValueChange={(value) => setFormData(prev => ({ ...prev, condicaoGeral: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excelente">Excelente</SelectItem>
                    <SelectItem value="boa">Boa</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="ruim">Ruim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={handlePhotoUpload}>
                <Camera className="w-4 h-4 mr-2" />
                Tirar Foto
              </Button>
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload Documentos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Cliente e Navio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Cliente e Navio
            </CardTitle>
            <CardDescription>
              Associar a jangada a um cliente e navio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select value={formData.clienteId} onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value, navioId: '' }))}>
                  <SelectTrigger className={errors.clienteId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.nif}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && <p className="text-sm text-red-500">{errors.clienteId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="navioId">Navio *</Label>
                <Select value={formData.navioId} onValueChange={(value) => setFormData(prev => ({ ...prev, navioId: value }))}>
                  <SelectTrigger className={errors.navioId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o navio" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredNavios.map((navio) => (
                      <SelectItem key={navio.id} value={navio.id}>
                        {navio.nome} - {navio.matricula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.navioId && <p className="text-sm text-red-500">{errors.navioId}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Recebimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Recebimento
            </CardTitle>
            <CardDescription>
              Detalhes do processo de recebimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.dataRecebimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataRecebimento: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tecnicoResponsavel">Técnico Responsável</Label>
                <Input
                  id="tecnicoResponsavel"
                  value={formData.tecnicoResponsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, tecnicoResponsavel: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacaoAtual">Localização Atual</Label>
                <Input
                  id="localizacaoAtual"
                  value={formData.localizacaoAtual}
                  onChange={(e) => setFormData(prev => ({ ...prev, localizacaoAtual: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações sobre o estado da jangada, danos, etc."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-4">
          <Link href="/workflow">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Registrar Recebimento
          </Button>
        </div>
      </form>
    </div>
  );
}
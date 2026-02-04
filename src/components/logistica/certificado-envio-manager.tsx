"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Send, Mail, Truck, Eye, Download, Plus } from "lucide-react";
import { useEnvios } from "@/hooks/use-envios";

interface Certificado {
  id: string;
  numero: string;
  tipo: string;
  dataEmissao: string;
  dataValidade: string;
  entidadeEmissora: string;
  status: string;
  cliente?: {
    id: string;
    nome: string;
  };
  navio?: {
    id: string;
    nome: string;
  };
  jangada?: {
    id: string;
    numeroSerie: string;
  };
}

export default function CertificadoEnvioManager() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnvioModal, setShowEnvioModal] = useState(false);
  const [selectedCertificados, setSelectedCertificados] = useState<string[]>([]);
  const [envioForm, setEnvioForm] = useState({
    metodoEnvio: '',
    transportadora: '',
    destinatarioNome: '',
    destinatarioEmail: '',
    destinatarioTelefone: '',
    enderecoEntrega: '',
    observacoes: ''
  });

  const { criarEnvioCertificado } = useEnvios();

  useEffect(() => {
    fetchCertificados();
  }, []);

  const fetchCertificados = async () => {
    try {
      const response = await fetch('/api/certificados');
      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas certificados ativos
        setCertificados(data.filter((c: Certificado) => c.status === 'ativo'));
      }
    } catch (error) {
      console.error('Erro ao carregar certificados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarCertificados = async () => {
    if (selectedCertificados.length === 0) {
      alert('Selecione pelo menos um certificado');
      return;
    }

    if (!envioForm.destinatarioNome || !envioForm.metodoEnvio) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      const certificadosSelecionados = selectedCertificados.map(certId => {
        const cert = certificados.find(c => c.id === certId);
        return {
          id: certId,
          observacoes: `Certificado ${cert?.tipo} - ${cert?.numero}`
        };
      });

      // Obter clienteId do primeiro certificado selecionado
      const primeiroCertificado = certificados.find(c => c.id === selectedCertificados[0]);
      const clienteId = primeiroCertificado?.cliente?.id || '';

      await criarEnvioCertificado({
        clienteId: clienteId,
        certificados: certificadosSelecionados,
        metodoEnvio: envioForm.metodoEnvio,
        enderecoEntrega: envioForm.enderecoEntrega,
        observacoes: envioForm.observacoes,
        responsavel: 'Julio Correia'
      });

      alert(`Certificados enviados com sucesso!`);
      setShowEnvioModal(false);
      setSelectedCertificados([]);
      setEnvioForm({
        metodoEnvio: '',
        transportadora: '',
        destinatarioNome: '',
        destinatarioEmail: '',
        destinatarioTelefone: '',
        enderecoEntrega: '',
        observacoes: ''
      });
    } catch (error) {
      console.error('Erro ao enviar certificados:', error);
      alert('Erro ao enviar certificados');
    }
  };

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'correio':
        return <Send className="h-4 w-4" />;
      case 'transitario':
        return <Truck className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando certificados...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Envio de Certificados
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie o envio de certificados para clientes
          </p>
        </div>
        <Dialog open={showEnvioModal} onOpenChange={setShowEnvioModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Certificados
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Enviar Certificados</DialogTitle>
              <DialogDescription>
                Selecione os certificados e configure os detalhes do envio
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Seleção de Certificados */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Certificados Disponíveis</h3>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cliente/Navio/Jangada</TableHead>
                        <TableHead>Validade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificados.map((cert) => (
                        <TableRow key={cert.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCertificados.includes(cert.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCertificados([...selectedCertificados, cert.id]);
                                } else {
                                  setSelectedCertificados(selectedCertificados.filter(id => id !== cert.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{cert.numero}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cert.tipo}</Badge>
                          </TableCell>
                          <TableCell>
                            {cert.cliente?.nome || cert.navio?.nome || cert.jangada?.numeroSerie || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {new Date(cert.dataValidade).toLocaleDateString('pt-BR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedCertificados.length} certificado(s) selecionado(s)
                </p>
              </div>

              {/* Formulário de Envio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="metodoEnvio">Método de Envio *</Label>
                  <Select
                    value={envioForm.metodoEnvio}
                    onValueChange={(value) => setEnvioForm({...envioForm, metodoEnvio: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="correio">Correio</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="transitario">Transitário</SelectItem>
                      <SelectItem value="entrega_direta">Entrega Direta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transportadora">Transportadora</Label>
                  <Input
                    id="transportadora"
                    value={envioForm.transportadora}
                    onChange={(e) => setEnvioForm({...envioForm, transportadora: e.target.value})}
                    placeholder="CTT, DHL, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="destinatarioNome">Destinatário *</Label>
                  <Input
                    id="destinatarioNome"
                    value={envioForm.destinatarioNome}
                    onChange={(e) => setEnvioForm({...envioForm, destinatarioNome: e.target.value})}
                    placeholder="Nome do destinatário"
                  />
                </div>

                <div>
                  <Label htmlFor="destinatarioEmail">Email</Label>
                  <Input
                    id="destinatarioEmail"
                    type="email"
                    value={envioForm.destinatarioEmail}
                    onChange={(e) => setEnvioForm({...envioForm, destinatarioEmail: e.target.value})}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="destinatarioTelefone">Telefone</Label>
                  <Input
                    id="destinatarioTelefone"
                    value={envioForm.destinatarioTelefone}
                    onChange={(e) => setEnvioForm({...envioForm, destinatarioTelefone: e.target.value})}
                    placeholder="+351 123 456 789"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
                  <Textarea
                    id="enderecoEntrega"
                    value={envioForm.enderecoEntrega}
                    onChange={(e) => setEnvioForm({...envioForm, enderecoEntrega: e.target.value})}
                    placeholder="Endereço completo de entrega"
                    rows={3}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={envioForm.observacoes}
                    onChange={(e) => setEnvioForm({...envioForm, observacoes: e.target.value})}
                    placeholder="Observações adicionais"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowEnvioModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEnviarCertificados}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Certificados
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Certificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificados.map((certificado) => (
          <Card key={certificado.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {certificado.numero}
                </CardTitle>
                <Badge variant="outline">{certificado.tipo}</Badge>
              </div>
              <CardDescription>
                {certificado.entidadeEmissora}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <FileText className="h-4 w-4" />
                  <span>
                    {certificado.cliente?.nome ||
                     certificado.navio?.nome ||
                     certificado.jangada?.numeroSerie ||
                     'N/A'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Emissão: {new Date(certificado.dataEmissao).toLocaleDateString('pt-BR')}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Validade: {new Date(certificado.dataValidade).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {certificados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Nenhum certificado ativo encontrado</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Certificados ativos aparecerão aqui para envio
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
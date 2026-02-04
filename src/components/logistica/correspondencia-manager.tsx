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
import { Mail, Send, Eye, Edit, Trash2, Plus, FileText, Clock, CheckCircle, Archive } from "lucide-react";
import { useEnvios } from "@/hooks/use-envios";

interface Correspondencia {
  id: string;
  tipo: string;
  assunto: string;
  descricao?: string;
  prioridade: string;
  status: string;
  remetenteNome?: string;
  remetenteEmail?: string;
  remetenteTelefone?: string;
  destinatarioNome: string;
  destinatarioEmail?: string;
  destinatarioTelefone?: string;
  enderecoEntrega?: string;
  conteudo?: string;
  metodoEnvio?: string;
  dataEnvio?: string;
  dataRecebimento?: string;
  responsavel: string;
  createdAt: string;
}

export default function CorrespondenciaManager() {
  const [correspondencias, setCorrespondencias] = useState<Correspondencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCorrespondencia, setSelectedCorrespondencia] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo: '',
    assunto: '',
    descricao: '',
    prioridade: 'normal',
    status: 'rascunho',
    remetenteNome: '',
    remetenteEmail: '',
    remetenteTelefone: '',
    destinatarioNome: '',
    destinatarioEmail: '',
    destinatarioTelefone: '',
    enderecoEntrega: '',
    conteudo: '',
    metodoEnvio: '',
    observacoes: ''
  });

  const {
    criarCorrespondencia,
    atualizarCorrespondencia,
    deletarCorrespondencia
  } = useEnvios();

  useEffect(() => {
    fetchCorrespondencias();
  }, []);

  const fetchCorrespondencias = async () => {
    try {
      const response = await fetch('/api/correspondencias');
      if (response.ok) {
        setCorrespondencias(await response.json());
      }
    } catch (error) {
      console.error('Erro ao carregar correspondências:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCorrespondencia = async () => {
    if (!formData.assunto || !formData.destinatarioNome) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    try {
      await criarCorrespondencia(formData);
      alert('Correspondência criada com sucesso!');
      setShowCreateModal(false);
      setFormData({
        tipo: '',
        assunto: '',
        descricao: '',
        prioridade: 'normal',
        status: 'rascunho',
        remetenteNome: '',
        remetenteEmail: '',
        remetenteTelefone: '',
        destinatarioNome: '',
        destinatarioEmail: '',
        destinatarioTelefone: '',
        enderecoEntrega: '',
        conteudo: '',
        metodoEnvio: '',
        observacoes: ''
      });
      fetchCorrespondencias();
    } catch (error) {
      console.error('Erro ao criar correspondência:', error);
      alert('Erro ao criar correspondência');
    }
  };

  const handleSendCorrespondencia = async () => {
    if (!selectedCorrespondencia) return;

    try {
      const response = await fetch(`/api/correspondencias/${selectedCorrespondencia}/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metodoEnvio: formData.metodoEnvio,
          observacoes: formData.observacoes
        }),
      });

      if (response.ok) {
        alert('Correspondência enviada com sucesso!');
        setShowSendModal(false);
        setSelectedCorrespondencia(null);
        fetchCorrespondencias();
      }
    } catch (error) {
      console.error('Erro ao enviar correspondência:', error);
      alert('Erro ao enviar correspondência');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'enviada':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'recebida':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'arquivada':
        return <Archive className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-gray-100 text-gray-800';
      case 'enviada':
        return 'bg-blue-100 text-blue-800';
      case 'recebida':
        return 'bg-green-100 text-green-800';
      case 'arquivada':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa':
        return 'bg-green-100 text-green-800';
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'urgente':
        return 'bg-red-600 text-white';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando correspondências...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Correspondência
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie cartas, documentos e comunicações
          </p>
        </div>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Correspondência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Correspondência</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da correspondência
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({...formData, tipo: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carta">Carta</SelectItem>
                    <SelectItem value="documento">Documento</SelectItem>
                    <SelectItem value="fatura">Fatura</SelectItem>
                    <SelectItem value="relatorio">Relatório</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  value={formData.prioridade}
                  onValueChange={(value) => setFormData({...formData, prioridade: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label htmlFor="assunto">Assunto *</Label>
                <Input
                  id="assunto"
                  value={formData.assunto}
                  onChange={(e) => setFormData({...formData, assunto: e.target.value})}
                  placeholder="Assunto da correspondência"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descrição breve"
                  rows={2}
                />
              </div>

              <div className="col-span-2">
                <h3 className="text-lg font-semibold mb-3">Remetente</h3>
              </div>

              <div>
                <Label htmlFor="remetenteNome">Nome</Label>
                <Input
                  id="remetenteNome"
                  value={formData.remetenteNome}
                  onChange={(e) => setFormData({...formData, remetenteNome: e.target.value})}
                  placeholder="Nome do remetente"
                />
              </div>

              <div>
                <Label htmlFor="remetenteEmail">Email</Label>
                <Input
                  id="remetenteEmail"
                  type="email"
                  value={formData.remetenteEmail}
                  onChange={(e) => setFormData({...formData, remetenteEmail: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="remetenteTelefone">Telefone</Label>
                <Input
                  id="remetenteTelefone"
                  value={formData.remetenteTelefone}
                  onChange={(e) => setFormData({...formData, remetenteTelefone: e.target.value})}
                  placeholder="+351 123 456 789"
                />
              </div>

              <div className="col-span-2">
                <h3 className="text-lg font-semibold mb-3">Destinatário</h3>
              </div>

              <div>
                <Label htmlFor="destinatarioNome">Nome *</Label>
                <Input
                  id="destinatarioNome"
                  value={formData.destinatarioNome}
                  onChange={(e) => setFormData({...formData, destinatarioNome: e.target.value})}
                  placeholder="Nome do destinatário"
                />
              </div>

              <div>
                <Label htmlFor="destinatarioEmail">Email</Label>
                <Input
                  id="destinatarioEmail"
                  type="email"
                  value={formData.destinatarioEmail}
                  onChange={(e) => setFormData({...formData, destinatarioEmail: e.target.value})}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="destinatarioTelefone">Telefone</Label>
                <Input
                  id="destinatarioTelefone"
                  value={formData.destinatarioTelefone}
                  onChange={(e) => setFormData({...formData, destinatarioTelefone: e.target.value})}
                  placeholder="+351 123 456 789"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="enderecoEntrega">Endereço de Entrega</Label>
                <Textarea
                  id="enderecoEntrega"
                  value={formData.enderecoEntrega}
                  onChange={(e) => setFormData({...formData, enderecoEntrega: e.target.value})}
                  placeholder="Endereço completo"
                  rows={2}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="conteudo">Conteúdo</Label>
                <Textarea
                  id="conteudo"
                  value={formData.conteudo}
                  onChange={(e) => setFormData({...formData, conteudo: e.target.value})}
                  placeholder="Conteúdo da correspondência"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCorrespondencia}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Correspondência
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Correspondências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {correspondencias.map((correspondencia) => (
          <Card key={correspondencia.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(correspondencia.status)}
                  <CardTitle className="text-lg truncate">
                    {correspondencia.assunto}
                  </CardTitle>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(correspondencia.status)}>
                    {correspondencia.status}
                  </Badge>
                  <Badge className={getPrioridadeColor(correspondencia.prioridade)}>
                    {correspondencia.prioridade}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                {correspondencia.tipo} • {correspondencia.destinatarioNome}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {correspondencia.descricao && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {correspondencia.descricao}
                  </p>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Criado em {new Date(correspondencia.createdAt).toLocaleDateString('pt-BR')}
                </div>
                {correspondencia.dataEnvio && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Enviado em {new Date(correspondencia.dataEnvio).toLocaleDateString('pt-BR')}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Responsável: {correspondencia.responsavel}
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                {correspondencia.status === 'rascunho' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedCorrespondencia(correspondencia.id);
                      setShowSendModal(true);
                    }}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Enviar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {correspondencias.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Nenhuma correspondência encontrada</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Crie sua primeira correspondência para começar
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Envio */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Correspondência</DialogTitle>
            <DialogDescription>
              Configure como enviar esta correspondência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="metodoEnvio">Método de Envio</Label>
              <Select
                value={formData.metodoEnvio}
                onValueChange={(value) => setFormData({...formData, metodoEnvio: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="correio">Correio</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="fax">Fax</SelectItem>
                  <SelectItem value="entrega_pessoal">Entrega Pessoal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                placeholder="Observações sobre o envio"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendCorrespondencia}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
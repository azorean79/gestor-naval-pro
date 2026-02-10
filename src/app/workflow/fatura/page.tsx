"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText,
  Download,
  ArrowLeft,
  Calculator,
  Plus,
  Trash2,
  Euro,
  Calendar,
  User,
  Ship,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Jangada {
  id: string;
  numeroSerie: string;
  modelo: string;
  marca: string;
  cliente: string;
  navio: string;
  status: string;
  dataCertificado: string;
}

interface ItemFatura {
  id: string;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

interface Fatura {
  id: string;
  numero: string;
  dataEmissao: string;
  dataVencimento: string;
  status: 'rascunho' | 'emitida' | 'paga' | 'cancelada';
  valorTotal: number;
  itens: ItemFatura[];
  observacoes: string;
  formaPagamento: string;
  dataPagamento: string;
}

const servicosPadrao = [
  { descricao: 'Inspeção completa de jangada salva-vidas', precoUnitario: 150.00 },
  { descricao: 'Reparo de câmaras de ar', precoUnitario: 75.00 },
  { descricao: 'Substituição de equipamentos de segurança', precoUnitario: 200.00 },
  { descricao: 'Manutenção preventiva', precoUnitario: 100.00 },
  { descricao: 'Teste hidrostático', precoUnitario: 50.00 },
  { descricao: 'Emissão de certificado', precoUnitario: 25.00 }
];

export default function FaturaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jangadaId = searchParams.get('jangada');

  const [loading, setLoading] = useState(false);
  const [jangada, setJangada] = useState<Jangada | null>(null);
  const [fatura, setFatura] = useState<Fatura | null>(null);
  const [itens, setItens] = useState<ItemFatura[]>([]);
  const [novoItem, setNovoItem] = useState({
    descricao: '',
    quantidade: 1,
    precoUnitario: 0
  });
  const [observacoes, setObservacoes] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');

  useEffect(() => {
    if (jangadaId) {
      fetchJangada(jangadaId);
      fetchFatura(jangadaId);
    }
  }, [jangadaId]);

  const fetchJangada = async (id: string) => {
    try {
      const response = await fetch(`/api/jangadas/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJangada(data);
      }
    } catch (error) {
      console.error('Erro ao carregar jangada:', error);
    }
  };

  const fetchFatura = async (id: string) => {
    try {
      const response = await fetch(`/api/faturas?jangadaId=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setFatura(data[0]);
          setItens(data[0].itens);
          setObservacoes(data[0].observacoes);
          setFormaPagamento(data[0].formaPagamento);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar fatura:', error);
    }
  };

  const adicionarItem = () => {
    if (!novoItem.descricao || novoItem.precoUnitario <= 0) {
      alert('Preencha a descrição e preço do item');
      return;
    }

    const item: ItemFatura = {
      id: Date.now().toString(),
      descricao: novoItem.descricao,
      quantidade: novoItem.quantidade,
      precoUnitario: novoItem.precoUnitario,
      total: novoItem.quantidade * novoItem.precoUnitario
    };

    setItens([...itens, item]);
    setNovoItem({ descricao: '', quantidade: 1, precoUnitario: 0 });
  };

  const adicionarServicoPadrao = (servico: typeof servicosPadrao[0]) => {
    const item: ItemFatura = {
      id: Date.now().toString(),
      descricao: servico.descricao,
      quantidade: 1,
      precoUnitario: servico.precoUnitario,
      total: servico.precoUnitario
    };

    setItens([...itens, item]);
  };

  const removerItem = (id: string) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => total + item.total, 0);
  };

  const gerarFatura = async () => {
    if (itens.length === 0) {
      alert('Adicione pelo menos um item à fatura');
      return;
    }

    if (!dataVencimento) {
      alert('Selecione a data de vencimento');
      return;
    }

    setLoading(true);

    try {
      const numeroFatura = `FAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      const dataEmissao = new Date().toISOString();

      const faturaData = {
        jangadaId,
        numero: numeroFatura,
        dataEmissao,
        dataVencimento: new Date(dataVencimento).toISOString(),
        status: 'rascunho',
        valorTotal: calcularTotal(),
        itens,
        observacoes,
        formaPagamento,
        dataPagamento: null
      };

      const response = await fetch('/api/faturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(faturaData),
      });

      if (response.ok) {
        const novaFatura = await response.json();
        setFatura(novaFatura);
      } else {
        const error = await response.json();
        alert('Erro ao gerar fatura: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar fatura');
    } finally {
      setLoading(false);
    }
  };

  const emitirFatura = async () => {
    if (!fatura) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/faturas/${fatura.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'emitida',
          observacoes,
          formaPagamento
        }),
      });

      if (response.ok) {
        setFatura(prev => prev ? { ...prev, status: 'emitida' } : null);

        // Atualizar status da jangada
        await fetch(`/api/jangadas/${jangadaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'faturado',
            dataFatura: new Date().toISOString()
          }),
        });

        router.push('/workflow');
      } else {
        const error = await response.json();
        alert('Erro ao emitir fatura: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao emitir fatura');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitida': return 'bg-blue-100 text-blue-800';
      case 'paga': return 'bg-green-100 text-green-800';
      case 'rascunho': return 'bg-yellow-100 text-yellow-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'emitida': return <FileText className="w-4 h-4" />;
      case 'paga': return <CheckCircle className="w-4 h-4" />;
      case 'rascunho': return <FileText className="w-4 h-4" />;
      case 'cancelada': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Faturamento</h1>
          <p className="text-gray-600">Gerar e gerenciar faturas de serviços</p>
        </div>
      </div>

      {jangada && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ship className="w-5 h-5 mr-2" />
              Jangada para Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{jangada.numeroSerie}</h3>
                <p className="text-sm text-gray-600">
                  {jangada.modelo} - {jangada.marca} • {jangada.cliente} • {jangada.navio}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Status: Certificado
                  </Badge>
                  <span className="text-sm text-gray-500">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Certificado em {new Date(jangada.dataCertificado).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fatura Existente */}
      {fatura ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Fatura
              </div>
              <Badge className={getStatusColor(fatura.status)}>
                {getStatusIcon(fatura.status)}
                <span className="ml-1 capitalize">{fatura.status}</span>
              </Badge>
            </CardTitle>
            <CardDescription>
              Número: {fatura.numero} • Valor: €{fatura.valorTotal.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                <p>{new Date(fatura.dataEmissao).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                <p>{new Date(fatura.dataVencimento).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unit.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fatura.itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="text-right">{item.quantidade}</TableCell>
                    <TableCell className="text-right">€{item.precoUnitario.toFixed(2)}</TableCell>
                    <TableCell className="text-right">€{item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold">
                  <TableCell colSpan={3}>Total</TableCell>
                  <TableCell className="text-right">€{fatura.valorTotal.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações da fatura..."
                  rows={3}
                  disabled={fatura.status === 'paga'}
                />
              </div>

              {fatura.status !== 'paga' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Adicionar Itens */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Serviços
              </CardTitle>
              <CardDescription>
                Adicione os serviços realizados à fatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Serviços Padrão */}
              <div>
                <h4 className="font-medium mb-2">Serviços Padrão</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {servicosPadrao.map((servico, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => adicionarServicoPadrao(servico)}
                      className="justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {servico.descricao} - €{servico.precoUnitario.toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Item Personalizado */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Serviço Personalizado</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Descrição do serviço"
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem({...novoItem, descricao: e.target.value})}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({...novoItem, quantidade: parseInt(e.target.value) || 1})}
                  />
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Preço unitário"
                      value={novoItem.precoUnitario}
                      onChange={(e) => setNovoItem({...novoItem, precoUnitario: parseFloat(e.target.value) || 0})}
                    />
                    <Button onClick={adicionarItem}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens da Fatura */}
          {itens.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Itens da Fatura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Preço Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">€{item.precoUnitario.toFixed(2)}</TableCell>
                        <TableCell className="text-right">€{item.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold border-t-2">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell className="text-right">€{calcularTotal().toFixed(2)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Configurações da Fatura */}
          {itens.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Configurações da Fatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Vencimento</label>
                    <Input
                      type="date"
                      value={dataVencimento}
                      onChange={(e) => setDataVencimento(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações da fatura..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Ações */}
      <div className="flex justify-end space-x-4">
        <Link href="/workflow">
          <Button variant="outline">
            Cancelar
          </Button>
        </Link>

        {!fatura && itens.length > 0 && (
          <Button
            onClick={gerarFatura}
            disabled={loading || !dataVencimento}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar Fatura
          </Button>
        )}

        {fatura && fatura.status === 'rascunho' && (
          <Button
            onClick={emitirFatura}
            disabled={loading || !formaPagamento}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Emitir Fatura
          </Button>
        )}

        {fatura && fatura.status === 'emitida' && (
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </Button>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle,
  XCircle,
  Download,
  ArrowLeft,
  Calendar,
  User,
  Ship,
  Award,
  AlertTriangle
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
  dataInspecao: string;
  resultadoInspecao: string;
}

interface Certificado {
  id: string;
  numero: string;
  dataEmissao: string;
  dataValidade: string;
  status: 'rascunho' | 'aprovado' | 'emitido' | 'rejeitado';
  observacoes: string;
  aprovadoPor: string;
  dataAprovacao: string;
}

export default function CertificadoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jangadaId = searchParams.get('jangada');

  const [loading, setLoading] = useState(false);
  const [jangada, setJangada] = useState<Jangada | null>(null);
  const [certificado, setCertificado] = useState<Certificado | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'rascunho' | 'aprovado' | 'emitido' | 'rejeitado'>('rascunho');

  useEffect(() => {
    if (jangadaId) {
      fetchJangada(jangadaId);
      fetchCertificado(jangadaId);
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

  const fetchCertificado = async (id: string) => {
    try {
      const response = await fetch(`/api/certificados?jangadaId=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setCertificado(data[0]);
          setObservacoes(data[0].observacoes);
          setStatus(data[0].status);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar certificado:', error);
    }
  };

  const gerarCertificado = async () => {
    if (!jangada) return;

    setLoading(true);

    try {
      const numeroCertificado = `CERT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
      const dataEmissao = new Date().toISOString();
      const dataValidade = new Date();
      dataValidade.setFullYear(dataValidade.getFullYear() + 1); // Validade de 1 ano

      const certificadoData = {
        jangadaId,
        numero: numeroCertificado,
        dataEmissao,
        dataValidade: dataValidade.toISOString(),
        status: 'rascunho',
        observacoes,
        aprovadoPor: '',
        dataAprovacao: null
      };

      const response = await fetch('/api/certificados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificadoData),
      });

      if (response.ok) {
        const novoCertificado = await response.json();
        setCertificado(novoCertificado);
        setStatus('rascunho');
      } else {
        const error = await response.json();
        alert('Erro ao gerar certificado: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao gerar certificado');
    } finally {
      setLoading(false);
    }
  };

  const aprovarCertificado = async () => {
    if (!certificado) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/certificados/${certificado.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'aprovado',
          aprovadoPor: 'Julio Correia',
          dataAprovacao: new Date().toISOString(),
          observacoes
        }),
      });

      if (response.ok) {
        setStatus('aprovado');
        setCertificado(prev => prev ? {
          ...prev,
          status: 'aprovado',
          aprovadoPor: 'Julio Correia',
          dataAprovacao: new Date().toISOString()
        } : null);
      } else {
        const error = await response.json();
        alert('Erro ao aprovar certificado: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao aprovar certificado');
    } finally {
      setLoading(false);
    }
  };

  const emitirCertificado = async () => {
    if (!certificado) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/certificados/${certificado.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'emitido',
          observacoes
        }),
      });

      if (response.ok) {
        setStatus('emitido');
        setCertificado(prev => prev ? { ...prev, status: 'emitido' } : null);

        // Atualizar status da jangada
        await fetch(`/api/jangadas/${jangadaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'certificado',
            dataCertificado: new Date().toISOString()
          }),
        });

        router.push('/workflow');
      } else {
        const error = await response.json();
        alert('Erro ao emitir certificado: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao emitir certificado');
    } finally {
      setLoading(false);
    }
  };

  const rejeitarCertificado = async () => {
    if (!certificado) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/certificados/${certificado.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejeitado',
          observacoes
        }),
      });

      if (response.ok) {
        setStatus('rejeitado');
        setCertificado(prev => prev ? { ...prev, status: 'rejeitado' } : null);
      } else {
        const error = await response.json();
        alert('Erro ao rejeitar certificado: ' + error.message);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao rejeitar certificado');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emitido': return 'bg-green-100 text-green-800';
      case 'aprovado': return 'bg-blue-100 text-blue-800';
      case 'rascunho': return 'bg-yellow-100 text-yellow-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'emitido': return <CheckCircle className="w-4 h-4" />;
      case 'aprovado': return <Award className="w-4 h-4" />;
      case 'rascunho': return <FileText className="w-4 h-4" />;
      case 'rejeitado': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const podeAprovar = certificado && status === 'rascunho';
  const podeEmitir = certificado && status === 'aprovado';
  const podeRejeitar = certificado && (status === 'rascunho' || status === 'aprovado');

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/workflow">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Certificado de Inspeção</h1>
          <p className="text-gray-600">Gerar e gerenciar certificados de inspeção</p>
        </div>
      </div>

      {jangada && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ship className="w-5 h-5 mr-2" />
              Jangada para Certificação
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
                  <Badge variant="outline" className={
                    jangada.resultadoInspecao === 'aprovado' ? 'bg-green-50 text-green-700' :
                    jangada.resultadoInspecao === 'reprovado' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'
                  }>
                    Inspeção: {jangada.resultadoInspecao === 'aprovado' ? 'Aprovada' :
                               jangada.resultadoInspecao === 'reprovado' ? 'Reprovada' : 'Pendente'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(jangada.dataInspecao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {jangada?.resultadoInspecao !== 'aprovado' && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta jangada não foi aprovada na inspeção. Não é possível gerar certificado.
          </AlertDescription>
        </Alert>
      )}

      {jangada?.resultadoInspecao === 'aprovado' && (
        <>
          {/* Certificado */}
          {certificado ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Certificado de Inspeção
                  </div>
                  <Badge className={getStatusColor(status)}>
                    {getStatusIcon(status)}
                    <span className="ml-1 capitalize">{status}</span>
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Detalhes do certificado gerado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Certificado</label>
                    <p className="text-lg font-mono">{certificado.numero}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Emissão</label>
                    <p>{new Date(certificado.dataEmissao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Validade</label>
                    <p>{new Date(certificado.dataValidade).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aprovado Por</label>
                    <p>{certificado.aprovadoPor || 'Não aprovado'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <Textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações sobre o certificado..."
                    rows={3}
                    disabled={status === 'emitido'}
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum certificado gerado</h3>
                  <p className="text-gray-600 mb-4">Clique no botão abaixo para gerar o certificado de inspeção.</p>
                  <Button onClick={gerarCertificado} disabled={loading}>
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Gerar Certificado
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          {certificado && (
            <Card>
              <CardHeader>
                <CardTitle>Ações do Certificado</CardTitle>
                <CardDescription>
                  Aprovar, emitir ou rejeitar o certificado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  {podeAprovar && (
                    <Button
                      onClick={aprovarCertificado}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Award className="w-4 h-4 mr-2" />
                      )}
                      Aprovar Certificado
                    </Button>
                  )}

                  {podeEmitir && (
                    <Button
                      onClick={emitirCertificado}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Emitir Certificado
                    </Button>
                  )}

                  {podeRejeitar && (
                    <Button
                      onClick={rejeitarCertificado}
                      disabled={loading}
                      variant="destructive"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Rejeitar Certificado
                    </Button>
                  )}

                  {status === 'emitido' && (
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, CheckCircle, AlertCircle, Loader, X, FileText, Edit, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarcasJangada } from '@/hooks/use-marcas-jangada';
import { useModelosJangada } from '@/hooks/use-modelos-jangada';
import { useLotacoesJangada } from '@/hooks/use-lotacoes-jangada';

interface QuadroImportResult {
  success: boolean;
  jangada?: any;
  componentes: {
    interiores: any[];
    exteriores: any[];
    pack: any[];
  };
  cilindros?: any[];
  certificado?: any;
  errors: string[];
  warnings: string[];
  confianca: number;
  stockSync?: {
    totalComponents: number;
    updates: Array<{
      nome: string;
      action: 'created' | 'decreased' | 'error';
      quantidade?: number;
      error?: string;
    }>;
  };
}

interface EditedData {
  numeroSerie: string;
  marcaId: string;
  modeloId: string;
  lotacaoId: string;
  dataFabricacao: string;
  certificadoNumero: string;
  certificadoTipo: string;
  certificadoDataEmissao: string;
  certificadoDataValidade: string;
  cilindros: any[];
}

export function QuadroInspecaoUploadDialog() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuadroImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<EditedData | null>(null);
  const queryClient = useQueryClient();

  // Hooks para dados de referência
  const { data: marcasResponse } = useMarcasJangada();
  const { data: modelosResponse } = useModelosJangada();
  const { data: lotacoesResponse } = useLotacoesJangada();

  const marcas = marcasResponse?.data || [];
  const modelos = modelosResponse?.data || [];
  const lotacoes = lotacoesResponse?.data || [];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    setIsLoading(true);

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        setError('Apenas arquivos Excel (.xlsx ou .xls) são suportados');
        setIsLoading(false);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Arquivo muito grande. Tamanho máximo: 10MB');
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/jangadas/import-quadro', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao processar ficheiro';
        const details = data.details ? ` - ${data.details}` : '';
        const suggestion = data.suggestion ? `\n\n${data.suggestion}` : '';
        setError(`${errorMessage}${details}${suggestion}`);
        return;
      }

      setResult(data);
      if (!data.success) {
        setError('Erro ao processar: ' + data.errors.join(', '));
      } else {
        // Initialize edited data with the extracted data
        setEditedData({
          numeroSerie: data.jangada?.numeroSerie || '',
          marcaId: data.jangada?.marca?.id || '',
          modeloId: data.jangada?.modelo?.id || '',
          lotacaoId: data.jangada?.lotacao?.id || '',
          dataFabricacao: data.jangada?.dataFabricacao ? new Date(data.jangada.dataFabricacao).getFullYear().toString() : '',
          certificadoNumero: data.certificado?.numero || '',
          certificadoTipo: data.certificado?.tipo || 'CERTIFICADO_INSPECAO',
          certificadoDataEmissao: data.certificado?.dataEmissao ? new Date(data.certificado.dataEmissao).toISOString().split('T')[0] : '',
          certificadoDataValidade: data.certificado?.dataValidade ? new Date(data.certificado.dataValidade).toISOString().split('T')[0] : '',
          cilindros: data.cilindros || []
        });
        // Invalidate jangadas cache to refresh the list
        queryClient.invalidateQueries({ queryKey: ['jangadas'] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError(null);
    setIsEditing(false);
    setEditedData(null);
  };

  const handleSaveEditedData = async () => {
    if (!editedData || !result) return;

    setIsLoading(true);
    try {
      // Update jangada
      const jangadaData: any = {
        numeroSerie: editedData.numeroSerie || result.jangada?.numeroSerie,
        tipo: result.jangada?.tipo || 'Jangada',
        status: result.jangada?.status || 'ativo',
        estado: result.jangada?.estado || 'instalada',
      };

      if (editedData.marcaId) jangadaData.marcaId = editedData.marcaId;
      if (editedData.modeloId) jangadaData.modeloId = editedData.modeloId;
      if (editedData.lotacaoId) jangadaData.lotacaoId = editedData.lotacaoId;
      if (editedData.dataFabricacao) {
        jangadaData.dataFabricacao = new Date(parseInt(editedData.dataFabricacao), 0, 1);
      }

      // Prepare certificado data if provided
      let certificadoData: any = null;
      if (editedData.certificadoNumero) {
        certificadoData = {
          numero: editedData.certificadoNumero,
          tipo: editedData.certificadoTipo || 'CERTIFICADO_INSPECAO',
          entidadeEmissora: 'OREY',
          jangada: { connect: { numeroSerie: jangadaData.numeroSerie } }
        };

        if (editedData.certificadoDataEmissao) {
          certificadoData.dataEmissao = new Date(editedData.certificadoDataEmissao);
        }

        if (editedData.certificadoDataValidade) {
          certificadoData.dataValidade = new Date(editedData.certificadoDataValidade);
        }
      }

      // Save via API
      const response = await fetch('/api/quadro/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jangadaData,
          certificadoData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar dados');
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['jangadas'] });
      setIsEditing(false);
      setEditedData(null);
    } catch (error: any) {
      setError(`Erro ao salvar dados editados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Importar Quadro de Inspeção
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Quadro de Inspeção da Jangada</DialogTitle>
          <DialogDescription>
            Carregue um ficheiro Excel com o layout do Quadro de Inspeção da OREY
          </DialogDescription>
        </DialogHeader>

        {!result && !error && (
          <div className="space-y-4">
            {/* Upload Area */}
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative block w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors',
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              )}
            >
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <p className="font-semibold text-gray-700">
                  Arraste ficheiro ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Excel (.xlsx) - Quadro de Inspeção da Jangada
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                disabled={isLoading}
                className="hidden"
              />
            </label>

            {/* Info Box */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-sm text-blue-900">
                <p className="font-semibold mb-2">Informações esperadas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Número de série da jangada</li>
                  <li>Marca e modelo</li>
                  <li>Lotação (capacidade)</li>
                  <li>Data de inspeção e próxima inspeção</li>
                  <li>Componentes interiores, exteriores e de pack</li>
                  <li>Válidades dos componentes</li>
                  <li>Informações dos cilindros CO2</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Loader className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Analisando documento com IA...
                  </p>
                  <p className="text-sm text-blue-700">
                    Extraindo dados do Quadro de Inspeção
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={resetForm} variant="outline" className="w-full">
              Tentar Novamente
            </Button>
          </div>
        )}

        {/* Success State */}
        {result && !isLoading && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Documento analisado com sucesso
              </AlertDescription>
            </Alert>

            {result.confianca < 100 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900">
                  Confiança da análise: {result.confianca}% - Verifique os dados extraídos
                </AlertDescription>
              </Alert>
            )}

            {/* Jangada Info */}
            {result.jangada && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Jangada Importada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Número de Série</p>
                      <p className="font-mono font-semibold">{result.jangada.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Marca</p>
                      <p className="font-semibold">{result.jangada.marca?.nome || result.jangada.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Modelo</p>
                      <p className="font-semibold">{result.jangada.modelo?.nome || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lotação</p>
                      <p className="font-semibold">{result.jangada.lotacao?.capacidade ? `${result.jangada.lotacao.capacidade} pessoas` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Data de Fabricação</p>
                      <p className="font-semibold">{result.jangada.dataFabricacao ? new Date(result.jangada.dataFabricacao).getFullYear() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant="outline">{result.jangada.status}</Badge>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600">
                      ✅ A jangada foi salva no sistema e aparecerá na lista de jangadas
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados Extraídos Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Dados Extraídos do Documento
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEditedData}
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Salvar
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  {isEditing
                    ? "Edite os dados extraídos antes de salvar"
                    : "Informações identificadas automaticamente pelo sistema de IA"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Jangada</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">Número de Série</label>
                          {isEditing ? (
                            <Input
                              value={editedData?.numeroSerie || ''}
                              onChange={(e) => setEditedData((prev: EditedData | null) => ({ ...prev!, numeroSerie: e.target.value }))}
                              placeholder="Número de série"
                            />
                          ) : (
                            <p className="font-mono text-sm">{result.jangada?.numeroSerie || 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Marca</label>
                          {isEditing ? (
                            <Select
                              value={editedData?.marcaId || ''}
                              onValueChange={(value) => {
                                setEditedData((prev: EditedData | null) => ({
                                  ...prev!,
                                  marcaId: value,
                                  modeloId: '' // Reset modelo when marca changes
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a marca" />
                              </SelectTrigger>
                              <SelectContent>
                                {marcas.map((marca: any) => (
                                  <SelectItem key={marca.id} value={marca.id}>
                                    {marca.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{result.jangada?.marca?.nome || 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Modelo</label>
                          {isEditing ? (
                            <Select
                              value={editedData?.modeloId || ''}
                              onValueChange={(value) => setEditedData((prev: EditedData | null) => ({ ...prev!, modeloId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {modelos
                                  .filter((modelo: any) => !editedData?.marcaId || modelo.marcaId === editedData.marcaId)
                                  .map((modelo: any) => (
                                    <SelectItem key={modelo.id} value={modelo.id}>
                                      {modelo.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{result.jangada?.modelo?.nome || 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Lotação</label>
                          {isEditing ? (
                            <Select
                              value={editedData?.lotacaoId || ''}
                              onValueChange={(value) => setEditedData((prev: EditedData | null) => ({ ...prev!, lotacaoId: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a lotação" />
                              </SelectTrigger>
                              <SelectContent>
                                {lotacoes.map((lotacao: any) => (
                                  <SelectItem key={lotacao.id} value={lotacao.id}>
                                    {lotacao.capacidade} pessoas
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{result.jangada?.lotacao?.capacidade ? `${result.jangada.lotacao.capacidade} pessoas` : 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Ano de Fabricação</label>
                          {isEditing ? (
                            <Input
                              value={editedData?.dataFabricacao || ''}
                              onChange={(e) => setEditedData((prev: EditedData | null) => ({ ...prev!, dataFabricacao: e.target.value }))}
                              placeholder="Ano de fabricação"
                            />
                          ) : (
                            <p className="text-sm">{result.jangada?.dataFabricacao ? new Date(result.jangada.dataFabricacao).getFullYear() : 'Não identificado'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Cilindro CO2</h4>
                      <div className="space-y-2">
                        {isEditing ? (
                          editedData?.cilindros && editedData.cilindros.length > 0 ? (
                            editedData.cilindros.map((cil: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-blue-200 pl-3 space-y-2">
                                <div>
                                  <label className="text-xs text-gray-500">Número</label>
                                  <Input
                                    value={cil.numero || ''}
                                    onChange={(e) => {
                                      const newCilindros = [...editedData.cilindros];
                                      newCilindros[idx] = { ...newCilindros[idx], numero: e.target.value };
                                      setEditedData((prev: EditedData | null) => ({ ...prev!, cilindros: newCilindros }));
                                    }}
                                    placeholder="Número do cilindro"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Tipo</label>
                                  <Input
                                    value={cil.tipo || ''}
                                    onChange={(e) => {
                                      const newCilindros = [...editedData.cilindros];
                                      newCilindros[idx] = { ...newCilindros[idx], tipo: e.target.value };
                                      setEditedData((prev: EditedData | null) => ({ ...prev!, cilindros: newCilindros }));
                                    }}
                                    placeholder="Tipo do cilindro"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Pressão (bar)</label>
                                  <Input
                                    value={cil.pressao || ''}
                                    onChange={(e) => {
                                      const newCilindros = [...editedData.cilindros];
                                      newCilindros[idx] = { ...newCilindros[idx], pressao: e.target.value };
                                      setEditedData((prev: EditedData | null) => ({ ...prev!, cilindros: newCilindros }));
                                    }}
                                    placeholder="Pressão em bar"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Validade</label>
                                  <Input
                                    value={cil.validade || ''}
                                    onChange={(e) => {
                                      const newCilindros = [...editedData.cilindros];
                                      newCilindros[idx] = { ...newCilindros[idx], validade: e.target.value };
                                      setEditedData((prev: EditedData | null) => ({ ...prev!, cilindros: newCilindros }));
                                    }}
                                    placeholder="Data de validade"
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum cilindro identificado</p>
                          )
                        ) : (
                          result.cilindros && result.cilindros.length > 0 ? (
                            result.cilindros.map((cil: any, idx: number) => (
                              <div key={idx} className="border-l-2 border-blue-200 pl-3">
                                <p><span className="font-medium">Número:</span> {cil.numero || 'N/A'}</p>
                                <p><span className="font-medium">Tipo:</span> {cil.tipo || 'N/A'}</p>
                                <p><span className="font-medium">Pressão:</span> {cil.pressao ? `${cil.pressao} bar` : 'N/A'}</p>
                                <p><span className="font-medium">Validade:</span> {cil.validade || 'N/A'}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-sm">Nenhum cilindro identificado</p>
                          )
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-gray-700">Certificado</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">Número do Certificado</label>
                          {isEditing ? (
                            <Input
                              value={editedData?.certificadoNumero || ''}
                              onChange={(e) => setEditedData((prev: EditedData | null) => ({ ...prev!, certificadoNumero: e.target.value }))}
                              placeholder="Número do certificado"
                            />
                          ) : (
                            <p className="text-sm">{result.certificado?.numero || 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Tipo</label>
                          {isEditing ? (
                            <Select
                              value={editedData?.certificadoTipo || ''}
                              onValueChange={(value) => setEditedData((prev: EditedData | null) => ({ ...prev!, certificadoTipo: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CERTIFICADO_INSPECAO">Certificado de Inspeção</SelectItem>
                                <SelectItem value="CERTIFICADO_APROVACAO">Certificado de Aprovação</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm">{result.certificado?.tipo || 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Data de Emissão</label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editedData?.certificadoDataEmissao || ''}
                              onChange={(e) => setEditedData((prev: EditedData | null) => ({ ...prev!, certificadoDataEmissao: e.target.value }))}
                            />
                          ) : (
                            <p className="text-sm">{result.certificado?.dataEmissao ? new Date(result.certificado.dataEmissao).toLocaleDateString('pt-PT') : 'Não identificado'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Data de Validade</label>
                          {isEditing ? (
                            <Input
                              type="date"
                              value={editedData?.certificadoDataValidade || ''}
                              onChange={(e) => setEditedData((prev: EditedData | null) => ({ ...prev!, certificadoDataValidade: e.target.value }))}
                            />
                          ) : (
                            <p className="text-sm">{result.certificado?.dataValidade ? new Date(result.certificado.dataValidade).toLocaleDateString('pt-PT') : 'Não identificado'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Componentes Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Componentes Extraídos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Interiores</p>
                    <p className="text-2xl font-bold">{result.componentes?.interiores?.length || 0}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Exteriores</p>
                    <p className="text-2xl font-bold">{result.componentes?.exteriores?.length || 0}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Pack</p>
                    <p className="text-2xl font-bold">{result.componentes?.pack?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cilindros CO2 */}
            {result.cilindros && result.cilindros.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Cilindros CO2</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {result.cilindros.map((cil, idx) => (
                      <div key={idx} className="p-2 border rounded text-sm">
                        <p className="font-mono font-semibold">{cil.numero}</p>
                        <p className="text-gray-600">
                          {cil.tipo} • Pressão: {cil.pressao} bar • Validade: {cil.validade}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stock Sync */}
            {result.stockSync && result.stockSync.updates.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Stock Sincronizado</CardTitle>
                  <CardDescription>
                    {result.stockSync.totalComponents} componentes processados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-900">
                    ✓ Stock atualizado com {result.stockSync.updates.length} componentes
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <div className="text-yellow-900">
                  <p className="font-semibold mb-1">Avisos:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <div>
                  <p className="font-semibold mb-1">Erros:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {result.errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1"
              >
                Importar Outro Ficheiro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

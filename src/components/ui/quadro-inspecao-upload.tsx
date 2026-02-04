'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, CheckCircle, AlertCircle, Loader, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function QuadroInspecaoUploadDialog() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QuadroImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/jangadas/import-quadro', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao processar ficheiro');
        return;
      }

      setResult(data);
      if (!data.success) {
        setError('Erro ao processar: ' + data.errors.join(', '));
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
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">Número de Série</p>
                      <p className="font-mono font-semibold">{result.jangada.numeroSerie}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Marca</p>
                      <p className="font-semibold">{result.jangada.tipo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant="outline">{result.jangada.status}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Última Atualização</p>
                      <p className="text-sm">{new Date(result.jangada.updatedAt).toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Componentes Resumo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Componentes Extraídos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Interiores</p>
                    <p className="text-2xl font-bold">{result.componentes.interiores.length}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Exteriores</p>
                    <p className="text-2xl font-bold">{result.componentes.exteriores.length}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-xs text-slate-500">Pack</p>
                    <p className="text-2xl font-bold">{result.componentes.pack.length}</p>
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

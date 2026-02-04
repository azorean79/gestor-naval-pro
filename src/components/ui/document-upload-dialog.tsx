'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  documentType: 'certificado' | 'quadro_inspecao';
  analysis: {
    type: string;
    confidence?: number;
    navio?: any;
    jangada?: any;
    componentes?: any[];
    raw_analysis?: string;
  };
  importedNavio?: any;
  importedJangada?: any;
  navioError?: string;
  jangadaError?: string;
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

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentUploadDialog({ open, onOpenChange }: DocumentUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsDragging(false);
      setIsLoading(false);
      setResult(null);
      setError(null);
    }
  }, [open]);

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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.pdf') && !file.name.endsWith('.csv')) {
      setError('Please upload a PDF, Excel (.xlsx/.xls), or CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze document');
      }

      const data = await response.json() as AnalysisResult;
      setResult(data);

      // Refresh data after successful import
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload de Documento com IA</DialogTitle>
          <DialogDescription>
            Faça upload de um certificado, quadro de inspeção ou arquivo CSV. A IA irá analisar e importar os dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Upload Area */}
          <Card
            className={cn(
              'border-2 border-dashed transition-colors',
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CardContent className="pt-6">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <div className="text-center">
                    <p className="font-semibold text-gray-700">
                      Arraste ficheiro ou clique para selecionar
                    </p>
                    <p className="text-sm text-gray-500">
                      Excel (Certificado ou Quadro de Inspeção)
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls,.pdf,.csv"
                  onChange={handleFileInputChange}
                  disabled={isLoading}
                  className="hidden"
                />
              </label>
            </CardContent>
          </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">
                  Analisando documento...
                </p>
                <p className="text-sm text-blue-700">
                  A IA está extraindo os dados do ficheiro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {result && !isLoading && (
        <div className="space-y-3">
          {/* Document Type */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">
                    Documento Analisado com Sucesso
                  </p>
                  <p className="text-sm text-green-700">
                    Tipo: {result.documentType === 'certificado' ? 'Certificado de Navio' : 'Quadro de Inspeção'}
                    {result.analysis.confidence && (
                      <span className="ml-2">
                        • Confiança: {result.analysis.confidence}%
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navio Results */}
          {result.importedNavio && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Navio Importado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-semibold">{result.importedNavio.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Matrícula</p>
                    <p className="font-semibold">{result.importedNavio.matricula}</p>
                  </div>
                </div>
                <Badge variant="secondary">{result.importedNavio.type}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Jangada Results */}
          {result.importedJangada && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Jangada Importada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">Número de Série</p>
                    <p className="font-semibold text-sm">{result.importedJangada.numeroSerie}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Marca</p>
                    <p className="font-semibold">{result.importedJangada.marca}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Modelo</p>
                    <p className="font-semibold">{result.importedJangada.modelo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Navio</p>
                    <p className="font-semibold text-sm">{result.importedJangada.navioLinked}</p>
                  </div>
                </div>
                <Badge variant="secondary">{result.importedJangada.type}</Badge>
              </CardContent>
            </Card>
          )}

          {/* Stock Sync Results */}
          {result.stockSync && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                  Stock Sincronizado
                </CardTitle>
                <CardDescription>
                  {result.stockSync.totalComponents} componente(s) processado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.stockSync.updates.map((update: any, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                      <span className="font-medium">{update.nome}</span>
                      <div className="flex items-center gap-2">
                        {update.action === 'created' && (
                          <Badge variant="default">Criado ({update.quantidade})</Badge>
                        )}
                        {update.action === 'decreased' && (
                          <Badge variant="destructive">Usado (Stock: {update.quantidade})</Badge>
                        )}
                        {update.action === 'error' && (
                          <Badge variant="secondary">Erro</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errors */}
          {(result.navioError || result.jangadaError) && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {result.navioError && <div>Navio: {result.navioError}</div>}
                {result.jangadaError && <div>Jangada: {result.jangadaError}</div>}
              </AlertDescription>
            </Alert>
          )}

          {/* Reset Button */}
          <Button
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            variant="outline"
            className="w-full"
          >
            Carregar outro ficheiro
          </Button>
        </div>
      )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Zap, Edit3, Save, X, FileText, Database, Ship, Users, Package, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ExtractedData {
  type: 'certificado' | 'quadro_inspecao' | 'navios_csv' | 'jangadas_csv' | 'stock_csv' | 'clientes_csv' | 'boletim_servico' | 'unknown'
  confidence?: number
  navio?: any
  jangada?: any
  clientes?: any[]
  stock?: any[]
  navios?: any[]
  jangadas?: any[]
  componentes?: any[]
  cilindros?: any[]
  erros?: string[]
  avisos?: string[]
}

interface UploadStep {
  status: 'idle' | 'uploading' | 'analyzing' | 'editing' | 'saving' | 'success' | 'error'
  message: string
  data?: ExtractedData
  fileName?: string
  fileType?: string
}

export default function UploadAnalisePage() {
  const [step, setStep] = useState<UploadStep>({ status: 'idle', message: '' })
  const [isDragging, setIsDragging] = useState(false)
  const [editedData, setEditedData] = useState<ExtractedData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFile(files[0])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      await processFile(files[0])
    }
  }

  const processFile = async (file: File) => {
    // Validar tipo de ficheiro
    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.pdf']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

    if (!allowedExtensions.includes(fileExtension)) {
      setStep({
        status: 'error',
        message: '❌ Ficheiro inválido. Apenas Excel (.xlsx/.xls), CSV (.csv) e PDF (.pdf) são aceites.'
      })
      return
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setStep({
        status: 'error',
        message: '❌ Ficheiro muito grande. Tamanho máximo: 10MB.'
      })
      return
    }

    setStep({
      status: 'uploading',
      message: '📤 Enviando ficheiro...',
      fileName: file.name,
      fileType: file.type
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Se for PDF, enviar para /api/boletins, senão para /api/analyze-document
      const isBoletimPDF = fileExtension === '.pdf' && file.name.toLowerCase().includes('boletim')
      setStep({
        status: 'analyzing',
        message: isBoletimPDF ? '⚡ IA analisando boletim de serviço...' : '⚡ IA analisando dados...',
        fileName: file.name,
        fileType: file.type
      })

      const endpoint = isBoletimPDF ? '/api/boletins' : '/api/analyze-document'
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao analisar ficheiro')
      }

      const result = await response.json()

      // Se for boletim, mostrar resultado direto, senão seguir fluxo normal
      if (isBoletimPDF) {
        setStep({
          status: 'success',
          message: result.message || 'Boletim de serviço analisado e aplicado com sucesso!',
          data: { type: 'boletim_servico', ...result },
          fileName: file.name,
          fileType: file.type
        })
        setEditedData(null)
      } else {
        setStep({
          status: 'editing',
          message: '✅ Análise concluída! Edite os dados extraídos antes de submeter.',
          data: result.data,
          fileName: file.name,
          fileType: file.type
        })
        setEditedData(result.data)
      }

    } catch (error) {
      setStep({
        status: 'error',
        message: `❌ Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    }
  }

  const handleSaveData = async () => {
    if (!editedData) return

    setStep({
      ...step,
      status: 'saving',
      message: '💾 Salvando dados...'
    })

    try {
      const response = await fetch('/api/save-extracted-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: editedData,
          fileName: step.fileName,
          fileType: step.fileType
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar dados')
      }

      const result = await response.json()

      setStep({
        status: 'success',
        message: `✅ Dados salvos com sucesso! ${result.message || ''}`,
        data: editedData,
        fileName: step.fileName,
        fileType: step.fileType
      })

    } catch (error) {
      setStep({
        status: 'error',
        message: `❌ Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    }
  }

  const updateEditedData = useCallback((updates: Partial<ExtractedData>) => {
    setEditedData(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  const renderDataEditor = () => {
    if (!editedData) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Editar Dados Extraídos</h3>
          <Badge variant="outline" className="ml-auto">
            {editedData.type === 'certificado' && 'Certificado'}
            {editedData.type === 'quadro_inspecao' && 'Quadro de Inspeção'}
            {editedData.type === 'navios_csv' && 'CSV Navios'}
            {editedData.type === 'jangadas_csv' && 'CSV Jangadas'}
            {editedData.type === 'stock_csv' && 'CSV Stock'}
            {editedData.type === 'clientes_csv' && 'CSV Clientes'}
            {editedData.type === 'unknown' && 'Tipo Desconhecido'}
          </Badge>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados Principais</TabsTrigger>
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="erros">Erros/Avisos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            {editedData.type === 'jangadas_csv' && editedData.jangada && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ship className="h-5 w-5" />
                    Dados da Jangada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroSerie" className="text-slate-300">Número de Série</Label>
                      <Input
                        id="numeroSerie"
                        value={editedData.jangada.numeroSerie || ''}
                        onChange={(e) => updateEditedData({
                          jangada: { ...editedData.jangada, numeroSerie: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="marca" className="text-slate-300">Marca</Label>
                      <Input
                        id="marca"
                        value={editedData.jangada.marca || ''}
                        onChange={(e) => updateEditedData({
                          jangada: { ...editedData.jangada, marca: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modelo" className="text-slate-300">Modelo</Label>
                      <Input
                        id="modelo"
                        value={editedData.jangada.modelo || ''}
                        onChange={(e) => updateEditedData({
                          jangada: { ...editedData.jangada, modelo: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacidade" className="text-slate-300">Capacidade</Label>
                      <Input
                        id="capacidade"
                        type="number"
                        value={editedData.jangada.capacidade || ''}
                        onChange={(e) => updateEditedData({
                          jangada: { ...editedData.jangada, capacidade: parseInt(e.target.value) || 0 }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {editedData.type === 'navios_csv' && editedData.navio && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Ship className="h-5 w-5" />
                    Dados do Navio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nomeNavio" className="text-slate-300">Nome</Label>
                      <Input
                        id="nomeNavio"
                        value={editedData.navio.nome || ''}
                        onChange={(e) => updateEditedData({
                          navio: { ...editedData.navio, nome: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="matricula" className="text-slate-300">Matrícula</Label>
                      <Input
                        id="matricula"
                        value={editedData.navio.matricula || ''}
                        onChange={(e) => updateEditedData({
                          navio: { ...editedData.navio, matricula: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="imo" className="text-slate-300">IMO</Label>
                      <Input
                        id="imo"
                        value={editedData.navio.imo || ''}
                        onChange={(e) => updateEditedData({
                          navio: { ...editedData.navio, imo: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo" className="text-slate-300">Tipo</Label>
                      <Input
                        id="tipo"
                        value={editedData.navio.tipo || ''}
                        onChange={(e) => updateEditedData({
                          navio: { ...editedData.navio, tipo: e.target.value }
                        })}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {editedData.clientes && editedData.clientes.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Clientes ({editedData.clientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-400">
                    {editedData.clientes.length} clientes encontrados. Os dados serão salvos automaticamente.
                  </div>
                </CardContent>
              </Card>
            )}

            {editedData.stock && editedData.stock.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Itens de Stock ({editedData.stock.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-400">
                    {editedData.stock.length} itens de stock encontrados. Os dados serão salvos automaticamente.
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="detalhes" className="space-y-4">
            {editedData.componentes && editedData.componentes.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Componentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {editedData.componentes.map((comp, index) => (
                      <div key={index} className="p-2 bg-slate-700/30 rounded text-sm">
                        <div className="text-slate-300">{comp.nome}</div>
                        <div className="text-slate-500 text-xs">Qtd: {comp.quantidade} | Estado: {comp.estado}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {editedData.cilindros && editedData.cilindros.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Cilindros CO2</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {editedData.cilindros.map((cil, index) => (
                      <div key={index} className="p-2 bg-slate-700/30 rounded text-sm">
                        <div className="text-slate-300">{cil.tipo}</div>
                        <div className="text-slate-500 text-xs">Pressão: {cil.pressao} bar | Teste: {cil.dataProximoTeste}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="erros" className="space-y-4">
            {editedData.erros && editedData.erros.length > 0 && (
              <Card className="bg-red-500/10 border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-300 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Erros ({editedData.erros.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-red-300">
                    {editedData.erros.map((erro, index) => (
                      <li key={index}>• {erro}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {editedData.avisos && editedData.avisos.length > 0 && (
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-300 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Avisos ({editedData.avisos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-yellow-300">
                    {editedData.avisos.map((aviso, index) => (
                      <li key={index}>• {aviso}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {(!editedData.erros || editedData.erros.length === 0) &&
             (!editedData.avisos || editedData.avisos.length === 0) && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="pt-6">
                  <div className="text-center text-green-300">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                    Nenhum erro ou aviso encontrado!
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Upload e Análise Inteligente</h1>
          </div>
          <p className="text-slate-400">IA analisa automaticamente certificados, quadros de inspeção e arquivos CSV</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Upload Zone */}
        {step.status === 'idle' || step.status === 'error' ? (
          <div className="mb-12">
            <Card
              className={`border-2 border-dashed transition cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 bg-slate-800/50 hover:border-blue-500/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent className="pt-16 pb-16 text-center">
                <FileSpreadsheet className={`h-16 w-16 mx-auto mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
                <h3 className="text-2xl font-bold text-white mb-2">
                  Arraste o ficheiro aqui
                </h3>
                <p className="text-slate-400 mb-6">
                  ou clique para selecionar um ficheiro
                </p>
                <div className="space-y-2 mb-6 text-sm text-slate-500">
                  <p>✓ Certificados, quadros de inspeção e CSV</p>
                  <p>✓ Formatos: .xlsx, .xls, .csv, .pdf</p>
                  <p>✓ Tamanho máximo: 10 MB</p>
                  <p>✓ Análise automática com IA</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  Selecionar Ficheiro
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={false}
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Status Messages */}
        {step.status === 'uploading' && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                <p className="text-lg text-white">{step.message}</p>
              </div>
              <div className="mt-4 text-center text-slate-400">
                <p className="text-sm">Ficheiro: {step.fileName}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step.status === 'analyzing' && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Zap className="h-6 w-6 text-yellow-400 animate-pulse" />
                <p className="text-lg text-white">{step.message}</p>
              </div>
              <div className="space-y-2 text-sm text-slate-400 text-center">
                <p>✓ Lendo ficheiro...</p>
                <p>✓ Identificando tipo de documento...</p>
                <p>✓ Extraindo dados com IA...</p>
                <p>✓ Validando informações...</p>
              </div>
              <div className="mt-6 w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full w-2/3 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        )}

        {step.status === 'editing' && (
          <div className="space-y-6">
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Edit3 className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                {step.message}
              </AlertDescription>
            </Alert>

            {renderDataEditor()}

            <div className="flex gap-4 pt-6">
              <Button
                onClick={handleSaveData}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep({ status: 'idle', message: '' })
                  setEditedData(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="flex-1 h-12"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {step.status === 'saving' && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 text-green-400 animate-spin" />
                <p className="text-lg text-white">{step.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step.status === 'error' && (
          <Alert className="bg-red-500/10 border-red-500/30 mb-12">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {step.message}
            </AlertDescription>
          </Alert>
        )}

        {step.status === 'success' && (
          <div className="space-y-6">
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                {step.message}
              </AlertDescription>
            </Alert>

            <div className="flex gap-4 pt-6">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-12"
              >
                <Database className="h-4 w-4 mr-2" />
                Ir para Dashboard
              </Button>
              <Button
                onClick={() => {
                  setStep({ status: 'idle', message: '' })
                  setEditedData(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="flex-1 h-12"
              >
                ↻ Upload Outro Ficheiro
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 Tipos de Ficheiro Suportados</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (.xlsx/.xls)
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Quadros de inspeção de jangadas</li>
                  <li>Certificados de manutenção</li>
                  <li>Relatórios de stock</li>
                  <li>Dados de clientes</li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  CSV (.csv)
                </h4>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Listas de navios</li>
                  <li>Inventários de jangadas</li>
                  <li>Dados de clientes</li>
                  <li>Relatórios de stock</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-white font-semibold mb-2">🤖 Análise com IA</h4>
              <p>A IA identifica automaticamente o tipo de documento e extrai os dados relevantes, permitindo edição antes da importação para o sistema.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
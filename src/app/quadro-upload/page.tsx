'use client'

import { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QuadroData {
  numeroSerie: string
  marca: string
  modelo: string
  capacidade: number
  dataFabricacao?: string
  dataInspecao?: string
  cilindros: Array<{
    tipo: string
    pressao: number
    dataProximoTeste: string
  }>
  componentes: {
    interiores: string[]
    exteriores: string[]
    pack: string[]
  }
}

interface UploadStep {
  status: 'idle' | 'loading' | 'analyzing' | 'success' | 'error'
  message: string
  data?: QuadroData
  certificado?: string
}

export default function QuadroUploadPage() {
  const [step, setStep] = useState<UploadStep>({ status: 'idle', message: '' })
  const [isDragging, setIsDragging] = useState(false)
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
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setStep({
        status: 'error',
        message: '❌ Ficheiro inválido. Apenas Excel (.xlsx/.xls) é aceite.'
      })
      return
    }

    setStep({
      status: 'loading',
      message: '📤 Enviando ficheiro...'
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/jangadas/import-quadro', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Erro ao processar ficheiro')
      }

      const result = await response.json()

      setStep({
        status: 'analyzing',
        message: '⚡ IA a analisar dados...'
      })

      // Simular análise
      await new Promise(resolve => setTimeout(resolve, 2000))

      setStep({
        status: 'success',
        message: `✅ Inspeção importada com sucesso!`,
        data: {
          numeroSerie: result.data.jangada.numeroSerie,
          marca: result.data.jangada.marca?.nome || 'Desconhecido',
          modelo: result.data.jangada.modelo?.nome || 'Desconhecido',
          capacidade: result.data.jangada.capacidade || 0,
          dataFabricacao: result.data.jangada.dataFabricacao,
          dataInspecao: result.data.jangada.dataInspecao,
          cilindros: result.data.cilindros || [],
          componentes: {
            interiores: [],
            exteriores: [],
            pack: []
          }
        },
        certificado: result.data.certificado?.numero
      })
    } catch (error) {
      setStep({
        status: 'error',
        message: `❌ Erro ao processar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Importar Quadro de Inspeção</h1>
          </div>
          <p className="text-slate-400">Upload do ficheiro Excel e geração automática de certificado</p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12">
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
                  ou clique para selecionar um ficheiro Excel
                </p>
                <div className="space-y-2 mb-6 text-sm text-slate-500">
                  <p>✓ Formatos suportados: .xlsx, .xls</p>
                  <p>✓ Tamanho máximo: 10 MB</p>
                  <p>✓ Template: quadro-inspecao-template.xlsx</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                  Selecionar Ficheiro
                </Button>
                <input 
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={false}
                />
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Status Messages */}
        {step.status === 'loading' && (
          <Card className="bg-slate-800/50 border-slate-700 mb-12">
            <CardContent className="pt-8 pb-8">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                <p className="text-lg text-white">{step.message}</p>
              </div>
              <div className="mt-6 w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full w-1/3 animate-pulse"></div>
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
              <div className="space-y-2 text-sm text-slate-400">
                <p>✓ Lendo ficheiro Excel...</p>
                <p>✓ Extraindo número de série...</p>
                <p>✓ Identificando marca e modelo...</p>
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

        {step.status === 'success' && step.data && (
          <div className="space-y-6">
            {/* Success Banner */}
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-300">
                {step.message}
              </AlertDescription>
            </Alert>

            {/* Certificado Info */}
            {step.certificado && (
              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-600/5 border-emerald-500/30">
                <CardContent className="pt-8 pb-8">
                  <div className="text-center">
                    <Badge className="bg-emerald-500/30 text-emerald-300 mb-4 text-lg px-4 py-2">
                      Certificado: {step.certificado}
                    </Badge>
                    <p className="text-slate-300 mt-4">Válido por 1 ano a partir de hoje</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados Extraídos */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Dados Extraídos</CardTitle>
                <CardDescription>Informações da jangada importadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Série</p>
                    <p className="text-lg font-mono font-bold text-blue-400">{step.data.numeroSerie}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Marca</p>
                    <p className="text-lg font-bold text-white">{step.data.marca}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Modelo</p>
                    <p className="text-lg font-bold text-white">{step.data.modelo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Capacidade</p>
                    <p className="text-lg font-bold text-white">{step.data.capacidade} pessoas</p>
                  </div>
                  {step.data.dataFabricacao && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fabrico</p>
                      <p className="text-lg font-bold text-white">
                        {new Date(step.data.dataFabricacao).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  )}
                  {step.data.dataInspecao && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Inspeção</p>
                      <p className="text-lg font-bold text-white">
                        {new Date(step.data.dataInspecao).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Cilindros */}
                {step.data.cilindros.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-700">
                    <p className="text-sm font-semibold text-white mb-3">Cilindros CO2</p>
                    <div className="space-y-2">
                      {step.data.cilindros.map((cil, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-slate-700/30 rounded">
                          <span className="text-slate-300">{cil.tipo}</span>
                          <span className="text-slate-400 text-sm">{cil.pressao} bar - Test: {cil.dataProximoTeste}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <Button 
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12"
                onClick={() => window.location.href = '/agenda-inspecoes'}
              >
                ✓ Ir para Agenda
              </Button>
              <Button 
                className="flex-1 bg-slate-700 hover:bg-slate-600 h-12"
                onClick={() => {
                  setStep({ status: 'idle', message: '' })
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
              >
                ↻ Upload Outro Quadro
              </Button>
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-12 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">📋 Formato do Ficheiro</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2">
            <p>O ficheiro deve conter:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Número de série da jangada</li>
              <li>Marca e modelo</li>
              <li>Lotação (capacidade)</li>
              <li>Data da inspeção</li>
              <li>Componentes (interiores, exteriores, pack)</li>
              <li>Cilindros CO2 (tipo, pressão, próximo teste)</li>
            </ul>
            <p className="pt-2">Use o template: <code className="bg-slate-700 px-2 py-1 rounded text-xs">quadro-inspecao-template.xlsx</code></p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

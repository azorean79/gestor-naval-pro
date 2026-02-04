"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  templateUrl: string
  endpoint: string
  onSuccess?: () => void
  acceptedFormats?: string
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateUrl,
  endpoint,
  onSuccess,
  acceptedFormats = ".csv,.xlsx,.pdf"
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: number
    errors: number
    messages: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setUploadResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo para importar')
      return
    }

    setIsUploading(true)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar arquivo')
      }

      setUploadResult({
        success: result.success || 0,
        errors: result.errors || 0,
        messages: result.messages || []
      })

      if (result.success > 0) {
        toast.success(`${result.success} registro(s) importado(s) com sucesso!`)
        onSuccess?.()
      }

      if (result.errors > 0) {
        toast.warning(`${result.errors} erro(s) encontrado(s) durante a importação`)
      }

    } catch (error) {
      console.error('Erro ao importar:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao importar arquivo')
      setUploadResult({
        success: 0,
        errors: 1,
        messages: [error instanceof Error ? error.message : 'Erro desconhecido']
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = templateUrl.split('/').pop() || 'template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Template baixado com sucesso!')
  }

  const handleClose = () => {
    setFile(null)
    setUploadResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium">Template de Importação</p>
                <p className="text-sm text-muted-foreground">
                  Baixe o modelo para preencher os dados
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Arquivo para Importar</Label>
            <Input
              id="file-upload"
              type="file"
              accept={acceptedFormats}
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: CSV, XLSX, PDF
            </p>
          </div>

          {/* Selected File Info */}
          {file && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Arquivo selecionado:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="space-y-2">
              <Alert variant={uploadResult.errors > 0 ? "destructive" : "default"}>
                {uploadResult.errors > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">
                      Importação concluída: {uploadResult.success} sucesso, {uploadResult.errors} erro(s)
                    </p>
                    {uploadResult.messages.length > 0 && (
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        {uploadResult.messages.slice(0, 5).map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                        {uploadResult.messages.length > 5 && (
                          <li className="text-muted-foreground">
                            ... e mais {uploadResult.messages.length - 5} mensagem(ns)
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {uploadResult ? 'Fechar' : 'Cancelar'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

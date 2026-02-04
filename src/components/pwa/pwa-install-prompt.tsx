'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, Smartphone, CheckCircle, X } from 'lucide-react'
import { usePWA } from '@/hooks/use-device'
import { toast } from 'sonner'

interface PWAInstallPromptProps {
  compact?: boolean
}

export function PWAInstallPrompt({ compact = false }: PWAInstallPromptProps) {
  const { isInstalled, canInstall, installPWA } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  const handleInstall = async () => {
    const installed = await installPWA()
    if (installed) {
      toast.success('App instalado com sucesso!')
    } else {
      toast.info('Instalação cancelada')
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed || !canInstall) {
    return null
  }

  if (compact) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
        <Card className="bg-blue-600 text-white border-blue-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">Instalar App</p>
                  <p className="text-xs opacity-90">Acesso rápido offline</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstall}
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-white hover:bg-blue-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-blue-900 dark:text-blue-100 flex items-center">
          <Smartphone className="h-5 w-5 mr-2" />
          Instalar Aplicativo
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          Transforme o Gestor Naval em um aplicativo nativo no seu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Acesso offline</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Notificações push</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm">Interface otimizada</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              <X className="h-4 w-4 mr-2" />
              Agora não
            </Button>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400">
            <p>• Funciona em Android, iOS, Windows e macOS</p>
            <p>• Sem necessidade de App Store ou Play Store</p>
            <p>• Mesmo login e dados da versão web</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
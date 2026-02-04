'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Bell, Moon, Palette, Lock, User, Database, Download } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [dataRetention, setDataRetention] = useState('12')
  const [theme, setTheme] = useState('blue')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simular save
    setTimeout(() => {
      setIsSaving(false)
      alert('Configurações guardadas com sucesso!')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as preferências da aplicação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  <User className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Palette className="h-4 w-4 mr-2" />
                  Aparência
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Dados
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Segurança
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Controle como e quando recebe notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificações do Sistema</Label>
                    <p className="text-sm text-muted-foreground">Receber alertas de inspeções e manutenções pendentes</p>
                  </div>
                  <Checkbox
                    checked={notifications}
                    onCheckedChange={(checked) => setNotifications(checked as boolean)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">Enviar resumos e alertas por email</p>
                  </div>
                  <Checkbox
                    checked={emailNotifications}
                    onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Aparência */}
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize a aparência da aplicação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Tema</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue">Azul (Padrão)</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="purple">Roxo</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Modo Escuro</Label>
                    <p className="text-sm text-muted-foreground">Usar tema escuro</p>
                  </div>
                  <Checkbox
                    checked={isDarkMode}
                    onCheckedChange={(checked) => setIsDarkMode(checked as boolean)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dados */}
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Dados</CardTitle>
                <CardDescription>Configurações de armazenamento e backup</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Retenção de Dados</Label>
                  <Select value={dataRetention} onValueChange={setDataRetention}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses (1 ano)</SelectItem>
                      <SelectItem value="24">24 meses (2 anos)</SelectItem>
                      <SelectItem value="36">36 meses (3 anos)</SelectItem>
                      <SelectItem value="60">5 anos</SelectItem>
                      <SelectItem value="indefinido">Indefinido</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">Dados históricos serão mantidos por {dataRetention === 'indefinido' ? 'indefinidamente' : dataRetention + ' meses'}</p>
                </div>
                <div className="space-y-3">
                  <Label>Espaço em Uso</Label>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-sm text-muted-foreground">6.5 GB de 10 GB utilizado</p>
                </div>
                <Button variant="outline" className="w-full">
                  Fazer Backup Agora
                </Button>
              </CardContent>
            </Card>

            {/* Templates de Importação */}
            <Card>
              <CardHeader>
                <CardTitle>Templates de Importação</CardTitle>
                <CardDescription>Baixe templates CSV para importar dados em massa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Template de Navios</h4>
                      <p className="text-sm text-muted-foreground">Importar navios com dados completos</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/templates/navios-template.csv" download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Template de Clientes</h4>
                      <p className="text-sm text-muted-foreground">Importar clientes e empresas</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/templates/clientes-template.csv" download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Template de Jangadas</h4>
                      <p className="text-sm text-muted-foreground">Importar jangadas salva-vidas</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/templates/jangadas-template.csv" download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Template de Stock</h4>
                      <p className="text-sm text-muted-foreground">Importar itens de inventário</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href="/templates/stock-template.csv" download>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como usar:</h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>1. Baixe o template CSV correspondente</li>
                    <li>2. Preencha os dados seguindo o formato do exemplo</li>
                    <li>3. Vá para a página de importação de cada módulo</li>
                    <li>4. Selecione o arquivo e faça o upload</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Configurações'}
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

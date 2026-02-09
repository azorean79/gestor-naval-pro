'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplet,
  Wind,
  Battery,
  Lightbulb,
  Shield,
  Gauge,
  Save,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { pt } from 'date-fns/locale'
import { format } from 'date-fns'
import { ChecklistInspecaoManual } from '@/components/checklist-inspecao-manual'
import { regrasLegislacao } from '@/legislacao/regras-legislacao'
  // Filtrar regras de legislação aplicáveis a inspeção/checklist
  const alertasLegislacao = regrasLegislacao.filter(r => r.aplicaEm.includes('inspecao') || r.aplicaEm.includes('checklist'));

interface ChecklistItem {
  id: string
  nome: string
  categoria: string
  descricao?: string
  verificado: boolean
  observacoes?: string
  resultado?: string
}

interface TestePressurao {
  id: string
  cilindroNumero: string
  tipoCilindro: 'CO2' | 'N2' | 'Ar'
  pressaoEsperada: number
  pressaoMedida: number | null
  unidade: 'bar' | 'psi'
  aprovado: boolean | null
  observacoes?: string
  data: Date
}

export default function ChecklistInspecaoPage() {
  const params = useParams()
  const inspecaoId = params.id as string

  const [activeTab, setActiveTab] = useState('componentes')

  // Buscar dados da inspeção e jangada
  const { data: inspecaoData } = useQuery({
    queryKey: ['inspecao', inspecaoId],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes/${inspecaoId}`)
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!inspecaoId
  })

  const inspecao = inspecaoData?.data || inspecaoData?.inspecao
  const jangada = inspecao?.jangada

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Componentes Interiores
    {
      id: '1',
      nome: 'Coletes Salva-Vidas',
      categoria: 'interiores',
      descricao: 'Quantidade correta, sem danos visíveis',
      verificado: false,
    },
    {
      id: '2',
      nome: 'EPIRB',
      categoria: 'interiores',
      descricao: 'Funcionando, bateria OK',
      verificado: false,
    },
    {
      id: '3',
      nome: 'Sinalizadores Fumígenos',
      categoria: 'interiores',
      descricao: 'Cantidad e validade OK',
      verificado: false,
    },
    {
      id: '4',
      nome: 'Sinalizadores Luminosos',
      categoria: 'interiores',
      descricao: 'Quantidade e validade OK',
      verificado: false,
    },
    {
      id: '5',
      nome: 'Espelho de Sinalização',
      categoria: 'interiores',
      descricao: 'Limpo, sem riscos',
      verificado: false,
    },
    {
      id: '6',
      nome: 'Kit de Primeiros Socorros',
      categoria: 'interiores',
      descricao: 'Completo, validade OK',
      verificado: false,
    },

    // Componentes Exteriores
    {
      id: '7',
      nome: 'Proteções de Juntas',
      categoria: 'exteriores',
      descricao: 'Sem corrosão, bem ajustadas',
      verificado: false,
    },
    {
      id: '8',
      nome: 'Válvulas Atenuadora',
      categoria: 'exteriores',
      descricao: 'Funcionamento OK',
      verificado: false,
    },
    {
      id: '9',
      nome: 'Amarras Técnicas',
      categoria: 'exteriores',
      descricao: 'Resistência OK',
      verificado: false,
    },
    {
      id: '10',
      nome: 'Escada',
      categoria: 'exteriores',
      descricao: 'Íntegra, sem danos',
      verificado: false,
    },

    // Componentes Pack
    {
      id: '11',
      nome: 'Rações de Emergência',
      categoria: 'pack',
      descricao: 'Quantidade correta, validade OK',
      verificado: false,
    },
    {
      id: '12',
      nome: 'Água Potável',
      categoria: 'pack',
      descricao: 'Quantidade correta, embalagem OK',
      verificado: false,
    },
    {
      id: '13',
      nome: 'Fachos de Mão',
      categoria: 'pack',
      descricao: 'Cantidad e validade OK',
      verificado: false,
    },
    {
      id: '14',
      nome: 'Foguetes com Paraquedas',
      categoria: 'pack',
      descricao: 'Cantidad e validade OK',
      verificado: false,
    },

    // Cilindros
    {
      id: '15',
      nome: 'Cilindro CO2 #1',
      categoria: 'cilindros',
      descricao: 'Teste de pressão requerido',
      verificado: false,
    },
    {
      id: '16',
      nome: 'Cilindro CO2 #2',
      categoria: 'cilindros',
      descricao: 'Teste de pressão requerido',
      verificado: false,
    },

    // Câmaras
    {
      id: '17',
      nome: 'Câmara Inferior - Válvula de Atestar',
      categoria: 'camaras',
      descricao: 'Válida para teste',
      verificado: false,
    },
    {
      id: '18',
      nome: 'Câmara Superior - Válvula de Atestar',
      categoria: 'camaras',
      descricao: 'Válida para teste',
      verificado: false,
    },

    // Iluminação e Baterias
    {
      id: '19',
      nome: 'Luz Exterior',
      categoria: 'iluminacao',
      descricao: 'Bateria de lítio validade OK',
      verificado: false,
    },
    {
      id: '20',
      nome: 'Luz Interior',
      categoria: 'iluminacao',
      descricao: 'Bateria de lítio validade OK',
      verificado: false,
    },
  ])

  const [testesPressao, setTestesPressao] = useState<TestePressurao[]>([
    {
      id: '1',
      cilindroNumero: '17W63103',
      tipoCilindro: 'CO2',
      pressaoEsperada: 57.25,
      pressaoMedida: null,
      unidade: 'bar',
      aprovado: null,
      data: new Date(),
    },
    {
      id: '2',
      cilindroNumero: '17W63104',
      tipoCilindro: 'CO2',
      pressaoEsperada: 55.0,
      pressaoMedida: null,
      unidade: 'bar',
      aprovado: null,
      data: new Date(),
    },
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleToggleItem = (id: string) => {
    setChecklistItems(
      checklistItems.map((item) =>
        item.id === id ? { ...item, verificado: !item.verificado } : item
      )
    )
  }

  const handleUpdateTeste = (
    id: string,
    field: keyof TestePressurao,
    value: any
  ) => {
    setTestesPressao(
      testesPressao.map((teste) => {
        if (teste.id === id) {
          const updated = { ...teste, [field]: value }
          // Auto-calcular aprovação
          if (field === 'pressaoMedida' && value !== null) {
            const diferenca = Math.abs(
              updated.pressaoMedida! - updated.pressaoEsperada!
            )
            const percentualDiferenca = (diferenca / updated.pressaoEsperada!) * 100
            updated.aprovado = percentualDiferenca <= 10 // 10% de tolerância
          }
          return updated
        }
        return teste
      })
    )
  }

  const handleSalvarChecklist = async () => {
    setIsSubmitting(true)
    try {
      const verificadosCount = checklistItems.filter(
        (item) => item.verificado
      ).length

      // Validar se todos os testes de pressão foram realizados
      const testesIncompletos = testesPressao.some(
        (teste) => teste.pressaoMedida === null
      )

      if (testesIncompletos) {
        toast.error('Complete todos os testes de pressão')
        setIsSubmitting(false)
        return
      }

      const payload = {
        inspecaoId,
        checklistItens: checklistItems,
        testesPressao: testesPressao,
        resumo: {
          totalItens: checklistItems.length,
          verificados: verificadosCount,
          percentualConclusao: Math.round((verificadosCount / checklistItems.length) * 100),
          testesPressaoRealizados: testesPressao.length,
          testesPressaoAprovados: testesPressao.filter(
            (t) => t.aprovado === true
          ).length,
          dataChecklist: new Date().toISOString(),
        },
      }

      const response = await fetch(`/api/inspecoes/${inspecaoId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar checklist')
      }

      toast.success('Checklist salvo com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar checklist'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const verificadosCount = checklistItems.filter(
    (item) => item.verificado
  ).length
  const percentualConclusao = Math.round(
    (verificadosCount / checklistItems.length) * 100
  )
  const testesPressaoAprovados = testesPressao.filter(
    (t) => t.aprovado === true
  ).length

  const interioresCount = checklistItems.filter(
    (i) => i.categoria === 'interiores'
  ).length
  const interioresVerificados = checklistItems.filter(
    (i) => i.categoria === 'interiores' && i.verificado
  ).length

  const exterioresCount = checklistItems.filter(
    (i) => i.categoria === 'exteriores'
  ).length
  const exterioresVerificados = checklistItems.filter(
    (i) => i.categoria === 'exteriores' && i.verificado
  ).length

  const packCount = checklistItems.filter(
    (i) => i.categoria === 'pack'
  ).length
  const packVerificados = checklistItems.filter(
    (i) => i.categoria === 'pack' && i.verificado
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Alertas de legislação */}
      {alertasLegislacao.length > 0 && (
        <div className="mb-6">
          {alertasLegislacao.map((regra) => (
            <div key={regra.id} className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2 rounded">
              <div className="font-semibold text-yellow-800 flex items-center gap-2">
                📜 Alerta Legal
                <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded ml-2">{regra.decretos.join(', ')}</span>
              </div>
              <div className="text-yellow-900 text-sm mt-1">{regra.alerta || regra.descricao}</div>
              {regra.artigos.length > 0 && (
                <div className="text-xs text-yellow-700 mt-1">Artigos: {regra.artigos.join(', ')}</div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                📋 Checklist de Inspeção da Jangada
              </h1>
              <p className="text-gray-600 mt-2">
                {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-blue-600">
                {percentualConclusao}%
              </div>
              <p className="text-sm text-gray-600">
                {verificadosCount} de {checklistItems.length} itens
              </p>
            </div>
          </div>

          {/* Progresso */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentualConclusao}%` }}
            />
          </div>
        </div>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 border">
            <TabsTrigger value="componentes" className="gap-2">
              <Shield className="h-4 w-4" />
              Componentes
            </TabsTrigger>
            <TabsTrigger value="testes" className="gap-2">
              <Gauge className="h-4 w-4" />
              Testes de Pressão
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Manual Técnico
            </TabsTrigger>
          </TabsList>

          {/* TAB: Componentes */}
          <TabsContent value="componentes" className="space-y-6">
            {/* Componentes Interiores */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplet className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle>Componentes Interiores</CardTitle>
                      <CardDescription>
                        Coletes, EPIRB, sinalizadores, kits médicos
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-blue-600">
                    {interioresVerificados}/{interioresCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {checklistItems
                  .filter((i) => i.categoria === 'interiores')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <Checkbox
                        checked={item.verificado}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${
                              item.verificado
                                ? 'line-through text-gray-400'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.nome}
                          </p>
                          {item.verificado && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Componentes Exteriores */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wind className="h-5 w-5 text-orange-600" />
                    <div>
                      <CardTitle>Componentes Exteriores</CardTitle>
                      <CardDescription>
                        Juntas, válvulas, amarras, escada
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-orange-600">
                    {exterioresVerificados}/{exterioresCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {checklistItems
                  .filter((i) => i.categoria === 'exteriores')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <Checkbox
                        checked={item.verificado}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${
                              item.verificado
                                ? 'line-through text-gray-400'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.nome}
                          </p>
                          {item.verificado && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Pack Components */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle>Componentes de Pack</CardTitle>
                      <CardDescription>
                        Rações, água, fachos, foguetes
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-600">
                    {packVerificados}/{packCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-3">
                {checklistItems
                  .filter((i) => i.categoria === 'pack')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <Checkbox
                        checked={item.verificado}
                        onCheckedChange={() => handleToggleItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-semibold ${
                              item.verificado
                                ? 'line-through text-gray-400'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.nome}
                          </p>
                          {item.verificado && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        {item.descricao && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.descricao}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Câmaras e Iluminação */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <Battery className="h-5 w-5 text-purple-600" />
                    <div>
                      <CardTitle className="text-base">Câmaras</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {checklistItems
                    .filter((i) => i.categoria === 'camaras')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3"
                      >
                        <Checkbox
                          checked={item.verificado}
                          onCheckedChange={() => handleToggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {item.nome}
                          </p>
                          {item.verificado && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    <div>
                      <CardTitle className="text-base">Iluminação</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  {checklistItems
                    .filter((i) => i.categoria === 'iluminacao')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3"
                      >
                        <Checkbox
                          checked={item.verificado}
                          onCheckedChange={() => handleToggleItem(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {item.nome}
                          </p>
                          {item.verificado && (
                            <CheckCircle2 className="h-3 w-3 text-green-600 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Testes de Pressão */}
          <TabsContent value="testes" className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Gauge className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                💨 Insira a pressão medida em cada cilindro. Aprovado se estiver a 10% da pressão esperada.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {testesPressao.map((teste) => {
                const diferenca = teste.pressaoMedida
                  ? Math.abs(teste.pressaoMedida - teste.pressaoEsperada)
                  : null
                const percentualDiferenca = diferenca
                  ? ((diferenca / teste.pressaoEsperada) * 100).toFixed(1)
                  : null

                return (
                  <Card
                    key={teste.id}
                    className={`border-2 transition ${
                      teste.aprovado === null
                        ? 'border-gray-200'
                        : teste.aprovado
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Informações do Cilindro */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Número de série
                            </p>
                            <p className="font-semibold text-gray-900">
                              {teste.cilindroNumero}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Tipo de cilindro
                            </p>
                            <Badge variant="outline">
                              {teste.tipoCilindro}
                            </Badge>
                          </div>
                        </div>

                        <div className="border-t pt-4 space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            {/* Pressão Esperada */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pressão Esperada
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-blue-600">
                                  {teste.pressaoEsperada}
                                </span>
                                <span className="text-gray-600">
                                  {teste.unidade}
                                </span>
                              </div>
                            </div>

                            {/* Pressão Medida */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pressão Medida *
                              </label>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="0.0"
                                  value={
                                    teste.pressaoMedida ?? ''
                                  }
                                  onChange={(e) =>
                                    handleUpdateTeste(
                                      teste.id,
                                      'pressaoMedida',
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : null
                                    )
                                  }
                                  className="flex-1 text-lg font-bold"
                                />
                                <span className="text-gray-600">
                                  {teste.unidade}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                              </label>
                              <div className="pt-2">
                                {teste.aprovado === null ? (
                                  <Badge variant="outline">
                                    Pendente
                                  </Badge>
                                ) : teste.aprovado ? (
                                  <Badge className="bg-green-600">
                                    ✓ Aprovado
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    ✗ Reprovado
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Diferença */}
                          {percentualDiferenca !== null && (
                            <div className="bg-gray-50 p-3 rounded-lg border">
                              <p className="text-sm text-gray-600">
                                Diferença: {diferenca?.toFixed(2)}{' '}
                                {teste.unidade} ({percentualDiferenca}%)
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {teste.aprovado
                                  ? '✓ Dentro da tolerância (±10%)'
                                  : '✗ Fora da tolerância (±10%)'}
                              </p>
                            </div>
                          )}

                          {/* Observações */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Observações
                            </label>
                            <Input
                              placeholder="Adicione observações se necessário..."
                              value={teste.observacoes ?? ''}
                              onChange={(e) =>
                                handleUpdateTeste(
                                  teste.id,
                                  'observacoes',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Resumo Testes */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Resumo de Testes de Pressão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total de Cilindros</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {testesPressao.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Aprovados</p>
                    <p className="text-3xl font-bold text-green-600">
                      {testesPressaoAprovados}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Aprovação</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {testesPressao.length > 0
                        ? Math.round(
                            (testesPressaoAprovados / testesPressao.length) * 100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Manual Técnico */}
          <TabsContent value="manual" className="space-y-6">
            {jangada?.marcaId ? (
              <ChecklistInspecaoManual
                inspecaoId={inspecaoId}
                jangadaId={jangada.id}
                marcaId={jangada.marcaId}
                modeloId={jangada.modeloId}
                lotacaoId={jangada.lotacaoId}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                  <p className="text-lg font-semibold mb-2">Jangada não identificada</p>
                  <p className="text-muted-foreground">
                    Configure a marca e modelo da jangada para carregar o checklist técnico do manual.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Botão de Submit */}
        <div className="flex gap-4 sticky bottom-6">
          <Button
            size="lg"
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
            onClick={handleSalvarChecklist}
            disabled={isSubmitting || percentualConclusao < 100}
          >
            {isSubmitting ? 'Salvando...' : 'Finalizar e Salvar Inspeção'}
            <Save className="h-4 w-4" />
          </Button>
        </div>

        {/* Aviso de conclusão */}
        {percentualConclusao === 100 && (
          <Alert className="bg-green-50 border-green-300 mt-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✓ Checklist completo! Clique em "Finalizar e Salvar Inspeção" para concluir.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

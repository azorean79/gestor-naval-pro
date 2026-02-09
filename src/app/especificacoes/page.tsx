'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Gauge, 
  Wrench, 
  Network, 
  CheckSquare, 
  AlertTriangle, 
  Database, 
  Info,
  ChevronRight,
  BookOpen,
  ArrowLeft
} from 'lucide-react'

interface EspecificacaoTecnica {
  id: string
  marca: { id: string; nome: string }
  modelo: { id: string; nome: string }
  lotacao: { id: string; capacidade: number }
  referenciaCilindro: {
    // Base specs
    contentores?: any
    cilindros?: any
    valvulas?: any
    tubos?: any
    // Interconnection  
    sistema_interligacao?: any
    testes_verificacao?: any[]
    // Manual data
    manual_mkiv?: any
    manual_mkiv_validated?: any
  }
}

function EspecificacoesContent({ marcaFromUrl }: { marcaFromUrl: string | null }) {
  
  const [selectedMarca, setSelectedMarca] = useState<string>('all')
  const [selectedModelo, setSelectedModelo] = useState<string>('all')

  const { data: especsData, isLoading } = useQuery({
    queryKey: ['especificacoes-tecnicas'],
    queryFn: async () => {
      const res = await fetch('/api/especificacoes')
      if (!res.ok) throw new Error('Erro ao carregar especificações')
      return res.json()
    }
  })

  const especificacoes: EspecificacaoTecnica[] = especsData?.data || []

  // Apply marca filter from URL on mount
  useEffect(() => {
    if (marcaFromUrl && especificacoes.length > 0) {
      setSelectedMarca(marcaFromUrl)
    }
  }, [marcaFromUrl, especificacoes.length])

  // Get unique marcas and modelos for filters
  const marcas = Array.from(new Set(especificacoes.map(e => e.marca.nome)))
  const modelos = Array.from(new Set(especificacoes.map(e => e.modelo.nome)))

  // Filter specs
  const filtered = especificacoes.filter(spec => {
    if (selectedMarca !== 'all' && spec.marca.nome !== selectedMarca) return false
    if (selectedModelo !== 'all' && spec.modelo.nome !== selectedModelo) return false
    return true
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando especificações técnicas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      {marcaFromUrl && (
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/marcas'}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Marcas
        </Button>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-blue-500" />
            Especificações Técnicas
          </h1>
          <p className="text-muted-foreground mt-2">
            Dados técnicos completos extraídos dos manuais de serviço
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/configuracoes'}
          >
            Ver Integrado
          </Button>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {filtered.length} configurações
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Marca</label>
            <Select value={selectedMarca} onValueChange={setSelectedMarca}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as marcas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as marcas</SelectItem>
                {marcas.map(marca => (
                  <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Modelo</label>
            <Select value={selectedModelo} onValueChange={setSelectedModelo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {modelos.map(modelo => (
                  <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Specs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(spec => (
          <EspecificacaoCard key={spec.id} spec={spec} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma especificação encontrada com os filtros selecionados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EspecificacaoCard({ spec }: { spec: EspecificacaoTecnica }) {
  const [expanded, setExpanded] = useState(false)
  const ref = spec.referenciaCilindro || {}

  const hasManualData = ref.manual_mkiv || ref.manual_mkiv_validated
  const hasInterconnection = ref.sistema_interligacao
  const hasTests = ref.testes_verificacao && ref.testes_verificacao.length > 0

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {spec.marca.nome} {spec.modelo.nome}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="default" className="font-mono">
                {spec.lotacao.capacidade}p
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">
              {ref.cilindros?.[0]?.referencia || 'N/D'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              {ref.valvulas?.[0]?.modelo || 'N/D'}
            </span>
          </div>
        </div>

        <Separator />

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2">
          {hasManualData && (
            <Badge variant="secondary" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Manual
            </Badge>
          )}
          {hasInterconnection && (
            <Badge variant="secondary" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              Interligação
            </Badge>
          )}
          {hasTests && (
            <Badge variant="secondary" className="text-xs">
              <CheckSquare className="h-3 w-3 mr-1" />
                {ref.testes_verificacao?.length} Testes
            </Badge>
          )}
        </div>

        {/* View Details Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => window.location.href = `/especificacoes/${spec.id}`}
        >
          Ver Detalhes
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}

function SearchParamsWrapper() {
  const searchParams = useSearchParams()
  const marcaFromUrl = searchParams?.get('marca')
  return <EspecificacoesContent marcaFromUrl={marcaFromUrl} />
}

export default function EspecificacoesPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando especificações técnicas...</p>
        </div>
      </div>
    }>
      <SearchParamsWrapper />
    </Suspense>
  )
}

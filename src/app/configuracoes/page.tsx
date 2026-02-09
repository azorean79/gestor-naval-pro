// Tipos para dados
interface Marca { id: string; nome: string; }
interface Modelo { id: string; nome: string; }
interface Especificacao { id: string; nome?: string; marca?: { nome?: string }; modelo?: { nome?: string } }
interface Inspecao { id: string; jangada?: { numeroSerie?: string } }
interface Jangada { id: string; numeroSerie: string; }
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Package, 
  FileText, 
  Plus,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useMarcasJangada } from '@/hooks/use-marcas-jangada'
import { useModelosJangada } from '@/hooks/use-modelos-jangada'
import { useEspecificacoesTecnicas } from '@/hooks/use-especificacoes-tecnicas'
import { useJangadas } from '@/hooks/use-jangadas'
import { useInspecoes } from '@/hooks/use-inspecoes'

export default function ConfiguracoesPage() {
  // Carregar dados
  const { data: marcasResponse } = useMarcasJangada({ limit: 9999 })
  const { data: modelosResponse } = useModelosJangada({ limit: 9999 })
  const { data: especificacoesResponse } = useEspecificacoesTecnicas({ limit: 9999 })
  const { data: jangadasResponse } = useJangadas({ limit: 9999 })
  const { data: inspecoesResponse } = useInspecoes({ limit: 9999 })

  const marcas = marcasResponse?.data || []
  const modelos = modelosResponse?.data || []
  const especificacoes = especificacoesResponse?.data || []
  const jangadas = jangadasResponse?.data || []
  const inspecoes = inspecoesResponse?.data || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-blue-500" />
            Configurações Técnicas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestão integrada de marcas, modelos e especificações técnicas
          </p>
        </div>
      </div>

      {/* Listagem automática */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Marcas</h3>
              <ul className="text-sm">
                {marcas.length === 0 ? <li className="text-muted-foreground">Nenhuma marca cadastrada</li> : marcas.map((m: Marca) => <li key={m.id}>{m.nome}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Modelos</h3>
              <ul className="text-sm">
                {modelos.length === 0 ? <li className="text-muted-foreground">Nenhum modelo cadastrado</li> : modelos.map((m: Modelo) => <li key={m.id}>{m.nome}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Especificações</h3>
              <ul className="text-sm">
                {especificacoes.length === 0 ? <li className="text-muted-foreground">Nenhuma especificação cadastrada</li> : especificacoes.map((e: Especificacao) => <li key={e.id}>{e.nome || `${e.marca?.nome} ${e.modelo?.nome}`}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Inspeções</h3>
              <ul className="text-sm">
                {inspecoes.length === 0 ? <li className="text-muted-foreground">Nenhuma inspeção cadastrada</li> : inspecoes.map((i: Inspecao) => <li key={i.id}>{i.jangada?.numeroSerie || i.id}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Jangadas</h3>
              <ul className="text-sm">
                {jangadas.length === 0 ? <li className="text-muted-foreground">Nenhuma jangada cadastrada</li> : jangadas.map((j: Jangada) => <li key={j.id}>{j.numeroSerie}</li>)}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação Rápida */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/marcas'}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <Package className="h-5 w-5" />
                <span className="text-xs">Marcas</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/modelos'}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <Zap className="h-5 w-5" />
                <span className="text-xs">Modelos</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/especificacoes'}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Especificações</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/inspecoes'}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Inspeções</span>
              </div>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/jangadas'}
              className="h-16"
            >
              <div className="flex flex-col items-center gap-1">
                <Plus className="h-5 w-5" />
                <span className="text-xs">Jangadas</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

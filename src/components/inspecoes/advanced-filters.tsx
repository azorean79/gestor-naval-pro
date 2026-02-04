'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface AdvancedFiltersState {
  dataInicio?: string
  dataFim?: string
  status?: string
  tipo?: string
  equipamento?: string
  tecnico?: string
  custoMinimo?: number
  custoMaximo?: number
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState
  onFiltersChange: (filters: AdvancedFiltersState) => void
  tecnicos?: Array<{ id: string; nome: string }>
}

export function AdvancedFilters({ filters, onFiltersChange, tecnicos = [] }: AdvancedFiltersProps) {
  const [expanded, setExpanded] = useState(false)
  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  const handleReset = () => {
    onFiltersChange({})
  }

  const handleDateChange = (field: 'dataInicio' | 'dataFim', value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined })
  }

  const handleSelectChange = (field: string, value: string) => {
    onFiltersChange({ ...filters, [field]: value || undefined })
  }

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value ? parseFloat(value) : undefined
    onFiltersChange({ ...filters, [field]: numValue })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Filtros avançados</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} ativo{activeFilterCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Minimizar
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data inicial</label>
              <Input
                type="date"
                value={filters.dataInicio || ''}
                onChange={(e) => handleDateChange('dataInicio', e.target.value)}
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Data final</label>
              <Input
                type="date"
                value={filters.dataFim || ''}
                onChange={(e) => handleDateChange('dataFim', e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || undefined}
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="reprovada">Reprovada</SelectItem>
                  <SelectItem value="aprovada_com_condicoes">Com condições</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de inspeção */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de inspeção</label>
              <Select
                value={filters.tipo || undefined}
                onValueChange={(value) => handleSelectChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                  <SelectItem value="hidraulica">Hidráulica</SelectItem>
                  <SelectItem value="estrutural">Estrutural</SelectItem>
                  <SelectItem value="certificacao">Certificação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Equipamento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipamento</label>
              <Input
                placeholder="Nome ou série do equipamento"
                value={filters.equipamento || ''}
                onChange={(e) => handleSelectChange('equipamento', e.target.value)}
              />
            </div>

            {/* Técnico */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Técnico responsável</label>
              <Select
                value={filters.tecnico || undefined}
                onValueChange={(value) => handleSelectChange('tecnico', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os técnicos" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custo Mínimo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Custo mínimo (€)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.custoMinimo || ''}
                onChange={(e) => handleNumberChange('custoMinimo', e.target.value)}
              />
            </div>

            {/* Custo Máximo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Custo máximo (€)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="9999.99"
                value={filters.custoMaximo || ''}
                onChange={(e) => handleNumberChange('custoMaximo', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

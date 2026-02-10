'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, LifeBuoy, AlertCircle, Calendar, CheckCircle, Plus, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditJangadaForm } from '@/components/jangadas/edit-jangada-form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function JangadaDetalhesPage() {
  const { id } = useParams()
  const router = useRouter()

  // Buscar dados da jangada
  const { data: jangadaData, isLoading } = useQuery({
    queryKey: ['jangada', id],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas/${id}`)
      if (!res.ok) throw new Error('Erro ao buscar jangada')
      return res.json()
    },
    enabled: !!id,
  })

  // Buscar componentes
  const { data: componentes = [] } = useQuery({
    queryKey: ['componentes', 'jangada', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecao-componente?jangadaId=${id}`)
      if (!res.ok) throw new Error('Erro ao buscar componentes')
      return res.json()
    },
    enabled: !!id,
  })

  // Importar o card moderno
  const ModernCard = require('@/components/modern-details-cards').JangadaDetailsCard

  // Renderizar
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-6xl mx-auto">
        {isLoading ? <Skeleton className="h-40 w-full" /> : jangadaData && (
          <ModernCard jangada={jangadaData} componentes={componentes} onEdit={() => router.push(`/jangadas/${id}/editar`)} onAddComponente={() => router.push(`/jangadas/${id}/componentes/novo`)} onUpdateValidade={() => router.refresh()} />
        )}
      </div>
    </div>
  )
}

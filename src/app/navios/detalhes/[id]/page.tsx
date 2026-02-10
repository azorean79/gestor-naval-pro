'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Edit, Trash2, Ship, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { EditNavioForm } from '@/components/navios/edit-navio-form'
import { Comentarios, Comentario } from '@/components/comentarios'

export default function NavioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [editOpen, setEditOpen] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);

  // Buscar dados do navio
  const { data: navioData, isLoading } = useQuery({
    queryKey: ['navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/navios/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar navio');
      return res.json();
    },
    enabled: !!id,
  });

  // Importar o card moderno
  const ModernCard = require('@/components/modern-details-cards').NavioDetailsCard;

  const { data: jangadas = [] } = useQuery({
    queryKey: ['jangadas', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/jangadas?navioId=${id}`);
      if (!res.ok) throw new Error('Erro ao buscar jangadas');
      return res.json();
    },
    enabled: !!id,
  });

  const { data: inspecoes = [] } = useQuery({
    queryKey: ['inspecoes', 'navio', id],
    queryFn: async () => {
      const res = await fetch(`/api/inspecoes?navioId=${id}`);
      if (!res.ok) throw new Error('Erro ao buscar inspeções');
      return res.json();
    },
    enabled: !!id,
  });

  const handleEditSuccess = () => {
    setEditOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto">
        {isLoading ? <Skeleton className="h-40 w-full" /> : navioData && (
          <ModernCard navio={navioData} onEdit={() => setEditOpen(true)} onDelete={() => router.push('/navios')} />
        )}
        {/* ...outros componentes, comentários, tabs... */}
      </div>
    </div>
  );
}


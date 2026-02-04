import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function useAddPackComponentes() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPackComponentes = async (
    tipoPack: string,
    componentesSelecionados?: Record<string, { incluido: boolean; quantidade?: number }>,
    jangadaNumeroSerie?: string,
    tecnico?: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/jangadas/add-pack-componentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPack,
          componentesSelecionados,
          jangadaNumeroSerie,
          tecnico,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar componentes do pack')
      }

      const data = await response.json()
      router.refresh()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    addPackComponentes,
    isLoading,
    error,
  }
}

import { useEffect, useState } from 'react'

export function useComentarios({ navioId, inspecaoId }: { navioId?: string, inspecaoId?: string }) {
  const [comentarios, setComentarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const url = navioId
      ? `/api/comentarios?navioId=${navioId}`
      : inspecaoId
      ? `/api/comentarios?inspecaoId=${inspecaoId}`
      : '/api/comentarios'
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setComentarios(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [navioId, inspecaoId])

  const addComentario = async (texto: string, autor: string) => {
    const body: any = { texto, autor }
    if (navioId) body.navioId = navioId
    if (inspecaoId) body.inspecaoId = inspecaoId
    const res = await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const novo = await res.json()
    setComentarios(prev => [novo, ...prev])
  }

  return { comentarios, loading, addComentario }
}

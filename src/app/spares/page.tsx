'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, FileImage, Package } from 'lucide-react'

interface SearchResults {
  query: string
  total: number
  componentes: Array<{
    numero: number
    nome: string
    imagem?: string
    pagina?: number
  }>
  spares: Array<{
    descricao: string
  }>
  referencias: string[]
}

export default function SparesViewer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [selectedPage, setSelectedPage] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/spares/mk4/search?query=${encodeURIComponent(searchQuery)}`
      )
      
      if (!response.ok) {
        throw new Error('Erro na busca')
      }

      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Erro ao buscar:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPage = (pageNumber: number) => {
    setSelectedPage(pageNumber)
    setImageError(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">MK IV - Spare Parts</h1>
        <p className="text-muted-foreground">
          Busque e visualize spare parts do manual MK IV
        </p>
      </div>

      {/* Busca */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Spare Parts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite para buscar (ex: valve, inflation, strap)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resultados da Busca */}
        <div>
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Resultados ({results.total})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Componentes */}
                {results.componentes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      COMPONENTES ({results.componentes.length})
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.componentes.map((comp, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => comp.pagina && viewPage(comp.pagina)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium">
                                {comp.numero}. {comp.nome}
                              </div>
                              {comp.pagina && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Página {comp.pagina}
                                </div>
                              )}
                            </div>
                            {comp.imagem && (
                              <FileImage className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spares */}
                {results.spares.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      SPARE PARTS ({results.spares.length})
                    </h3>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {results.spares.slice(0, 20).map((spare, idx) => (
                        <div
                          key={idx}
                          className="p-2 text-sm border rounded hover:bg-accent"
                        >
                          {spare.descricao}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Referências */}
                {results.referencias.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                      REFERÊNCIAS ({results.referencias.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {results.referencias.map((ref, idx) => (
                        <code
                          key={idx}
                          className="px-2 py-1 bg-secondary rounded text-xs"
                        >
                          {ref}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {results.total === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado para &quot;{results.query}&quot;
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Visualizador de Imagem */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Página {selectedPage}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewPage(Math.max(1, selectedPage - 1))}
                    disabled={selectedPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewPage(Math.min(680, selectedPage + 1))}
                    disabled={selectedPage === 680}
                  >
                    Próxima
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[8.5/11] bg-muted rounded-lg overflow-hidden">
                {!imageError ? (
                  <Image
                    src={`/api/spares/mk4/${selectedPage}`}
                    alt={`Página ${selectedPage} do manual MK IV`}
                    fill
                    className="object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileImage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Erro ao carregar imagem</p>
                      <p className="text-sm">Página {selectedPage}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Input
                  type="number"
                  min="1"
                  max="680"
                  value={selectedPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value)
                    if (page >= 1 && page <= 680) {
                      viewPage(page)
                    }
                  }}
                  placeholder="Ir para página..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

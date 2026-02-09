'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Gauge, 
  Wrench, 
  Network, 
  CheckSquare, 
  BookOpen,
  FileText,
  Database,
  AlertCircle,
  Info
} from 'lucide-react'

export default function EspecificacaoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const { data: specData, isLoading } = useQuery({
    queryKey: ['especificacao', id],
    queryFn: async () => {
      const res = await fetch(`/api/especificacoes/${id}`)
      if (!res.ok) throw new Error('Erro ao carregar especificação')
      return res.json()
    },
    enabled: !!id
  })

  const spec = specData?.data
  const ref = spec?.referenciaCilindro || {}

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando especificação...</p>
        </div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-semibold">Especificação não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {spec.marca.nome} {spec.modelo.nome} - {spec.lotacao.capacidade}p
          </h1>
          <p className="text-muted-foreground mt-1">
            Especificação técnica completa extraída de manual
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">
            <Info className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="manual">
            <BookOpen className="h-4 w-4 mr-2" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="interligacao">
            <Network className="h-4 w-4 mr-2" />
            Interligação
          </TabsTrigger>
          <TabsTrigger value="testes">
            <CheckSquare className="h-4 w-4 mr-2" />
            Testes
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <FileText className="h-4 w-4 mr-2" />
            Checklist
          </TabsTrigger>
        </TabsList>

        {/* Geral Tab */}
        <TabsContent value="geral" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cilindros Detalhados */}
            {ref.cilindros_detalhados && ref.cilindros_detalhados.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-500" />
                    Cilindros de Gás
                  </CardTitle>
                  <CardDescription>Cargas de CO₂ e N₂ por tipo de lançamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ref.cilindros_detalhados.map((cil: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold capitalize">{cil.tipo.replace('_', '-')}</span>
                        <Badge variant={cil.tipo === 'throwover' ? 'default' : 'secondary'}>
                          {cil.tipo === 'throwover' ? 'Throwover' : 'Davit-Launch'}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div className="flex justify-between">
                          <span>CO₂:</span>
                          <span className="font-mono font-semibold">{cil.co2_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>N₂:</span>
                          <span className="font-mono font-semibold">{cil.n2_kg} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pressão:</span>
                          <span className="font-mono">{cil.pressao_bar}</span>
                        </div>
                        {cil.observacao && (
                          <div className="text-xs italic mt-2 pt-2 border-t">
                            {cil.observacao}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : ref.cilindros && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-blue-500" />
                    Cilindros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ref.cilindros.map((cil: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{cil.referencia}</span>
                        <Badge variant="secondary">{cil.capacidade}</Badge>
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div>CO₂: {cil.peso_co2} kg</div>
                        <div>N₂: {cil.peso_n2} kg</div>
                        <div>Pressão: {cil.pressao_enchimento} bar</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Válvulas */}
            {ref.valvulas && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-green-500" />
                    Válvulas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ref.valvulas.map((val: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{val.modelo}</span>
                        <Badge>{val.fabricante}</Badge>
                      </div>
                      {val.alternativas && (
                        <div className="text-sm text-muted-foreground">
                          Alternativas: {val.alternativas.join(', ')}
                        </div>
                      )}
                      {val.torques && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <strong>Torques:</strong>
                          <div className="ml-2">
                            Aperto: {val.torques.aperto} Nm<br />
                            Desaperto: {val.torques.desaperto} Nm
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Contentores Detalhados */}
            {ref.contentores_detalhados && ref.contentores_detalhados.length > 0 ? (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-500" />
                    Contentores e Cintas de Fecho
                  </CardTitle>
                  <CardDescription>Especificações completas por tipo de pack</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {ref.contentores_detalhados.map((cont: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm">{cont.tipo}</span>
                          <Badge variant={cont.pack_solas === 'A' ? 'default' : 'secondary'}>
                            SOLAS {cont.pack_solas}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-2 text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Dimensões:</span>
                            <span className="font-mono text-xs">{cont.dimensoes_mm}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Peso:</span>
                            <span className="font-semibold">{cont.peso_kg} kg</span>
                          </div>
                          <Separator className="my-2" />
                          <div className="flex justify-between bg-blue-50 dark:bg-blue-950 p-2 rounded">
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              Cintas:
                            </span>
                            <span className="font-bold text-blue-700 dark:text-blue-300">
                              {cont.cintas_fecho_quantidade}
                            </span>
                          </div>
                          {cont.part_number && (
                            <div className="text-xs italic text-muted-foreground/70 mt-2">
                              P/N: {cont.part_number}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Cintas de Fecho Info */}
                  {ref.cintas_fecho && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Informação sobre Cintas de Fecho
                      </h4>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <div><strong>Material:</strong> {ref.cintas_fecho.material}</div>
                        <div><strong>Torque:</strong> {ref.cintas_fecho.torque_nm}</div>
                        <div><strong>Instalação:</strong> {ref.cintas_fecho.metodo_instalacao || ref.cintas_fecho.observacoes}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : ref.contentores && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Contentores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {ref.contentores.map((cont: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{cont.tipo}</span>
                          <Badge variant={cont.pack_solas === 'A' ? 'default' : 'secondary'}>
                            Pack {cont.pack_solas}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <div>Referência: {cont.referencia}</div>
                          <div>Dimensões: {cont.dimensoes_mm}</div>
                          <div>Peso: {cont.peso_kg} kg</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual" className="space-y-4">
          {ref.manual_mkiv_validated ? (
            <>
              {/* Gas Charges */}
              {ref.manual_mkiv_validated.gas_charges_validated && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cargas de Gás Validadas</CardTitle>
                    <CardDescription>
                      {ref.manual_mkiv_validated.gas_charges_validated.fonte}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Capacidade</th>
                            <th className="text-left py-2 px-3">Throwover CO₂/N₂</th>
                            <th className="text-left py-2 px-3">Cilindro</th>
                            <th className="text-left py-2 px-3">Davit-Launch</th>
                            <th className="text-left py-2 px-3">Cilindro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(ref.manual_mkiv_validated.gas_charges_validated.cargas || {}).map(([cap, data]: [string, any]) => (
                            <tr key={cap} className="border-b hover:bg-muted/50">
                              <td className="py-2 px-3 font-mono">{cap}</td>
                              <td className="py-2 px-3">
                                {data.throwover?.co2_kg} / {data.throwover?.n2_kg} kg
                              </td>
                              <td className="py-2 px-3">
                                <Badge variant="outline">{data.throwover?.cilindro_ref}</Badge>
                              </td>
                              <td className="py-2 px-3">
                                {data.davit_launch ? 
                                  `${data.davit_launch.co2_kg} / ${data.davit_launch.n2_kg} kg` : 
                                  '-'
                                }
                              </td>
                              <td className="py-2 px-3">
                                {data.davit_launch?.cilindro_ref ? (
                                  <Badge variant="outline">{data.davit_launch.cilindro_ref}</Badge>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Container Specs */}
              {ref.manual_mkiv_validated.xtrem_container_specs && (
                <Card>
                  <CardHeader>
                    <CardTitle>Especificações de Contentores Xtrem</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(ref.manual_mkiv_validated.xtrem_container_specs || {}).map(([cap, specs]: [string, any]) => (
                      <div key={cap} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Capacidade: {cap}</h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {specs.solas_a && (
                            <div className="border-l-4 border-l-blue-500 pl-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">SOLAS A-Pack</span>
                                <Badge>A</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Modelo: {specs.solas_a.modelo}</div>
                                <div>Dimensões: {specs.solas_a.dimensoes_mm}</div>
                                <div>Peso: {specs.solas_a.peso_kg} kg</div>
                              </div>
                            </div>
                          )}
                          {specs.solas_b && (
                            <div className="border-l-4 border-l-gray-500 pl-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">SOLAS B-Pack</span>
                                <Badge variant="secondary">B</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <div>Modelo: {specs.solas_b.modelo}</div>
                                <div>Dimensões: {specs.solas_b.dimensoes_mm}</div>
                                <div>Peso: {specs.solas_b.peso_kg} kg</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Dados do manual não disponíveis para esta especificação
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Interligação Tab */}
        <TabsContent value="interligacao" className="space-y-4">
          {ref.sistema_interligacao ? (
            <Card>
              <CardHeader>
                <CardTitle>Sistema de Interligação</CardTitle>
                <CardDescription>
                  Cilindro → Válvula → Tubo → Câmaras (Inferior + Superior)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Flow Diagram */}
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-around text-sm">
                    <div className="text-center">
                      <Gauge className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="font-semibold">Cilindro</div>
                      <div className="text-xs text-muted-foreground">
                        {ref.sistema_interligacao.cilindro?.referencia}
                      </div>
                    </div>
                    <div>→</div>
                    <div className="text-center">
                      <Wrench className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="font-semibold">Válvula</div>
                      <div className="text-xs text-muted-foreground">
                        {ref.sistema_interligacao.valvula?.modelo}
                      </div>
                    </div>
                    <div>→</div>
                    <div className="text-center">
                      <Network className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className="font-semibold">Tubo</div>
                      <div className="text-xs text-muted-foreground">
                        {ref.sistema_interligacao.tubo?.diametro_mm}mm
                      </div>
                    </div>
                    <div>→</div>
                    <div className="text-center">
                      <Database className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <div className="font-semibold">Câmaras</div>
                      <div className="text-xs text-muted-foreground">
                        Inf + Sup
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Specs */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Tubo de Alta Pressão</h4>
                    <div className="text-sm space-y-1">
                      <div>Diâmetro: {ref.sistema_interligacao.tubo?.diametro_mm}mm</div>
                      <div>Comprimento: {ref.sistema_interligacao.tubo?.comprimento_m}m</div>
                      <div>Part Number: {ref.sistema_interligacao.tubo?.part_number}</div>
                      <div>Torque: {ref.sistema_interligacao.tubo?.torque_nm} Nm</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-3">
                    <h4 className="font-semibold mb-2">Adaptadores</h4>
                    <div className="text-sm space-y-1">
                      <div>Câmara Inferior: {ref.sistema_interligacao.adaptadores_camara_inferior?.quantidade} un</div>
                      <div>Câmara Superior: {ref.sistema_interligacao.adaptadores_camara_superior?.quantidade} un</div>
                      <div>Torque: {ref.sistema_interligacao.adaptadores_camara_inferior?.torque_nm} Nm</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Dados de interligação não disponíveis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testes Tab */}
        <TabsContent value="testes" className="space-y-4">
          {ref.testes_verificacao && ref.testes_verificacao.length > 0 ? (
            <div className="grid gap-4">
              {ref.testes_verificacao.map((teste: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{teste.nome}</CardTitle>
                      <Badge variant={teste.tipo === 'obrigatório' ? 'default' : 'secondary'}>
                        {teste.tipo}
                      </Badge>
                    </div>
                    <CardDescription>{teste.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3 text-sm">
                      <div>
                        <strong>Frequência:</strong>
                        <div className="text-muted-foreground">{teste.frequencia}</div>
                      </div>
                      <div>
                        <strong>Duração:</strong>
                        <div className="text-muted-foreground">{teste.duracao}</div>
                      </div>
                      <div>
                        <strong>Ferramenta:</strong>
                        <div className="text-muted-foreground">{teste.ferramenta}</div>
                      </div>
                    </div>
                    {teste.criterios_aprovacao && (
                      <div className="bg-muted rounded-lg p-3 text-sm">
                        <strong>Critérios de Aprovação:</strong>
                        <div className="text-muted-foreground mt-1">
                          {teste.criterios_aprovacao}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Testes de verificação não definidos
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <ChecklistSection marcaId={spec.marca.id} modeloId={spec.modelo.id} lotacaoId={spec.lotacao.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChecklistSection({ marcaId, modeloId, lotacaoId }: { marcaId: string; modeloId: string; lotacaoId: string }) {
  const { data: checklistData, isLoading } = useQuery({
    queryKey: ['checklist-inspecao', marcaId, modeloId, lotacaoId],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        marcaId, 
        ativo: 'true' 
      })
      const res = await fetch(`/api/checklist-inspecao?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar checklist')
      return res.json()
    }
  })

  const items = checklistData?.data || []

  // Group by category
    const categorias = Array.from(new Set(items.map((i: any) => i.categoria))) as string[]

  if (isLoading) {
    return <div className="text-center py-8">Carregando checklist...</div>
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhum item de checklist disponível
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {categorias.map((categoria: string) => {
        const catItems = items.filter((i: any) => i.categoria === categoria)
        return (
          <Card key={categoria}>
            <CardHeader>
              <CardTitle className="text-lg">{categoria}</CardTitle>
              <CardDescription>{catItems.length} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {catItems.map((item: any, idx: number) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{item.nome}</h4>
                    <Badge variant="outline">{item.frequencia}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.descricao}</p>
                  <div className="grid gap-2 md:grid-cols-2 text-xs">
                    {item.ferramentaNecessaria && (
                      <div>
                        <strong>Ferramenta:</strong>
                        <div className="text-muted-foreground">{item.ferramentaNecessaria}</div>
                      </div>
                    )}
                    {item.criterioAprovacao && (
                      <div>
                        <strong>Critério Aprovação:</strong>
                        <div className="text-muted-foreground">{item.criterioAprovacao}</div>
                      </div>
                    )}
                    {item.referenciaManual && (
                      <div className="md:col-span-2">
                        <strong>Referência Manual:</strong>
                        <div className="text-muted-foreground">{item.referenciaManual}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

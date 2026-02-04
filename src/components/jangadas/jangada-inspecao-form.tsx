"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, AlertCircle, Save, Loader2 } from 'lucide-react'

const jangadaInspecaoSchema = z.object({
  // Dados Básicos
  numeroSerie: z.string().min(1, 'Número de série obrigatório'),
  marca: z.string().min(1, 'Marca obrigatória'),
  modelo: z.string().min(1, 'Modelo obrigatório'),
  tipo: z.string().min(1, 'Tipo obrigatório'),
  capacidade: z.number().min(1, 'Capacidade deve ser maior que 0'),
  dataFabricacao: z.string().min(1, 'Data de fabricação obrigatória'),
  
  // Inspeção
  dataInspecao: z.string().min(1, 'Data de inspeção obrigatória'),
  proximaInspecao: z.string().min(1, 'Próxima inspeção obrigatória'),
  inspecionador: z.string().min(1, 'Inspecionador obrigatório'),
  
  // Componentes
  cilindrosGas: z.string().min(1),
  valvulaInflacao: z.string().min(1),
  velas: z.string().min(1),
  remo: z.string().min(1),
  ancora: z.string().min(1),
  fitis: z.string().min(1),
  saco: z.string().min(1),
  
  // Observações
  observacoes: z.string().optional(),
  notas: z.string().optional(),
})

type JangadaInspecaoForm = z.infer<typeof jangadaInspecaoSchema>

const estadoComponentes = [
  { value: 'ok', label: '✓ OK' },
  { value: 'aviso', label: '⚠ Aviso' },
  { value: 'reparo', label: '🔧 Precisa Reparo' },
  { value: 'substituir', label: '❌ Substituir' },
]

export function JangadaInspecaoForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<JangadaInspecaoForm>({
    resolver: zodResolver(jangadaInspecaoSchema),
    defaultValues: {
      cilindrosGas: 'ok',
      valvulaInflacao: 'ok',
      velas: 'ok',
      remo: 'ok',
      ancora: 'ok',
      fitis: 'ok',
      saco: 'ok',
    },
  })

  async function onSubmit(values: JangadaInspecaoForm) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/jangadas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        form.reset()
        router.refresh()
        onSuccess?.()
      } else {
        const error = await response.json()
        alert('Erro: ' + error.message)
      }
    } catch (error) {
      console.error('Erro ao criar jangada:', error)
      alert('Erro ao criar jangada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-600" />
            Registo de Inspeção de Jangada
          </CardTitle>
          <CardDescription>
            Preencha o formulário com os dados da jangada e os resultados da inspeção
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="dados" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="inspecao">Inspeção</TabsTrigger>
                  <TabsTrigger value="componentes">Componentes</TabsTrigger>
                </TabsList>

                {/* TAB 1: DADOS BÁSICOS */}
                <TabsContent value="dados" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numeroSerie"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 5017330300011" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="marca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: RFD, Viking, Wefts" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="modelo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: SEASAVA PLUS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="4 pessoas">4 pessoas</SelectItem>
                              <SelectItem value="6 pessoas">6 pessoas</SelectItem>
                              <SelectItem value="8 pessoas">8 pessoas</SelectItem>
                              <SelectItem value="10 pessoas">10 pessoas</SelectItem>
                              <SelectItem value="15 pessoas">15 pessoas</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="capacidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidade (pessoas)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Ex: 8" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dataFabricacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Fabricação</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* TAB 2: INSPEÇÃO */}
                <TabsContent value="inspecao" className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Preencha os dados da inspeção realizada
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataInspecao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Inspeção</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="proximaInspecao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Próxima Inspeção</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="inspecionador"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Inspecionador Responsável</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do inspecionador" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* TAB 3: COMPONENTES */}
                <TabsContent value="componentes" className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Avalie o estado de cada componente
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'cilindrosGas', label: 'Cilindros de Gás' },
                      { name: 'valvulaInflacao', label: 'Válvula de Inflação' },
                      { name: 'velas', label: 'Velas' },
                      { name: 'remo', label: 'Remo' },
                      { name: 'ancora', label: 'Âncora' },
                      { name: 'fitis', label: 'Fitis' },
                      { name: 'saco', label: 'Saco de Armazenamento' },
                    ].map(({ name, label }) => (
                      <FormField
                        key={name}
                        control={form.control}
                        name={name as keyof JangadaInspecaoForm}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{label}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {estadoComponentes.map(({ value, label }) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observações adicionais sobre a inspeção..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notas"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Importantes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Itens que requerem atenção..."
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Inspeção
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

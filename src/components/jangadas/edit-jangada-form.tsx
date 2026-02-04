'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const editJangadaSchema = z.object({
  numeroSerie: z.string().min(1, 'Número de série é obrigatório'),
  dataFabricacao: z.string().optional(),
  status: z.string().optional(),
  dataUltimaInspecao: z.string().optional(),
  dataProximaInspecao: z.string().optional(),
  certificado: z.string().optional(),
  numCertificado: z.string().optional(),
  dataValidadeCertificado: z.string().optional(),
  // HRU Fields
  hruAplicavel: z.boolean().optional(),
  hruNumeroSerie: z.string().optional(),
  hruModelo: z.string().optional(),
  hruDataInstalacao: z.string().optional(),
  hruDataValidade: z.string().optional(),
})

type EditJangadaFormData = z.infer<typeof editJangadaSchema>

interface EditJangadaFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jangada: any
  onSuccess?: () => void
}

export function EditJangadaForm({ open, onOpenChange, jangada, onSuccess }: EditJangadaFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<EditJangadaFormData>({
    resolver: zodResolver(editJangadaSchema),
    defaultValues: {
      numeroSerie: jangada?.numeroSerie || '',
      dataFabricacao: jangada?.dataFabricacao ? new Date(jangada.dataFabricacao).toISOString().split('T')[0] : '',
      status: jangada?.status || 'ativo',
      dataUltimaInspecao: jangada?.dataUltimaInspecao ? new Date(jangada.dataUltimaInspecao).toISOString().split('T')[0] : '',
      dataProximaInspecao: jangada?.dataProximaInspecao ? new Date(jangada.dataProximaInspecao).toISOString().split('T')[0] : '',
      certificado: jangada?.certificado || '',
      numCertificado: jangada?.numCertificado || '',
      dataValidadeCertificado: jangada?.dataValidadeCertificado ? new Date(jangada.dataValidadeCertificado).toISOString().split('T')[0] : '',
      // HRU
      hruAplicavel: jangada?.hruAplicavel ?? true,
      hruNumeroSerie: jangada?.hruNumeroSerie || '',
      hruModelo: jangada?.hruModelo || 'HAMMAR H20',
      hruDataInstalacao: jangada?.hruDataInstalacao ? new Date(jangada.hruDataInstalacao).toISOString().split('T')[0] : '',
      hruDataValidade: jangada?.hruDataValidade ? new Date(jangada.hruDataValidade).toISOString().split('T')[0] : '',
    },
  })

  const onSubmit = async (data: EditJangadaFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/jangadas/${jangada.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao).toISOString() : undefined,
          dataUltimaInspecao: data.dataUltimaInspecao ? new Date(data.dataUltimaInspecao).toISOString() : undefined,
          dataProximaInspecao: data.dataProximaInspecao ? new Date(data.dataProximaInspecao).toISOString() : undefined,
          dataValidadeCertificado: data.dataValidadeCertificado ? new Date(data.dataValidadeCertificado).toISOString() : undefined,
          // HRU
          hruDataInstalacao: data.hruDataInstalacao ? new Date(data.hruDataInstalacao).toISOString() : undefined,
          hruDataValidade: data.hruDataValidade ? new Date(data.hruDataValidade).toISOString() : undefined,
        }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar jangada')

      toast.success('Jangada atualizada com sucesso!')
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar jangada')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Jangada</DialogTitle>
          <DialogDescription>Atualize as informações da jangada</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="numeroSerie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataUltimaInspecao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Última Inspeção</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataProximaInspecao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Próxima Inspeção</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numCertificado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Certificado</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataValidadeCertificado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Validade Certificado</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Certificado</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* HRU Section */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">HRU (Hydrostatic Release Unit)</h3>
              
              <FormField
                control={form.control}
                name="hruAplicavel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mb-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">HRU Aplicável</FormLabel>
                      <FormDescription>
                        Esta jangada utiliza um sistema HRU
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('hruAplicavel') && (
                <div className="space-y-4 pl-4 border-l-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hruNumeroSerie"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série HRU</FormLabel>
                          <FormControl>
                            <Input placeholder="HMR-2024-XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hruModelo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modelo HRU</FormLabel>
                          <FormControl>
                            <Input placeholder="HAMMAR H20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hruDataInstalacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Instalação HRU</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Data de instalação do HRU
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hruDataValidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Validade HRU</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>
                            Validade: 2 anos após instalação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { useCreateNavio } from '@/hooks/use-navios'
import { useClientes } from '@/hooks/use-clientes'
import { navioSchema, type NavioForm } from '@/lib/validation-schemas'
import { Cliente } from '@/lib/types'

interface AddNavioFormProps {
  onSuccess?: () => void
}

export function AddNavioForm({ onSuccess }: AddNavioFormProps) {
  const router = useRouter()
  const createNavioMutation = useCreateNavio()
  const { data: clientesResponse } = useClientes()
  const clientes = clientesResponse?.data || []
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NavioForm>({
    resolver: zodResolver(navioSchema),
    defaultValues: {
      nome: '',
      tipo: '',
      matricula: '',
      bandeira: '',
      imo: '',
      mmsi: '',
      callSign: '',
      comprimento: undefined,
      largura: undefined,
      calado: undefined,
      capacidade: undefined,
      status: 'ativo',
      dataInspecao: undefined,
      dataProximaInspecao: undefined,
      clienteId: undefined,
      proprietarioId: undefined,
    },
  })

  const onSubmit = async (data: NavioForm) => {
    setIsSubmitting(true)
    try {
      await createNavioMutation.mutateAsync(data)
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/navios')
      }
    } catch (error) {
      console.error('Erro ao criar navio:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Navio</CardTitle>
        <CardDescription>
          Adicione um novo navio à frota
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do navio" {...field} />
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
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cargueiro">Cargueiro</SelectItem>
                        <SelectItem value="pesca-costeiro">Pesca Costeira</SelectItem>
                        <SelectItem value="pesca-local">Pesca Local</SelectItem>
                        <SelectItem value="pesca-alto-mar">Pesca Alto Mar</SelectItem>
                        <SelectItem value="pesca-arrasto">Pesca Arrasto</SelectItem>
                        <SelectItem value="pesca-cerco">Pesca Cerco</SelectItem>
                        <SelectItem value="passageiros">Passageiros</SelectItem>
                        <SelectItem value="recreativo">Recreativo</SelectItem>
                        <SelectItem value="recreio">Recreio</SelectItem>
                        <SelectItem value="iate">Iate</SelectItem>
                        <SelectItem value="maritimo-turistica">Marítimo Turística</SelectItem>
                        <SelectItem value="offshore">Offshore</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula/IMÓ</FormLabel>
                    <FormControl>
                      <Input placeholder="Matrícula/IMÓ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bandeira"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bandeira *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Portugal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IMO</FormLabel>
                    <FormControl>
                      <Input placeholder="Número IMO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mmsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MMSI</FormLabel>
                    <FormControl>
                      <Input placeholder="Código MMSI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="callSign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call Sign</FormLabel>
                    <FormControl>
                      <Input placeholder="Call Sign" {...field} />
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
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
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

              <FormField
                control={form.control}
                name="comprimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comprimento (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="largura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Largura (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calado (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (ton)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {clientes.map((cliente: Cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
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
                name="dataInspecao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Última Inspeção</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date?.toISOString())}
                      placeholder="Selecione a data da última inspeção"
                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataProximaInspecao"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Próxima Inspeção</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date?.toISOString())}
                      placeholder="Selecione a data da próxima inspeção"
                      disabled={(date) => date < new Date()}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Navio'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
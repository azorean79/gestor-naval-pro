"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { useCreateCilindro } from "@/hooks/use-cilindros";
import { toast } from "sonner";

const cilindroSchema = z.object({
  numeroSerie: z.string().min(1, "Número de série é obrigatório"),
  pesoBruto: z.number().optional(),
  tara: z.number().optional(),
  quantidadeCO2: z.number().optional(),
  quantidadeN2: z.number().optional(),
  testeHidraulico: z.string().optional(),
  proximoTesteHidraulico: z.string().optional(),
  tipoSistemaInsuflacao: z.string().optional(),
  status: z.enum(["operacional", "manutencao", "defeituoso", "descartado"]),
  localizacao: z.string().optional(),
  proprietario: z.string().optional(),
  observacoes: z.string().optional(),
});

type CilindroFormData = z.infer<typeof cilindroSchema>;

export function AddCilindroForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCilindro = useCreateCilindro();

  const form = useForm<CilindroFormData>({
    resolver: zodResolver(cilindroSchema),
    defaultValues: {
      numeroSerie: "",
      pesoBruto: undefined,
      tara: undefined,
      quantidadeCO2: undefined,
      quantidadeN2: undefined,
      testeHidraulico: "",
      proximoTesteHidraulico: "",
      tipoSistemaInsuflacao: "",
      status: "operacional",
      localizacao: "",
      proprietario: "",
      observacoes: "",
    },
  });

  const onSubmit = async (data: CilindroFormData) => {
    setIsSubmitting(true);
    try {
      await createCilindro.mutateAsync(data);
      form.reset();
      setIsOpen(false);
      toast.success("Cilindro criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar cilindro:", error);
      toast.error("Erro ao criar cilindro");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Cilindro
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Adicionar Cilindro</CardTitle>
            <CardDescription>
              Registar um novo cilindro no sistema
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numeroSerie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Série</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: C001-2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pesoBruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Bruto (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="15.5"
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
                name="tara"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tara (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="5.2"
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
                name="quantidadeCO2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade CO2 (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="10.3"
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
                name="quantidadeN2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade N2 (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="8.7"
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
                name="testeHidraulico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Último Teste Hidráulico</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proximoTesteHidraulico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Próximo Teste Hidráulico</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoSistemaInsuflacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Sistema Insuflação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Manual, Automático" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="operacional">Operacional</SelectItem>
                        <SelectItem value="manutencao">Manutenção</SelectItem>
                        <SelectItem value="defeituoso">Defeituoso</SelectItem>
                        <SelectItem value="descartado">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="localizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Armazém A, Prateleira 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proprietario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proprietário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do proprietário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o cilindro..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Criando..." : "Criar Cilindro"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
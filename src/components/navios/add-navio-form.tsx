"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { useCreateNavio } from "@/hooks/use-navios";
import { toast } from "sonner";

const navioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  imo: z.string().min(1, "IMO é obrigatório"),
  mmsi: z.string().optional(),
  matricula: z.string().min(1, "Matrícula é obrigatória"),
  bandeira: z.string().min(1, "Bandeira é obrigatória"),
  ilha: z.string().optional(),
  portoEscala: z.string().optional(),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  comprimento: z.number().min(0, "Comprimento deve ser positivo"),
  largura: z.number().min(0, "Largura deve ser positiva"),
  calado: z.number().min(0, "Calado deve ser positivo"),
  capacidade: z.number().min(0, "Capacidade deve ser positiva"),
  proprietario: z.string().min(1, "Proprietário é obrigatório"),
  proprietarioId: z.string().optional(),
  armador: z.string().optional(),
  status: z.enum(["ativo", "manutencao", "inativo"]),
  ultimaInspecao: z.string().optional(),
  proximaInspecao: z.string().optional(),
  observacoes: z.string().optional(),
});

type NavioFormData = z.infer<typeof navioSchema>;

export function AddNavioForm() {
  const [open, setOpen] = useState(false);
  const createNavio = useCreateNavio();

  const form = useForm<NavioFormData>({
    resolver: zodResolver(navioSchema),
    defaultValues: {
      nome: "",
      imo: "",
      mmsi: "",
      matricula: "",
      bandeira: "Portugal",
      ilha: "",
      portoEscala: "",
      tipo: "",
      comprimento: 0,
      largura: 0,
      calado: 0,
      capacidade: 0,
      proprietario: "",
      proprietarioId: "",
      armador: "",
      status: "ativo",
      ultimaInspecao: "",
      proximaInspecao: "",
      observacoes: "",
    },
  });

  const onSubmit = async (data: NavioFormData) => {
    try {
      await createNavio.mutateAsync(data);
      toast.success("Navio criado com sucesso!");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao criar navio");
      console.error("Erro ao criar navio:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Navio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Navio</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo navio no sistema.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Navio</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do navio" {...field} />
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
                      <Input placeholder="Número MMSI" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Matrícula do navio" {...field} />
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
                    <FormLabel>Bandeira</FormLabel>
                    <FormControl>
                      <Input placeholder="País de bandeira" {...field} />
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
                    <FormLabel>Tipo de Navio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cargueiro">Cargueiro</SelectItem>
                        <SelectItem value="passageiro">Passageiro</SelectItem>
                        <SelectItem value="pesqueiro">Pesqueiro</SelectItem>
                        <SelectItem value="petroleiro">Petroleiro</SelectItem>
                        <SelectItem value="cruzeiro">Cruzeiro</SelectItem>
                        <SelectItem value="ferry">Ferry</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
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
                        step="0.1"
                        placeholder="Comprimento em metros"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        step="0.1"
                        placeholder="Largura em metros"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        step="0.1"
                        placeholder="Calado em metros"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Capacidade (toneladas ou passageiros)"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
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

              <FormField
                control={form.control}
                name="armador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Armador</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do armador" {...field} />
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
                name="ultimaInspecao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Última Inspeção</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o navio"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createNavio.isPending}>
                {createNavio.isPending ? "Criando..." : "Criar Navio"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
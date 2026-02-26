"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, User, Ship, Wrench, AlertTriangle } from "lucide-react";
import { useCreateAgendamento } from "@/hooks/use-agendamentos";
import { toast } from "sonner";
import Link from "next/link";

const agendamentoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.enum(["inspecao", "manutencao", "servico_externo", "certificacao", "outro"]),
  dataInicio: z.string().min(1, "Data e hora são obrigatórias"),
  delegacao: z.string().min(1, "Delegação é obrigatória"),
  tecnicoNome: z.string().min(1, "Técnico responsável é obrigatório"),
  status: z.enum(["agendado", "em_andamento", "concluido", "cancelado"]),
  urgente: z.boolean(),
  descricao: z.string().optional(),
});

type AgendamentoFormData = z.infer<typeof agendamentoSchema>;

export default function NovoAgendamentoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAgendamento = useCreateAgendamento();

  const form = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      titulo: "",
      tipo: "inspecao",
      dataInicio: "",
      delegacao: "Açores",
      tecnicoNome: "",
      status: "agendado",
      urgente: false,
      descricao: "",
    },
  });

  const onSubmit = async (data: AgendamentoFormData) => {
    setIsSubmitting(true);
    try {
      // Adicionar campos obrigatórios ausentes para o tipo Agendamento
      const now = new Date();
      const dataInicio = new Date(data.dataInicio);
      const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // 1h após início
      await createAgendamento.mutateAsync({
        ...data,
        dataInicio,
        dataFim,
        responsavel: data.tecnicoNome,
        prioridade: "normal",
      });
      form.reset();
      toast.success("Agendamento criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/agenda" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          ← Voltar para Agenda
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          Novo Agendamento
        </h1>
        <p className="text-gray-600 mt-2">
          Crie um novo agendamento para inspeções, manutenção ou serviços externos
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Detalhes do Agendamento
          </CardTitle>
          <CardDescription>
            Preencha as informações do novo agendamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Agendamento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Inspeção Jangada J-001"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Agendamento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inspecao">Inspeção</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="servico_externo">Serviço Externo</SelectItem>
                          <SelectItem value="certificacao">Certificação</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
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
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Data e Hora
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delegacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delegação</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a delegação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Açores">Açores</SelectItem>
                          <SelectItem value="Madeira">Madeira</SelectItem>
                          <SelectItem value="Continente">Continente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tecnicoNome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Técnico Responsável
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do técnico responsável"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgente"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        Agendamento Urgente
                      </FormLabel>
                      <p className="text-sm text-gray-600">
                        Marque se este agendamento requer atenção prioritária
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detalhes adicionais sobre o agendamento..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Criando..." : "Criar Agendamento"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={isSubmitting}
                >
                  Limpar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
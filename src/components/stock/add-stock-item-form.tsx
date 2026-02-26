"use client";

import { useState, useEffect } from "react";
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
import { useCreateStockItem } from "@/hooks/use-stock";
import { WizardCilindro } from "@/components/ui/WizardCilindro";
import { toast } from "sonner";

const stockItemSchema = z.object({
  codigo: z.string().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidadeAtual: z.number().min(0, "Quantidade deve ser positiva"),
  quantidadeMinima: z.number().min(0, "Quantidade mínima deve ser positiva"),
  quantidadeMaxima: z.number().min(0, "Quantidade máxima deve ser positiva"),
  precoUnitario: z.number().min(0, "Preço deve ser positivo").optional(),
  precoCompra: z.number().min(0, "Preço de compra deve ser positivo").optional(),
  precoVenda: z.number().min(0, "Preço de venda deve ser positivo").optional(),
  codigoFabricante: z.string().optional(),
  fornecedor: z.string().optional(),
  localizacao: z.string().optional(),
  status: z.enum(["disponivel", "baixo_stock", "esgotado"]),
  imagemBase64: z.string().optional(),
  dataUltimaEntrada: z.string().optional(),
  dataUltimaSaida: z.string().optional(),
  lote: z.string().optional(),
  dataValidade: z.string().optional(),
  // campos de cilindro (quando categoria = Cilindros)
  pesoBruto: z.number().optional(),
  tara: z.number().optional(),
  quantidadeCO2: z.number().optional(),
  quantidadeN2: z.number().optional(),
  testeHidraulico: z.string().optional(),
  proximoTesteHidraulico: z.string().optional(),
  tipoSistemaInsuflacao: z.string().optional(),
  numeroSerieJangada: z.string().optional(),
  observacoes: z.string().optional(),
});

type StockItemFormData = z.infer<typeof stockItemSchema>;

export function AddStockItemForm() {
  const [open, setOpen] = useState(false);
  const [imagemBase64, setImagemBase64] = useState<string | null>(null);
  const createStockItem = useCreateStockItem();

  const form = useForm<StockItemFormData>({
    resolver: zodResolver(stockItemSchema),
    defaultValues: {
      codigo: "",
      nome: "",
      categoria: "",
      descricao: "",
      codigoFabricante: "",
      precoCompra: 0,
      precoVenda: 0,
      unidade: "unidade",
      quantidadeAtual: 0,
      quantidadeMinima: 1,
      quantidadeMaxima: 100,
      precoUnitario: 0,
      fornecedor: "",
      localizacao: "",
      status: "disponivel",
      dataUltimaEntrada: "",
      dataUltimaSaida: "",
      lote: "",
      dataValidade: "",
      numeroSerieJangada: "",
      observacoes: "",
    },
  });

  // Quando o número de série da jangada for preenchido, tentar autocompletar a data
  useEffect(() => {
    const numero = form.watch('numeroSerieJangada');
    if (!numero) return;

    let mounted = true;

    (async () => {
      try {
        const res = await fetch('/api/jangadas');
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : json;
        const match = list.find((j: any) => {
          if (!j) return false;
          const ns = (j.numeroSerie || '').toString();
          const numeroField = (j.numero || '').toString();
          return ns === numero || numeroField === numero;
        });
        if (!match || !mounted) return;

        // Procurar documento GI (tipo contendo 'gi') e usar dataEmissao quando disponível
        let dateToUse: string | null = null;
        if (match.documentos && Array.isArray(match.documentos)) {
          const giDoc = match.documentos.find((d: any) => (d.tipo || '').toLowerCase().includes('gi'));
          if (giDoc && (giDoc.dataEmissao || giDoc.dataValidade)) {
            const d = giDoc.dataEmissao || giDoc.dataValidade;
            dateToUse = d ? new Date(d).toISOString().slice(0, 10) : null;
          }
        }

        // fallback para dataFabricacao
        if (!dateToUse && match.dataFabricacao) {
          dateToUse = new Date(match.dataFabricacao).toISOString().slice(0, 10);
        }

        if (dateToUse) {
          form.setValue('dataUltimaSaida', dateToUse);
        }
      } catch (err) {
        // não bloquear o fluxo em caso de erro
        console.error('Falha ao buscar jangada para preencher data:', err);
      }
    })();

    return () => { mounted = false; };
  }, [form.watch('numeroSerieJangada')]);

  const onSubmit = async (data: StockItemFormData) => {
    try {
      const payload = {
        ...data,
        imagemBase64: imagemBase64 || undefined,
      } as any;
      // ensure dates are sent as ISO strings
      if (data.dataUltimaEntrada === "") delete payload.dataUltimaEntrada;
      if (data.dataUltimaSaida === "") delete payload.dataUltimaSaida;
      if ((data as any).dataValidade) payload.dataValidade = (data as any).dataValidade;

      // Se estiver associado a uma jangada, marcar como instalado
      if (data.numeroSerieJangada) {
        payload.localizacao = `Instalado na Jangada ${data.numeroSerieJangada}`;
        if (!payload.quantidadeAtual || payload.quantidadeAtual === 0) payload.quantidadeAtual = 1;
      }

      await createStockItem.mutateAsync(payload);
      toast.success("Item de stock criado com sucesso!");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error("Erro ao criar item de stock");
      console.error("Erro ao criar item de stock:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Item de Stock</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo item de stock no sistema.
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
                    <FormLabel>Nome do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do item" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Motores">Motores</SelectItem>
                        <SelectItem value="Peças">Peças</SelectItem>
                        <SelectItem value="Cordame">Cordame</SelectItem>
                        <SelectItem value="Eletrónica">Eletrónica</SelectItem>
                        <SelectItem value="Ferramentas">Ferramentas</SelectItem>
                        <SelectItem value="Consumíveis">Consumíveis</SelectItem>
                        <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="Cilindros">Cilindros</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Item</FormLabel>
                    <FormControl>
                      <Input placeholder="Código interno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigoFabricante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código do Fabricante</FormLabel>
                    <FormControl>
                      <Input placeholder="Código do fabricante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precoCompra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Compra (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value as any}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precoVenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Venda (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={field.value as any}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Foto do Item (colar ou carregar)</FormLabel>
                <div
                  onPaste={async (e: React.ClipboardEvent) => {
                    const items = e.clipboardData.items;
                    for (let i = 0; i < items.length; i++) {
                      const item = items[i];
                      if (item.type.startsWith('image/')) {
                        const file = item.getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImagemBase64(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }
                  }}
                  className="border border-dashed p-3 rounded mb-2"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setImagemBase64(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="text-sm text-gray-500">Cole uma imagem (Ctrl+V) dentro desta área ou selecione um ficheiro.</div>
                  {imagemBase64 && (
                    <img src={imagemBase64} alt="Preview" className="mt-2 max-h-40" />
                  )}
                </div>
              </div>

              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unidade">Unidade</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="litro">Litro</SelectItem>
                        <SelectItem value="metro">Metro</SelectItem>
                        <SelectItem value="rolo">Rolo</SelectItem>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="pacote">Pacote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mostrar wizard específico para cilindros quando categoria for "Cilindros" */}
              {form.watch('categoria') === 'Cilindros' && (
                <div className="col-span-1 md:col-span-2 bg-yellow-50 border-l-4 border-yellow-300 p-4 rounded">
                  <div className="mb-2 font-semibold">Dados do Cilindro</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="lote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Série</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de série" {...field} />
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
                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                            <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
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
                            <Input placeholder="Manual / Automático" {...field} />
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
                        name="numeroSerieJangada"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Número de Série da Jangada</FormLabel>
                          <FormControl>
                              <Input placeholder="Número de série da jangada" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem className="md:col-span-3">
                          <FormLabel>Observações do Cilindro</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Observações..." className="min-h-[60px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="quantidadeAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidadeMinima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Mínima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidadeMaxima"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Máxima</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="precoUnitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Unitário (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
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
                name="lote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Lote / número de série" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fornecedor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
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
                      <Input placeholder="Armazém e prateleira" {...field} />
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
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="baixo_stock">Stock Baixo</SelectItem>
                        <SelectItem value="esgotado">Esgotado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataUltimaEntrada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Última Entrada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataUltimaSaida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Última Saída</FormLabel>
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição detalhada do item"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o item"
                      className="min-h-[60px]"
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
              <Button type="submit" disabled={createStockItem.isPending}>
                {createStockItem.isPending ? "Criando..." : "Criar Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
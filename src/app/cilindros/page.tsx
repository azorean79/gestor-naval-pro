"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCilindros } from "@/hooks/use-cilindros";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WizardCilindro } from "@/components/ui/WizardCilindro";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Mock data - será substituído por dados reais quando a API estiver pronta
const mockCilindros = [
  {
    id: "1",
    numeroSerie: "CYL-001-2024",
    tipoEquipamento: "Cilindro de Ar",
    marca: "Dräger",
    modelo: "Saver CF",
    capacidade: 6.8,
    pressaoTrabalho: 300,
    pressaoTeste: 450,
    dataFabricacao: "2023-06-15",
    dataValidade: "2028-06-15",
    status: "ativo",
    localizacao: "Armazém Central",
    ultimaInspecao: "2024-01-15",
    proximaInspecao: "2024-07-15",
    observacoes: "Cilindro em bom estado",
    pesoBruto: 10.5,
    tara: 2.5,
    quantidadeCO2: 0.0,
    quantidadeN2: 0.0
  },
  {
    id: "2",
    numeroSerie: "CYL-002-2024",
    tipoEquipamento: "Cilindro de Ar",
    marca: "MSA",
    modelo: "AirGo",
    capacidade: 6.8,
    pressaoTrabalho: 300,
    pressaoTeste: 450,
    dataFabricacao: "2023-07-20",
    dataValidade: "2028-07-20",
    status: "ativo",
    localizacao: "Armazém Central",
    ultimaInspecao: "2024-01-10",
    proximaInspecao: "2024-07-10",
    observacoes: "Cilindro novo",
    pesoBruto: 10.2,
    tara: 2.4,
    quantidadeCO2: 0.0,
    quantidadeN2: 0.0
  },
  {
    id: "3",
    numeroSerie: "CYL-003-2024",
    tipoEquipamento: "Cilindro de Oxigênio",
    marca: "Dräger",
    modelo: "Oxylog",
    capacidade: 2.0,
    pressaoTrabalho: 200,
    pressaoTeste: 300,
    dataFabricacao: "2023-08-05",
    dataValidade: "2028-08-05",
    status: "manutencao",
    localizacao: "Oficina",
    ultimaInspecao: "2024-01-05",
    proximaInspecao: "2024-07-05",
    observacoes: "Em manutenção preventiva",
    pesoBruto: 5.0,
    tara: 1.2,
    quantidadeCO2: 0.0,
    quantidadeN2: 0.0
  }
];

export default function CilindrosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chamar o hook sempre; controlar fetch via `enabled` para evitar diferença SSR/CSR
  const { data: cilindros, isLoading, error } = useCilindros({ enabled: mounted });

  // Usar dados reais se disponíveis, senão usar mock
  const displayCilindros = cilindros || mockCilindros;

  // Filtrar cilindros baseado no termo de busca
  const filteredCilindros = displayCilindros.filter(cilindro =>
    cilindro.numeroSerie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ("proprietario" in cilindro && cilindro.proprietario && typeof cilindro.proprietario === "string" && cilindro.proprietario.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cilindro.localizacao && cilindro.localizacao.toLowerCase().includes(searchTerm.toLowerCase())) ||
    cilindro.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredCilindros.map(c => c.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  useEffect(() => {
    if (selectedIds.length === filteredCilindros.length && filteredCilindros.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, filteredCilindros]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar cilindros</h2>
          <p className="text-gray-600">{typeof error === "string" ? error : error?.message || String(error)}</p>
        </div>
      </div>
    );
  }

  // Exclusão em massa
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} cilindro(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/cilindros/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Erro ao excluir cilindros");
      toast.success("Cilindros excluídos com sucesso!");
      setSelectedIds([]);
      // Forçar atualização da lista (ideal: usar React Query ou SWR)
      window.location.reload();
    } catch (e) {
      toast.error("Erro ao excluir cilindros");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cilindros
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestão de cilindros e equipamentos de mergulho
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                Novo Cilindro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Cilindro</DialogTitle>
              </DialogHeader>
              <WizardCilindro onFinish={(data) => {
                alert("Cilindro cadastrado: " + JSON.stringify(data, null, 2));
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cilindros..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{displayCilindros.length}</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {displayCilindros.filter(c => c.status === 'ativo').length}
              </div>
              <p className="text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {displayCilindros.filter(c => c.status === 'manutencao').length}
              </div>
              <p className="text-sm text-gray-600">Manutenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {displayCilindros.filter(c => {
                  // Suporte tanto para mock quanto para dados reais
                  const inspecao = c.proximaInspecao || (c as any).proximoTesteHidraulico;
                  if (!inspecao) return false;
                  const expDate = new Date(inspecao);
                  const now = new Date();
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return diffDays <= 30;
                }).length}
              </div>
              <p className="text-sm text-gray-600">Expirando</p>
            </CardContent>
          </Card>
        </div>

        {/* Botão de exclusão em massa */}
        <div className="mb-4 flex gap-2">
          <Button
            variant="destructive"
            disabled={selectedIds.length === 0 || isDeleting}
            onClick={handleDeleteSelected}
          >
            {isDeleting ? "Excluindo..." : `Excluir selecionados (${selectedIds.length})`}
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cilindros</CardTitle>
            <CardDescription>
              Todos os cilindros e equipamentos de mergulho registados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={e => handleSelectAll(e.target.checked)}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Peso Bruto</TableHead>
                  <TableHead>Tara</TableHead>
                  <TableHead>CO2 (kg)</TableHead>
                  <TableHead>N2 (kg)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próximo Teste</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando cilindros...
                    </TableCell>
                  </TableRow>
                ) : filteredCilindros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Nenhum cilindro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCilindros.map((cilindro) => (
                    <TableRow key={cilindro.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(cilindro.id)}
                          onChange={e => handleSelectOne(cilindro.id, e.target.checked)}
                          aria-label={`Selecionar cilindro ${cilindro.numeroSerie}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{cilindro.numeroSerie}</TableCell>
                      <TableCell>{cilindro.pesoBruto ? `${cilindro.pesoBruto}kg` : '-'}</TableCell>
                      <TableCell>{cilindro.tara ? `${cilindro.tara}kg` : '-'}</TableCell>
                      <TableCell>{cilindro.quantidadeCO2 ? `${cilindro.quantidadeCO2}kg` : '-'}</TableCell>
                      <TableCell>{cilindro.quantidadeN2 ? `${cilindro.quantidadeN2}kg` : '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            cilindro.status === 'operacional' ? 'default' :
                            cilindro.status === 'manutencao' ? 'secondary' :
                            cilindro.status === 'defeituoso' ? 'destructive' : 'outline'
                          }
                        >
                          {cilindro.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const c = cilindro as import("@/hooks/use-cilindros").Cilindro & { proximaInspecao?: string, proximoTesteHidraulico?: string };
                          const prox = c.proximoTesteHidraulico || c.proximaInspecao;
                          return prox ? formatDate(prox) : '-';
                        })()}
                      </TableCell>
                      <TableCell>{cilindro.localizacao}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
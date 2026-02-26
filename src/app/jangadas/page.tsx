"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useJangadas } from "@/hooks/use-jangadas";
import { useInspecoes } from "@/hooks/use-gestao-inspecoes";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WizardJangada } from "@/components/ui/WizardJangada";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

// Mock data - será substituído por dados reais do Firebase
const mockJangadas = [
  {
    id: "1",
    numero: "J-001",
    nome: "Santa Maria",
    proprietario: "João Silva",
    marca: "Yamaha",
    modelo: "JX-200",
    lotacao: 8,
    status: "ativo",
    ultimaInspecao: "2024-01-15",
    proximaInspecao: "2024-07-15"
  },
  {
    id: "2",
    numero: "J-002",
    nome: "Nossa Senhora",
    proprietario: "Maria Santos",
    marca: "Honda",
    modelo: "Marine Pro",
    lotacao: 6,
    status: "manutencao",
    ultimaInspecao: "2024-01-10",
    proximaInspecao: "2024-07-10"
  },
  {
    id: "3",
    numero: "J-003",
    nome: "São Pedro",
    proprietario: "António Costa",
    marca: "Suzuki",
    modelo: "DF-150",
    lotacao: 10,
    status: "ativo",
    ultimaInspecao: "2024-01-20",
    proximaInspecao: "2024-07-20"
  }
];

export default function JangadasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chamar sempre o hook, nunca condicionalmente
  const hookResult = useJangadas();
  const jangadas = mounted ? hookResult.data : null;
  const isLoading = mounted ? hookResult.isLoading : false;
  const error = mounted ? hookResult.error : null;

  const { criarInspecao } = useInspecoes();
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);

  // Usar dados reais se disponíveis, senão usar mock
  const displayJangadas = jangadas || mockJangadas;

  // Filtros específicos
  const [statusFilter, setStatusFilter] = useState("");
  const [marcaFilter, setMarcaFilter] = useState("");
  const [modeloFilter, setModeloFilter] = useState("");
  const [proprietarioFilter, setProprietarioFilter] = useState("");

  // Filtrar jangadas baseado no termo de busca e filtros
  const filteredJangadas = displayJangadas.filter(jangada => {
    const matchesSearch =
      jangada.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jangada.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jangada.proprietario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? jangada.status === statusFilter : true;
    const matchesMarca = marcaFilter ? jangada.marca === marcaFilter : true;
    const matchesModelo = modeloFilter ? jangada.modelo === modeloFilter : true;
    const matchesProprietario = proprietarioFilter ? jangada.proprietario === proprietarioFilter : true;
    return matchesSearch && matchesStatus && matchesMarca && matchesModelo && matchesProprietario;
  });

  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredJangadas.map(j => j.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  useEffect(() => {
    if (selectedIds.length === filteredJangadas.length && filteredJangadas.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, filteredJangadas]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar jangadas</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Exclusão em massa
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} jangada(s)?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/jangadas/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Erro ao excluir jangadas");
      toast.success("Jangadas excluídas com sucesso!");
      setSelectedIds([]);
      // Forçar atualização da lista (ideal: usar React Query ou SWR)
      window.location.reload();
    } catch (e) {
      toast.error("Erro ao excluir jangadas");
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
              Jangadas
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestão da frota de jangadas
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                Nova Jangada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Jangada</DialogTitle>
              </DialogHeader>
              <WizardJangada onFinish={(data) => {
                alert("Jangada cadastrada: " + JSON.stringify(data, null, 2));
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar jangadas..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select className="input" onChange={e => setStatusFilter(e.target.value)} value={statusFilter}>
                  <option value="">Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Marca</label>
                <select className="input" onChange={e => setMarcaFilter(e.target.value)} value={marcaFilter}>
                  <option value="">Todas</option>
                  {Array.from(new Set(displayJangadas.map(j => j.marca))).map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Modelo</label>
                <select className="input" onChange={e => setModeloFilter(e.target.value)} value={modeloFilter}>
                  <option value="">Todos</option>
                  {Array.from(new Set(displayJangadas.map(j => j.modelo))).map(modelo => (
                    <option key={modelo} value={modelo}>{modelo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Proprietário</label>
                <select className="input" onChange={e => setProprietarioFilter(e.target.value)} value={proprietarioFilter}>
                  <option value="">Todos</option>
                  {Array.from(new Set(displayJangadas.map(j => j.proprietario))).map(prop => (
                    <option key={prop} value={prop}>{prop}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">25</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">22</div>
              <p className="text-sm text-gray-600">Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <p className="text-sm text-gray-600">Manutenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">1</div>
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
            {isDeleting ? "Excluindo..." : `Excluir selecionadas (${selectedIds.length})`}
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Jangadas</CardTitle>
            <CardDescription>
              Todas as jangadas registadas no sistema
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
                      aria-label="Selecionar todas"
                    />
                  </TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Lotação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Inspeção</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando jangadas...
                    </TableCell>
                  </TableRow>
                ) : filteredJangadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Nenhuma jangada encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJangadas.map((jangada) => (
                    <TableRow key={jangada.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(jangada.id)}
                          onChange={e => handleSelectOne(jangada.id, e.target.checked)}
                          aria-label={`Selecionar jangada ${jangada.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{jangada.numero}</TableCell>
                      <TableCell>{jangada.nome}</TableCell>
                      <TableCell>{jangada.proprietario}</TableCell>
                      <TableCell>{jangada.marca || '-'}</TableCell>
                      <TableCell>{jangada.modelo || '-'}</TableCell>
                      <TableCell>{jangada.lotacao || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            jangada.status === 'ativo' ? 'default' :
                            jangada.status === 'manutencao' ? 'secondary' : 'destructive'
                          }
                        >
                          {jangada.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {jangada.ultimaInspecao ? formatDate(jangada.ultimaInspecao) : '-'}
                      </TableCell>
                      {/* Cliente relacionado (mock: link para cliente com mesmo nome) */}
                      <TableCell>
                        <Link href={`/clientes?search=${encodeURIComponent(jangada.proprietario)}`} className="text-blue-600 underline hover:text-blue-800">
                          {jangada.proprietario}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/jangadas/${jangada.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
                          <Link href={`/jangadas/${jangada.id}?edit=1`}>
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            disabled={startingId === jangada.id}
                            onClick={async () => {
                              try {
                                setStartingId(jangada.id);
                                const payload = {
                                  equipamentoId: jangada.id,
                                  clienteId: (jangada as any).proprietario || '',
                                  tipoInspecao: 'inicial',
                                  tecnico: 'Sistema',
                                  dataInspecao: new Date().toISOString()
                                };
                                const ins = await criarInspecao(payload as any);
                                toast.success('Inspeção iniciada');
                                // Redirect to inspection agenda/detail page
                                router.push(`/agenda/inspecao/${ins.id}`);
                              } catch (err) {
                                console.error('Erro ao iniciar inspeção:', err);
                                toast.error('Erro ao iniciar inspeção');
                              } finally {
                                setStartingId(null);
                              }
                            }}
                          >
                            Iniciar Inspeção
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
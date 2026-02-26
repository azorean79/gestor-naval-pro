"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavios } from "@/hooks/use-navios";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WizardNavio } from "@/components/ui/WizardNavio";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

// Mock data - será substituído por dados reais
const mockNavios = [
  {
    id: "1",
    nome: "Atlântico Express",
    imo: "IMO123456",
    matricula: "PT-1234-A",
    tipo: "Cargueiro",
    bandeira: "Portugal",
    proprietario: "Transportes Marítimos SA",
    status: "ativo",
    ultimaInspecao: "2024-01-15",
    proximaInspecao: "2024-07-15"
  },
  {
    id: "2",
    nome: "Costa Azul",
    imo: "IMO234567",
    matricula: "PT-2345-B",
    tipo: "Passageiro",
    bandeira: "Portugal",
    proprietario: "Linhas Azuis Ltd",
    status: "ativo",
    ultimaInspecao: "2024-01-10",
    proximaInspecao: "2024-07-10"
  },
  {
    id: "3",
    nome: "Pescador do Norte",
    imo: "IMO345678",
    matricula: "PT-3456-C",
    tipo: "Pesqueiro",
    bandeira: "Portugal",
    proprietario: "Pesca Norte SA",
    status: "manutencao",
    ultimaInspecao: "2024-01-05",
    proximaInspecao: "2024-07-05"
  },
  {
    id: "4",
    nome: "Ilha Verde",
    imo: "IMO456789",
    matricula: "PT-4567-D",
    tipo: "Ferry",
    bandeira: "Portugal",
    proprietario: "Transportes Insulares",
    status: "ativo",
    ultimaInspecao: "2024-01-20",
    proximaInspecao: "2024-07-20"
  },
  {
    id: "5",
    nome: "Mar Profundo",
    imo: "IMO567890",
    matricula: "PT-5678-E",
    tipo: "Petroleiro",
    bandeira: "Portugal",
    proprietario: "Energia Marítima SA",
    status: "ativo",
    ultimaInspecao: "2024-01-25",
    proximaInspecao: "2024-07-25"
  },
  {
    id: "6",
    nome: "Estrela do Mar",
    imo: "IMO678901",
    matricula: "PT-6789-F",
    tipo: "Cruzeiro",
    bandeira: "Portugal",
    proprietario: "Cruzeiros Atlânticos",
    status: "ativo",
    ultimaInspecao: "2024-01-12",
    proximaInspecao: "2024-07-12"
  },
  {
    id: "7",
    nome: "Vento Leste",
    imo: "IMO789012",
    matricula: "PT-7890-G",
    tipo: "Cargueiro",
    bandeira: "Portugal",
    proprietario: "Comércio Marítimo Ltd",
    status: "ativo",
    ultimaInspecao: "2024-01-18",
    proximaInspecao: "2024-07-18"
  },
  {
    id: "8",
    nome: "Onda Azul",
    imo: "IMO890123",
    matricula: "PT-8901-H",
    tipo: "Pesqueiro",
    bandeira: "Portugal",
    proprietario: "Pesca Sustentável SA",
    status: "ativo",
    ultimaInspecao: "2024-01-08",
    proximaInspecao: "2024-07-08"
  }
];

export default function NaviosPage() {
      // Buscar jangadas associadas
      const { data: jangadas = [] } = require('@/hooks/use-jangadas').useJangadas ? require('@/hooks/use-jangadas').useJangadas() : { data: [] };
    // Exclusão em massa
    const handleDeleteSelected = async () => {
      if (selectedIds.length === 0) return;
      if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} navio(s)?`)) return;
      setIsDeleting(true);
      try {
        const res = await fetch("/api/navios/bulk-delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        });
        if (!res.ok) throw new Error("Erro ao excluir navios");
        toast.success("Navios excluídos com sucesso!");
        setSelectedIds([]);
        window.location.reload();
      } catch (e) {
        toast.error("Erro ao excluir navios");
      } finally {
        setIsDeleting(false);
      }
    };
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [proprietarioFilter, setProprietarioFilter] = useState("");
  const { data: navios, isLoading, error } = useNavios();
  const [isDeleting, setIsDeleting] = useState(false);

  // Usar dados reais se disponíveis, senão usar mock
  const displayNavios = navios || mockNavios;

  // Filtrar navios baseado no termo de busca e filtros
  const filteredNavios = displayNavios.filter(navio => {
    const matchesSearch =
      navio.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      navio.imo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (navio.matricula && navio.matricula.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (navio.proprietario && navio.proprietario.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? navio.status === statusFilter : true;
    const matchesTipo = tipoFilter ? navio.tipo === tipoFilter : true;
    const matchesProprietario = proprietarioFilter ? navio.proprietario === proprietarioFilter : true;
    return matchesSearch && matchesStatus && matchesTipo && matchesProprietario;
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (selectedIds.length === filteredNavios.length && filteredNavios.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, filteredNavios]);

  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredNavios.map(n => n.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span>Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar navios</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Navios
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestão da frota de navios
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">
                <Plus className="mr-2 h-4 w-4" />
                Novo Navio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo Navio</DialogTitle>
              </DialogHeader>
              <WizardNavio onFinish={(data) => {
                alert("Navio cadastrado: " + JSON.stringify(data, null, 2));
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
                    placeholder="Buscar navios..."
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
                  <option value="abandonado">Abandonado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Tipo</label>
                <select className="input" onChange={e => setTipoFilter(e.target.value)} value={tipoFilter}>
                  <option value="">Todos</option>
                  {Array.from(new Set(displayNavios.map(n => n.tipo))).map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Proprietário</label>
                <select className="input" onChange={e => setProprietarioFilter(e.target.value)} value={proprietarioFilter}>
                  <option value="">Todos</option>
                  {Array.from(new Set(displayNavios.map(n => n.proprietario))).map(prop => (
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
              <div className="text-2xl font-bold">{displayNavios.length}</div>
              <p className="text-sm text-gray-600">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {displayNavios.filter(n => n.status === 'ativo').length}
              </div>
              <p className="text-sm text-gray-600">Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {displayNavios.filter(n => n.status === 'manutencao').length}
              </div>
              <p className="text-sm text-gray-600">Manutenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {displayNavios.filter(n => {
                  if (!n.proximaInspecao) return false;
                  const expDate = new Date(n.proximaInspecao);
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
            <CardTitle>Lista de Navios</CardTitle>
            <CardDescription>
              Todos os navios registados no sistema
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
                  <TableHead>Nome</TableHead>
                  <TableHead>IMO</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Bandeira</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Inspeção</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Jangadas Associadas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Carregando navios...
                    </TableCell>
                  </TableRow>
                ) : filteredNavios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Nenhum navio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNavios.map((navio) => (
                    <TableRow key={navio.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(navio.id)}
                          onChange={e => handleSelectOne(navio.id, e.target.checked)}
                          aria-label={`Selecionar navio ${navio.nome}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{navio.nome}</TableCell>
                      <TableCell>{navio.imo}</TableCell>
                      <TableCell>{navio.matricula}</TableCell>
                      <TableCell>{navio.tipo}</TableCell>
                      <TableCell>{navio.bandeira}</TableCell>
                      <TableCell>{navio.proprietario}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            navio.status === 'ativo' ? 'default' :
                            navio.status === 'manutencao' ? 'secondary' : 'destructive'
                          }
                        >
                          {navio.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {navio.ultimaInspecao ? formatDate(navio.ultimaInspecao) : '-'}
                      </TableCell>
                      {/* Cliente relacionado (mock: link para cliente com mesmo nome de empresa) */}
                      <TableCell>
                        <Link
                          href={`/clientes?search=${encodeURIComponent(navio.proprietario ?? "")}`}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          {navio.proprietario}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {(jangadas.filter((j: any) => j.proprietario === navio.proprietario).length === 0) ? (
                          <span className="text-xs text-gray-400">Nenhuma</span>
                        ) : (
                          <ul className="space-y-1">
                            {jangadas.filter((j: any) => j.proprietario === navio.proprietario).map((j: any) => (
                              <li key={j.id}>
                                <Link href={`/jangadas/${j.id}`} className="text-blue-600 underline hover:text-blue-800">
                                  {j.nome} ({j.numero})
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/navios/${navio.id}`}>
                            <Button variant="outline" size="sm">
                              Ver
                            </Button>
                          </Link>
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
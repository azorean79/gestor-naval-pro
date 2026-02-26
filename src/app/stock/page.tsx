"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Loader2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useStock } from "@/hooks/use-stock";
import { useJangadas } from '@/hooks/use-jangadas';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AddStockItemForm } from "@/components/stock/add-stock-item-form";
import ErrorBoundary from "@/components/ErrorBoundary";

// Mock data - será substituído por dados reais
const mockStock = [
  {
    id: "1",
    nome: "Motor Yamaha 200HP",
    categoria: "Motores",
    descricao: "Motor fora de borda Yamaha 200HP, 4 tempos",
    unidade: "unidade",
    quantidadeAtual: 5,
    quantidadeMinima: 2,
    quantidadeMaxima: 10,
    precoUnitario: 15000.00,
    fornecedor: "Yamaha Portugal",
    localizacao: "Armazém A - Prateleira 1",
    status: "disponivel",
    dataUltimaEntrada: "2024-01-15",
    dataUltimaSaida: "2024-01-10",
    observacoes: "Stock adequado"
  },
  {
    id: "2",
    nome: "Hélice de bronze 20\"",
    categoria: "Peças",
    descricao: "Hélice de bronze para motores de 200HP",
    unidade: "unidade",
    quantidadeAtual: 1,
    quantidadeMinima: 3,
    quantidadeMaxima: 15,
    precoUnitario: 450.00,
    fornecedor: "Peças Náuticas Ltd",
    localizacao: "Armazém B - Prateleira 2",
    status: "baixo_stock",
    dataUltimaEntrada: "2024-01-08",
    dataUltimaSaida: "2024-01-12",
    observacoes: "Stock baixo - encomendar mais"
  },
  {
    id: "3",
    nome: "Cabo de aço 10mm",
    categoria: "Cordame",
    descricao: "Cabo de aço galvanizado 10mm x 100m",
    unidade: "rolo",
    quantidadeAtual: 8,
    quantidadeMinima: 5,
    quantidadeMaxima: 20,
    precoUnitario: 120.00,
    fornecedor: "Cordame Industrial SA",
    localizacao: "Armazém C - Prateleira 3",
    status: "disponivel",
    dataUltimaEntrada: "2024-01-20",
    dataUltimaSaida: "2024-01-05",
    observacoes: "Stock normal"
  }
];

function StockPageContent() {

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [jangadaFilter, setJangadaFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");
  const [fornecedorFilter, setFornecedorFilter] = useState("");
  const [showInstalledOnly, setShowInstalledOnly] = useState(false);
  const { data: stock, isLoading, error } = useStock();
  const { data: jangadas = [] } = useJangadas();
  const [mounted, setMounted] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Declarar displayStock e filteredStock antes dos useEffect
  // Evitar usar dados de mock no servidor — renderizar loading até montagem para prevenir
  // mismatch de hidratação. Após montagem, usar os dados reais de `stock`.
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Carregando stock...
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const displayStock = stock || [];
  const categories = Array.from(new Set(displayStock.map((s: any) => s.categoria).filter(Boolean)));
  const packs = Array.from(new Set(jangadas.map((j: any) => j.tipoPack).filter(Boolean))).filter(Boolean);

  const filteredStock = displayStock.filter(item => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const matchQ = (item.nome || '').toString().toLowerCase().includes(q) || (item.categoria || '').toString().toLowerCase().includes(q) || ((item.fornecedor || '') as string).toLowerCase().includes(q);
      if (!matchQ) return false;
    }
    if (categoryFilter && item.categoria !== categoryFilter) return false;
    if (jangadaFilter) {
      const key = String(jangadaFilter);
      const loc = (item.localizacao || '') as string;
      const obs = (item.observacoes || '') as string;
      if (!(loc.includes(key) || obs.includes(key) || item.codigo === key || item.codigoFabricante === key)) return false;
    }
    if (packFilter) {
      const pk = String(packFilter);
      const loc = (item.localizacao || '') as string;
      const obs = (item.observacoes || '') as string;
      if (!(loc.includes(pk) || obs.includes(pk))) return false;
    }
    if (statusFilter && item.status !== statusFilter) return false;
    if (fornecedorFilter && !((item.fornecedor || '') as string).toLowerCase().includes(fornecedorFilter.toLowerCase())) return false;
    if (showInstalledOnly) {
      // consider installed when localizacao starts with 'Instalado na Jangada' or numeroSerieJangada present
      const installed = !!item.numeroSerieJangada || ((item.localizacao || '') as string).toLowerCase().includes('instalado na jangada');
      if (!installed) return false;
    }
    return true;
  });

  useEffect(() => { setMounted(true); }, []);

  // Seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    setSelectedIds(checked ? filteredStock.map(s => s.id) : []);
  };
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id));
  };

  useEffect(() => {
    if (selectedIds.length === filteredStock.length && filteredStock.length > 0) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedIds, filteredStock]);

  if (error) {
    console.error('StockPage: useStock error', error);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Erro ao carregar stock</h2>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  // Exclusão em massa
  const [isDeleting, setIsDeleting] = useState(false);
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} item(ns) do stock?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/stock/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error("Erro ao excluir itens do stock");
      toast.success("Itens do stock excluídos com sucesso!");
      setSelectedIds([]);
      // Forçar atualização da lista (ideal: usar React Query ou SWR)
      window.location.reload();
    } catch (e) {
      toast.error("Erro ao excluir itens do stock");
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
              Stock
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Gestão de inventário e stock
            </p>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="secondary">Resultados: {filteredStock.length}</Badge>
              <span className="text-sm text-gray-600">Total: {displayStock.length}</span>
            </div>
          </div>
          <AddStockItemForm />
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar itens de stock..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { setSearchTerm(''); setCategoryFilter(''); setStatusFilter(''); setFornecedorFilter(''); setShowInstalledOnly(false); }}>
                    <Filter className="h-4 w-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                <select className="input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                  <option value="">Todas Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select className="input" value={jangadaFilter} onChange={e => setJangadaFilter(e.target.value)}>
                  <option value="">Todas Jangadas</option>
                  {jangadas.map((j: any) => <option key={j.id} value={j.numeroReferencia || j.id}>{j.numeroReferencia || j.nome}</option>)}
                </select>

                <select className="input" value={packFilter} onChange={e => setPackFilter(e.target.value)}>
                  <option value="">Todos Packs</option>
                  {packs.map((p: any) => <option key={p} value={p}>{p}</option>)}
                </select>

                <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">Todos Status</option>
                  <option value="disponivel">Disponível</option>
                  <option value="baixo_stock">Stock Baixo</option>
                  <option value="esgotado">Esgotado</option>
                </select>

                <Input placeholder="Fornecedor" className="w-56" value={fornecedorFilter} onChange={e => setFornecedorFilter(e.target.value)} />

                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={showInstalledOnly} onChange={e => setShowInstalledOnly(e.target.checked)} />
                  <span className="ml-1">Apenas Instalados</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{displayStock.length}</div>
              <p className="text-sm text-gray-600">Total de Itens</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {displayStock.filter(item => item.quantidadeAtual > item.quantidadeMinima).length}
              </div>
              <p className="text-sm text-gray-600">Stock Adequado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {displayStock.filter(item => item.quantidadeAtual <= item.quantidadeMinima && item.quantidadeAtual > 0).length}
              </div>
              <p className="text-sm text-gray-600">Stock Baixo</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {displayStock.filter(item => item.quantidadeAtual === 0).length}
              </div>
              <p className="text-sm text-gray-600">Esgotado</p>
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

        {/* Table grouped by category */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  Carregando stock...
                </div>
              </CardContent>
            </Card>
          ) : filteredStock.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">Nenhum item encontrado</CardContent>
            </Card>
          ) : (
            Object.entries(filteredStock.reduce((acc: Record<string, any[]>, it: any) => {
              (acc[it.categoria] = acc[it.categoria] || []).push(it);
              return acc;
            }, {})).map(([category, items]) => (
              <Card key={category}>
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={() => setCollapsed(prev => ({ ...prev, [category]: !prev[category] }))}
                      aria-label={`Toggle ${category}`}
                    >
                      {collapsed[category] ? <ChevronRight /> : <ChevronDown />}
                    </button>
                    <div>
                      <CardTitle className="!mb-0">{category}</CardTitle>
                      <CardDescription>{items.length} item(s)</CardDescription>
                    </div>
                  </div>
                  <div>
                    <Button size="sm" variant="ghost" onClick={() => window.scrollTo(0, 0)}>Abrir</Button>
                  </div>
                </CardHeader>
                {!collapsed[category] && (
                  <CardContent>
                    {category === 'Cilindros' ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <input type="checkbox" checked={selectAll && items.every((i: any) => selectedIds.includes(i.id))} onChange={e => {
                                const checked = e.target.checked;
                                setSelectedIds(prev => {
                                  const others = prev.filter(id => !items.some((it: any) => it.id === id));
                                  return checked ? [...others, ...items.map((it: any) => it.id)] : others;
                                });
                                setSelectAll(checked);
                              }} />
                            </TableHead>
                            <TableHead>Série</TableHead>
                            <TableHead>Peso Bruto (kg)</TableHead>
                            <TableHead>Tara (kg)</TableHead>
                            <TableHead>CO2 (kg)</TableHead>
                            <TableHead>N2 (kg)</TableHead>
                            <TableHead>Últ. Teste</TableHead>
                            <TableHead>Próx. Teste</TableHead>
                            <TableHead>Tipo Sistema</TableHead>
                            <TableHead>Nº Série Jangada</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={e => handleSelectOne(item.id, e.target.checked)} />
                              </TableCell>
                              <TableCell>{item.lote || item.codigo || '-'}</TableCell>
                              <TableCell>{item.pesoBruto ?? '-'}</TableCell>
                              <TableCell>{item.tara ?? '-'}</TableCell>
                              <TableCell>{item.quantidadeCO2 ?? '-'}</TableCell>
                              <TableCell>{item.quantidadeN2 ?? '-'}</TableCell>
                              <TableCell>{item.testeHidraulico ? new Date(item.testeHidraulico).toISOString().slice(0,10) : '-'}</TableCell>
                              <TableCell>{item.proximoTesteHidraulico ? new Date(item.proximoTesteHidraulico).toISOString().slice(0,10) : '-'}</TableCell>
                              <TableCell>{item.tipoSistemaInsuflacao || '-'}</TableCell>
                              <TableCell>{item.numeroSerieJangada || '-'}</TableCell>
                              <TableCell>{item.localizacao || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={item.quantidadeAtual === 0 ? 'destructive' : item.quantidadeAtual <= item.quantidadeMinima ? 'secondary' : 'default'}>
                                  {item.quantidadeAtual === 0 ? 'Esgotado' : item.quantidadeAtual <= item.quantidadeMinima ? 'Stock Baixo' : 'Disponível'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/stock/${item.id}`}>Ver</Button>
                                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/stock/${item.id}/editar`}>Editar</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              <input type="checkbox" checked={selectAll && items.every((i: any) => selectedIds.includes(i.id))} onChange={e => {
                                const checked = e.target.checked;
                                setSelectedIds(prev => {
                                  const others = prev.filter(id => !items.some((it: any) => it.id === id));
                                  return checked ? [...others, ...items.map((it: any) => it.id)] : others;
                                });
                                setSelectAll(checked);
                              }} />
                            </TableHead>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Preço Compra</TableHead>
                            <TableHead>Preço Venda</TableHead>
                            <TableHead>Preço Unitário</TableHead>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((item: any) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={e => handleSelectOne(item.id, e.target.checked)} />
                              </TableCell>
                              <TableCell className="font-medium">{item.codigo || '-'}</TableCell>
                              <TableCell className="font-medium">{item.nome}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{item.quantidadeAtual} {item.unidade}</span>
                                  <span className="text-xs text-gray-500">Min: {item.quantidadeMinima} | Max: {item.quantidadeMaxima}</span>
                                </div>
                              </TableCell>
                              <TableCell>{item.precoCompra ? `€${item.precoCompra.toFixed(2)}` : '-'}</TableCell>
                              <TableCell>{item.precoVenda ? `€${item.precoVenda.toFixed(2)}` : '-'}</TableCell>
                              <TableCell>{item.precoUnitario ? `€${item.precoUnitario.toFixed(2)}` : '-'}</TableCell>
                              <TableCell>{item.fornecedor || '-'}</TableCell>
                              <TableCell>{item.localizacao || '-'}</TableCell>
                              <TableCell>
                                <Badge variant={item.quantidadeAtual === 0 ? 'destructive' : item.quantidadeAtual <= item.quantidadeMinima ? 'secondary' : 'default'}>
                                  {item.quantidadeAtual === 0 ? 'Esgotado' : item.quantidadeAtual <= item.quantidadeMinima ? 'Stock Baixo' : 'Disponível'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/stock/${item.id}`}>Ver</Button>
                                  <Button variant="outline" size="sm" onClick={() => window.location.href = `/stock/${item.id}/editar`}>Editar</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <ErrorBoundary>
      <StockPageContent />
    </ErrorBoundary>
  );
}
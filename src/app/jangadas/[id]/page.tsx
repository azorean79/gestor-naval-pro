"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Anchor, Calendar, User, Settings, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useJangadas, useUpdateJangada } from "@/hooks/use-jangadas";
import { useStock } from '@/hooks/use-stock';
import { useCilindros } from '@/hooks/use-cilindros';
import { useState, useEffect } from "react";
import { useInspecoes } from "@/hooks/use-gestao-inspecoes";
import { QuadroInspecao } from "@/components/inspecoes/quadro-inspecao";

// Mock data - será substituído por dados reais
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
  }
];

export default function FichaJangadaPage() {
  const params = useParams();
  const router = useRouter();

  const { data: jangadas, isLoading } = useJangadas();
  const { data: stock = [], isLoading: loadingStock } = useStock();
  const { data: cilindros = [], isLoading: loadingCilindros } = useCilindros();
  const updateJangada = useUpdateJangada();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);


  // Usar dados reais se disponíveis, senão usar mock
  const displayJangadas = mounted && jangadas ? jangadas : mockJangadas;

  // Encontrar a jangada pelo ID
  const jangada = displayJangadas.find(j => j.id === params.id);

  // Artigos associados à jangada (local state para edição)
  const [artigos, setArtigos] = useState<any[]>(() => (jangada && (jangada as any).artigos) ? (jangada as any).artigos : []);
  const [selectedCilindro, setSelectedCilindro] = useState<string | undefined>(() => (jangada && (jangada as any).cilindro) ? (jangada as any).cilindro : undefined);
  const [showCilindroModal, setShowCilindroModal] = useState(false);
  const [cylDetails, setCylDetails] = useState<any | null>(null);
  const [cylLoading, setCylLoading] = useState(false);
  const [cylError, setCylError] = useState<string | null>(null);
  const [moveLoadingInstall, setMoveLoadingInstall] = useState(false);
  const [moveLoadingUninstall, setMoveLoadingUninstall] = useState(false);

  useEffect(() => {
    // quando jangada mudar, inicializar artigos
    setArtigos(jangada && (jangada as any).artigos ? (jangada as any).artigos : []);
    setSelectedCilindro(jangada && (jangada as any).cilindro ? (jangada as any).cilindro : undefined);
  }, [jangada]);

  // Buscar inspeções associadas à jangada
  const { buscarInspecoesPorEquipamento, criarInspecao } = useInspecoes();
  // Tipar corretamente o estado para Inspecao[]
  type Inspecao = {
    id: string;
    equipamentoNome: string;
    clienteNome: string;
    tipoInspecao: string;
    tecnico: string;
    dataInspecao: string;
    checklist: any;
  };
  const [inspecoesJangada, setInspecoesJangada] = useState<Inspecao[]>([]);
  useEffect(() => {
    if (jangada) {
      buscarInspecoesPorEquipamento(jangada.id).then(setInspecoesJangada);
    }
  }, [jangada]);

  // Criar nova inspeção para esta jangada
  const [creatingInspecao, setCreatingInspecao] = useState(false);
  const handleAdicionarInspecao = async () => {
    if (!jangada) return;
    try {
      setCreatingInspecao(true);
      const payload = {
        equipamentoId: jangada.id,
        equipamentoNome: jangada.nome || jangada.numero || '',
        clienteId: (jangada as any).proprietario || '',
        clienteNome: (jangada as any).proprietario || '',
        tipoInspecao: 'inicial',
        tecnico: 'Sistema',
        dataInspecao: new Date().toISOString(),
        checklist: []
      };
      const created = await criarInspecao(payload as any);
      // Recarregar lista
      const updated = await buscarInspecoesPorEquipamento(jangada.id);
      setInspecoesJangada(updated);
      setCreatingInspecao(false);
      // router.push(`/agenda/inspecao/${created.id}`); // optional navigation
    } catch (err) {
      console.error('Erro ao criar inspeção:', err);
      setCreatingInspecao(false);
      alert('Erro ao criar inspeção: ' + (err as any)?.message || String(err));
    }
  };

  // Buscar dados ao vivo do cilindro quando o modal abrir
  useEffect(() => {
    let mounted = true;
    async function loadCyl() {
      if (!showCilindroModal || !selectedCilindro) return;
      setCylLoading(true);
      setCylError(null);
      try {
        const res = await fetch(`/api/cilindros/${encodeURIComponent(selectedCilindro)}`);
        if (!res.ok) {
          // try to extract JSON error message if present
          let msg = `HTTP ${res.status}`;
          try {
            const body = await res.json();
            if (body && body.error) msg = String(body.error);
          } catch (e) {
            // ignore
          }
          throw new Error(msg);
        }
        const data = await res.json();
        if (!mounted) return;
        setCylDetails(data);
      } catch (err: any) {
        if (!mounted) return;
        setCylError(err?.message || String(err));
      } finally {
        if (mounted) setCylLoading(false);
      }
    }
    loadCyl();
    return () => { mounted = false; };
  }, [showCilindroModal, selectedCilindro]);

  // Salvar artigos associados
  const [savingArtigos, setSavingArtigos] = useState(false);

  const handleSaveArtigos = async () => {
    if (!jangada) return;
    try {
      // Normalizar quantidades: garantir inteiro >= 1
      const normalized = (artigos || []).map((a: any) => {
        const raw = a?.quantidade;
        const n = Number.isInteger(raw) ? raw : parseInt(String(raw || '1'), 10);
        return { ...a, quantidade: Number.isNaN(n) ? 1 : Math.max(1, n) };
      });
      setSavingArtigos(true);
      await updateJangada.mutateAsync({ id: jangada.id, data: { artigos: normalized, cilindro: selectedCilindro } });
      setSavingArtigos(false);
    } catch (err) {
      setSavingArtigos(false);
      console.error('Erro ao salvar artigos da jangada', err);
    }
  };

  // Instalar cilindro na jangada (saida do stock)
  const handleInstall = async () => {
    if (!jangada || !selectedCilindro) return;
    const ok = confirm('Confirma instalar este cilindro na jangada?');
    if (!ok) return;
    const responsavel = prompt('Nome do responsável pela instalação (opcional)', '') || undefined;
    try {
      setMoveLoadingInstall(true);
      const res = await fetch('/api/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'saida',
          quantidade: 1,
          motivo: 'Instalação em jangada',
          responsavel,
          destino: 'jangada',
          cilindroId: selectedCilindro,
          jangadaId: jangada.id,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Persistir associação na jangada
      await updateJangada.mutateAsync({ id: jangada.id, data: { cilindro: selectedCilindro } });
      setMoveLoadingInstall(false);
      router.refresh();
    } catch (err) {
      setMoveLoadingInstall(false);
      console.error('Erro ao instalar cilindro', err);
      alert('Erro ao instalar cilindro: ' + (err as any)?.message || String(err));
    }
  };

  // Desinstalar cilindro da jangada (entrada para o stock)
  const handleUninstall = async () => {
    if (!jangada || !selectedCilindro) return;
    const ok = confirm('Confirma desinstalar o cilindro e registar entrada no stock?');
    if (!ok) return;
    const responsavel = prompt('Nome do responsável pela desinstalação (opcional)', '') || undefined;
    try {
      setMoveLoadingUninstall(true);
      const res = await fetch('/api/stock/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'entrada',
          quantidade: 1,
          motivo: 'Desinstalação de jangada',
          responsavel,
          destino: 'stock',
          cilindroId: selectedCilindro,
          jangadaId: jangada.id,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Persistir desassociação na jangada
      await updateJangada.mutateAsync({ id: jangada.id, data: { cilindro: undefined } });
      setSelectedCilindro(undefined);
      setMoveLoadingUninstall(false);
      router.refresh();
    } catch (err) {
      setMoveLoadingUninstall(false);
      console.error('Erro ao desinstalar cilindro', err);
      alert('Erro ao desinstalar cilindro: ' + (err as any)?.message || String(err));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando jangada...</p>
        </div>
      </div>
    );
  }

  if (!jangada) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Jangada não encontrada</h2>
          <p className="text-gray-600 mb-4">A jangada solicitada não existe.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Ficha de Jangada
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Detalhes completos da jangada
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleSaveArtigos} disabled={savingArtigos}>
              {savingArtigos ? 'Guardando...' : 'Guardar Artigos'}
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Anchor className="h-5 w-5" />
                Informações da Jangada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Número</label>
                  <p className="text-lg font-semibold">{jangada.numero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg font-semibold">{jangada.nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Marca</label>
                  <p>{jangada.marca || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Modelo</label>
                  <p>{jangada.modelo || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lotação</label>
                  <p>{jangada.lotacao || 'Não informado'} passageiros</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        jangada.status === 'ativo' ? 'default' :
                        jangada.status === 'manutencao' ? 'secondary' : 'destructive'
                      }
                    >
                      {jangada.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cilindro Associado</label>
                  <div className="mt-1">
                    <select
                      className="input w-full"
                      value={selectedCilindro || ''}
                      onChange={e => setSelectedCilindro(e.target.value || undefined)}
                    >
                      <option value="">-- Nenhum --</option>
                      {cilindros.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.numeroSerie || c.id} {c.marca ? `- ${c.marca}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedCilindro && (
                  <div className="md:col-span-2">
                    {(() => {
                      const cyl = cilindros.find((c: any) => c.id === selectedCilindro);
                      if (!cyl) return <div className="text-sm text-gray-500">Cilindro seleccionado não encontrado.</div>;
                      return (
                        <div className="p-3 border rounded bg-white">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{cyl.numeroSerie || cyl.id}</div>
                              <div className="text-sm text-gray-600">{cyl.marca || '-'} {cyl.modelo ? `• ${cyl.modelo}` : ''}</div>
                            </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => setShowCilindroModal(true)}>Abrir cilindro</Button>
                                  {selectedCilindro && (
                                    <>
                                      <Button size="sm" onClick={handleInstall} disabled={moveLoadingInstall}>
                                        {moveLoadingInstall ? <Loader2 className="animate-spin h-4 w-4" /> : 'Instalar'}
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={handleUninstall} disabled={moveLoadingUninstall}>
                                        {moveLoadingUninstall ? <Loader2 className="animate-spin h-4 w-4" /> : 'Desinstalar'}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            {cyl.dataValidade && <div><b>Validade:</b> {cyl.dataValidade}</div>}
                            {cyl.ultimaInspecao && <div><b>Última inspeção:</b> {cyl.ultimaInspecao}</div>}
                            {cyl.proximaInspecao && <div><b>Próxima inspeção:</b> {cyl.proximaInspecao}</div>}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <Dialog open={showCilindroModal} onOpenChange={open => {
                  setShowCilindroModal(open);
                  if (!open) {
                    setCylDetails(null);
                    setCylError(null);
                    setCylLoading(false);
                  }
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Detalhes do Cilindro</DialogTitle>
                    </DialogHeader>
                    <div>
                      {cylLoading ? (
                        <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> <span>Carregando cilindro...</span></div>
                      ) : cylError ? (
                        <div className="text-sm text-red-600">Erro ao carregar: {cylError}</div>
                      ) : cylDetails ? (
                        <div className="space-y-2">
                          <div className="font-semibold">{cylDetails.numeroSerie || cylDetails.id}</div>
                          <div className="text-sm text-gray-600">{cylDetails.marca || '-'} {cylDetails.modelo ? `• ${cylDetails.modelo}` : ''}</div>
                          {cylDetails.dataFabricacao && <div><b>Fabricado em:</b> {cylDetails.dataFabricacao}</div>}
                          {cylDetails.dataValidade && <div><b>Validade:</b> {cylDetails.dataValidade}</div>}
                          {cylDetails.ultimaInspecao && <div><b>Última inspeção:</b> {cylDetails.ultimaInspecao}</div>}
                          {cylDetails.proximaInspecao && <div><b>Próxima inspeção:</b> {cylDetails.proximaInspecao}</div>}
                          {cylDetails.observacoes && <div><b>Observações:</b> {cylDetails.observacoes}</div>}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Cilindro não selecionado.</div>
                      )}
                    </div>
                    <DialogFooter>
                      {selectedCilindro && (
                        (() => {
                          // tentar resolver item de stock correspondente ao cilindro
                          const codigo = (cylDetails && (cylDetails.numeroSerie || cylDetails.id)) || selectedCilindro;
                          const stockItem = stock.find((s: any) => s.codigo === codigo);
                          if (stockItem) {
                            return (
                              <Link href={`/stock/${stockItem.id}`}>
                                <Button variant="ghost">Abrir item no Stock</Button>
                              </Link>
                            );
                          }
                          return (
                            <Link href={`/cilindros?id=${encodeURIComponent(selectedCilindro)}`}>
                              <Button variant="ghost">Ir para página do cilindro</Button>
                            </Link>
                          );
                        })()
                      )}
                      <DialogClose asChild>
                        <Button variant="secondary">Fechar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Artigos Associados</label>
                  <div className="mt-2 space-y-3">
                    {artigos.length === 0 && <div className="text-sm text-gray-500">Nenhum artigo associado.</div>}
                    {artigos.map((artigo, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          className="input flex-1"
                          value={artigo.cilindroId ? `cil:${artigo.cilindroId}` : (artigo.stockId || '')}
                          onChange={e => {
                            const val = e.target.value || '';
                            const updated = [...artigos];
                            if (val.startsWith('cil:')) {
                              const cid = val.slice(4);
                              const cyl = cilindros.find((c: any) => c.id === cid);
                              updated[idx] = { ...updated[idx], stockId: null, cilindroId: cid, nome: cyl ? (cyl.numeroSerie || cyl.id) : updated[idx].nome };
                            } else {
                              const stockId = val || null;
                              const stockItem = stock.find((s: any) => s.id === stockId);
                              updated[idx] = { ...updated[idx], stockId, cilindroId: undefined, nome: stockItem ? stockItem.nome : updated[idx].nome };
                            }
                            setArtigos(updated);
                          }}
                        >
                          <option value="">-- Selecionar artigo do stock --</option>
                          {stock.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                          ))}
                          {cilindros && cilindros.length > 0 && (
                            <>
                              <option disabled>-- Cilindros (tratar como artigo) --</option>
                              {cilindros.map((c: any) => (
                                <option key={`cil-${c.id}`} value={`cil:${c.id}`}>Cilindro: {c.numeroSerie || c.id}</option>
                              ))}
                            </>
                          )}
                        </select>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="Qtd"
                          className="input w-24"
                          value={typeof artigo.quantidade !== 'undefined' ? String(artigo.quantidade) : '1'}
                          onChange={e => { const updated = [...artigos]; const v = parseInt(e.target.value || '1', 10); updated[idx] = { ...updated[idx], quantidade: Number.isNaN(v) ? 1 : Math.max(1, v) }; setArtigos(updated); }}
                        />
                        <input
                          type="text"
                          placeholder="Lote"
                          className="input w-40"
                          value={artigo.lote || ''}
                          onChange={e => { const updated = [...artigos]; updated[idx] = { ...updated[idx], lote: e.target.value }; setArtigos(updated); }}
                        />
                        <input
                          type="date"
                          className="input w-44"
                          value={artigo.validade ? new Date(artigo.validade).toISOString().slice(0,10) : ''}
                          onChange={e => { const updated = [...artigos]; updated[idx] = { ...updated[idx], validade: e.target.value }; setArtigos(updated); }}
                        />
                        <button className="btn btn-outline" onClick={() => { const updated = artigos.filter((_, i) => i !== idx); setArtigos(updated); }}>Remover</button>
                      </div>
                    ))}
                    <div>
                      <button className="btn btn-secondary" onClick={() => setArtigos([...artigos, { nome: '', stockId: null, lote: '', validade: '', quantidade: 1 }])}>Adicionar Artigo</button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proprietário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{jangada.proprietario}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inspeções associadas à jangada */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Checklists de Inspeção da Jangada</h2>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Checklists de Inspeção da Jangada</h2>
            <div>
              <Button size="sm" onClick={handleAdicionarInspecao} disabled={creatingInspecao}>
                {creatingInspecao ? 'Criando...' : 'Adicionar Inspeção'}
              </Button>
            </div>
          </div>
          {inspecoesJangada.length === 0 ? (
            <p className="text-gray-600">Nenhuma inspeção encontrada para esta jangada.</p>
          ) : (
            inspecoesJangada.map(inspecao => (
              <QuadroInspecao
                key={inspecao.id}
                inspecaoId={inspecao.id}
                equipamentoNome={inspecao.equipamentoNome}
                clienteNome={inspecao.clienteNome}
                tipoInspecao={
                  ["anual", "extraordinaria", "inicial", "final"].includes(inspecao.tipoInspecao)
                    ? inspecao.tipoInspecao as "anual" | "extraordinaria" | "inicial" | "final"
                    : "inicial"
                }
                tecnico={inspecao.tecnico}
                dataInspecao={inspecao.dataInspecao}
                onSalvar={() => {}}
                checklistInicial={inspecao.checklist}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
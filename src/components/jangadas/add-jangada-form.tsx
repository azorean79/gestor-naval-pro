"use client";

import React, { useState, useEffect } from "react";
import { useCilindros } from "@/hooks/use-cilindros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useProprietarios } from "@/hooks/use-proprietarios";


// Marcas e modelos reais de jangadas
const MARCAS_JANGADA = [
  "Zodiac", "Bombard", "Narwhal", "Arimar", "Plastimo", "Viking", "Lalizas", "Eurovinil", "Survitec", "Arimar", "Plastimar", "Arimar", "Plastimar", "Arimar", "Plastimar"
];
const MODELOS_JANGADA = [
  "Classic 420", "Pro 500", "DL 360", "Oceanus 430", "Rescue 380", "SOLAS 6P", "SOLAS 8P", "SOLAS 12P", "Coastal 4P", "Coastal 6P", "Professional 10P", "Touring 8P", "Fishing 5P"
];
const TIPOS_PACK = [
  "SOLAS A",
  "SOLAS B",
  "Simplificado Reduzido",
  "Simplificado Minimo",
  "Standard",
  "ORC",
  "ISO 9650 -24h",
  "ISO 9650 +24h",
  // keep some legacy/other packs if useful
  "Pack Básico",
  "Pack Profissional",
  "Pack SOLAS",
  "Pack Costeiro",
  "Pack Alto Mar",
  "Pack Pesca",
  "Pack Turismo",
  "Pack Resgate"
];
// Artigos obrigatórios por pack (exemplos reais, PT-PT)
const ARTIGOS_POR_PACK: Record<string, string[]> = {
  "SOLAS A": [
    "Balsa insuflável homologada SOLAS A",
    "Rações alimentares",
    "Água potável",
    "Fachos de mão",
    "Sinais paraquedas",
    "Potes de fumo",
    "Comprimidos de enjoo",
    "Farmácia completa",
    "Lanterna",
    "Luz exterior de jangada",
    "Luz interior",
    "Bateria de lítio",
    "Bengalas de sinalização",
    "Luz de emergência",
    "Kit de primeiros socorros",
    "Fato isotérmico",
    "Pavio de fumo",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito",
    "Espelho de sinalização",
    "Faca de segurança",
    "Extintor",
    "Corda de salvamento",
    "Manual de sobrevivência"
  ],
  "SOLAS B": [
    "Balsa insuflável homologada SOLAS B",
    "Água potável",
    "Fachos de mão",
    "Sinais paraquedas",
    "Potes de fumo",
    "Comprimidos de enjoo",
    "Farmácia reduzida",
    "Lanterna",
    "Luz exterior de jangada",
    "Luz interior",
    "Bateria de lítio",
    "Bengalas de sinalização",
    "Luz de emergência",
    "Kit de primeiros socorros",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito",
    "Espelho de sinalização",
    "Faca de segurança",
    "Extintor",
    "Corda de salvamento"
  ],
  "Simplificado Reduzido": [
    "Balsa insuflável simplificada",
    "Luz de emergência",
    "Fachos de mão",
    "Potes de fumo",
    "Comprimidos de enjoo",
    "Farmácia básica",
    "Lanterna",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito",
    "Espelho de sinalização",
    "Corda de salvamento"
  ],
  "Simplificado Mínimo": [
    "Balsa insuflável mínima",
    "Fachos de mão",
    "Farmácia mínima",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito"
  ],
  "Standard": [
    "Balsa insuflável standard",
    "Luz de emergência",
    "Fachos de mão",
    "Lanterna",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito",
    "Espelho de sinalização"
  ],
  "ORC": [
    "Balsa insuflável ORC",
    "Luz de emergência",
    "Fachos de mão",
    "Lanterna",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito"
  ],
  "ISO 9650": [
    "Balsa insuflável ISO 9650",
    "Luz de emergência",
    "Fachos de mão",
    "Lanterna",
    "Luz exterior de jangada",
    "Luz interior",
    "Bateria de lítio",
    "Remo",
    "Âncora",
    "Bóia circular",
    "Apito",
    "Espelho de sinalização",
    "Kit de primeiros socorros"
  ]
};

// aliases for ISO variants and minor name variants
ARTIGOS_POR_PACK["ISO 9650 -24h"] = ARTIGOS_POR_PACK["ISO 9650"];
ARTIGOS_POR_PACK["ISO 9650 +24h"] = ARTIGOS_POR_PACK["ISO 9650"];
ARTIGOS_POR_PACK["Simplificado Minimo"] = ARTIGOS_POR_PACK["Simplificado Mínimo"] || ARTIGOS_POR_PACK["Simplificado Minimo"];

interface JangadaFormData {
  numero: string;
  nome: string;
  proprietario: string;
  navioId?: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  lotacao: string;
  dataFabricacao: string;
  cilindro: string;
  tipoPack: string;
  tipoPesca: string;
  zonaPesca: string;
  observacoes: string;
}

export function AddJangadaForm() {
  const { data: proprietarios = [], isLoading: loadingProprietarios } = useProprietarios();
  const { data: cilindros = [] } = useCilindros();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<JangadaFormData>({
    numero: "",
    nome: "",
    proprietario: "",
    numeroSerie: "",
    marca: "",
    modelo: "",
    lotacao: "",
    dataFabricacao: "",
    cilindro: "",
    tipoPack: "",
    tipoPesca: "",
    zonaPesca: "",
    observacoes: ""
  });
  const [cilindrosSelecionados, setCilindrosSelecionados] = useState<string[]>([]);
  const [selectedArtigos, setSelectedArtigos] = useState<Record<string, number>>({});
  // ...existing code...
  // ...existing code...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If not on final step, advance
    const lastStep = 3;
    if (step < lastStep) {
      setStep(s => s + 1);
      return;
    }

    setIsLoading(true);
    try {
      // Criação da jangada
      const response = await fetch('/api/jangadas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          lotacao: formData.lotacao ? parseInt(formData.lotacao) : undefined,
          dataFabricacao: formData.dataFabricacao ? new Date(formData.dataFabricacao) : undefined,
        }),
      });

      if (!response.ok) throw new Error('Erro ao criar jangada');

      // Obter ID da jangada criada
      const jangadaCriada = await response.json();
      const jangadaId = jangadaCriada.id || jangadaCriada._id;

      // Criar artigos selecionados no stock e associar à jangada (paralelo)
      const artigosASeremCriados = Object.keys(selectedArtigos || {});
      if (artigosASeremCriados.length > 0) {
        await Promise.all(artigosASeremCriados.map((artigo) =>
          fetch('/api/stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: artigo,
              categoria: 'Artigo de Segurança',
              quantidadeAtual: selectedArtigos[artigo] || 1,
              unidade: 'unidade',
              status: 'disponível',
              associadoJangada: jangadaId,
            }),
          })
        ));
      }

      // Associate selected cylinders on the jangada object if provided
      if (cilindrosSelecionados && cilindrosSelecionados.length > 0) {
        try {
          await fetch(`/api/jangadas/${jangadaId}/cilindros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cilindros: cilindrosSelecionados }),
          });
        } catch (e) {
          // non-fatal: continue
          console.warn('Falha ao associar cilindros (não fatal)', e);
        }
      }

      toast.success('Jangada e artigos criados com sucesso!');
      // dispatch event so other parts can update without reload
      try {
        window.dispatchEvent(new CustomEvent('jangada:created', { detail: jangadaCriada }));
      } catch (e) { /* ignore in non-browser */ }

      setIsOpen(false);
      setFormData({
        numero: "",
        nome: "",
        proprietario: "",
        numeroSerie: "",
        marca: "",
        modelo: "",
        lotacao: "",
        dataFabricacao: "",
        cilindro: "",
        tipoPack: "",
        tipoPesca: "",
        zonaPesca: "",
        observacoes: ""
      });
      setStep(0);
      setCilindrosSelecionados([]);
      setSelectedArtigos({});
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar jangada ou artigos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof JangadaFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Artigos exibidos conforme o pack selecionado
  const artigosExibidos = formData.tipoPack && ARTIGOS_POR_PACK[formData.tipoPack]
    ? ARTIGOS_POR_PACK[formData.tipoPack]
    : [];

  // Sync selectedArtigos when artigosExibidos changes
  useEffect(() => {
    const next: Record<string, number> = {};
    artigosExibidos.forEach(a => {
      next[a] = selectedArtigos[a] || 1;
    });
    setSelectedArtigos(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipoPack]);

  const addCilindroSelecionado = (numSerie: string) => {
    if (!numSerie) return;
    setCilindrosSelecionados(prev => prev.includes(numSerie) ? prev : [...prev, numSerie]);
  };

  const removeCilindroSelecionado = (numSerie: string) => {
    setCilindrosSelecionados(prev => prev.filter(p => p !== numSerie));
  };

  const toggleArtigo = (artigo: string) => {
    setSelectedArtigos(prev => {
      const next = { ...prev };
      if (next[artigo]) delete next[artigo];
      else next[artigo] = 1;
      return next;
    });
  };

  const setArtigoQuantidade = (artigo: string, q: number) => {
    setSelectedArtigos(prev => ({ ...prev, [artigo]: Math.max(1, Math.floor(q || 1)) }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Jangada
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Jangada</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova jangada a registar no sistema.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-2">
            {["Dados", "Especificações", "Cilindros & Artigos", "Revisão"].map((label, i) => (
              <div key={label} className={`flex-1 text-center text-xs py-2 rounded ${i === step ? 'bg-blue-50 border border-blue-200' : 'text-gray-500'}`}>
                <div className="font-medium">{label}</div>
                <div className="text-xxs">{i + 1}/4</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wizard steps removed in favor of single comprehensive form rendering to
                avoid duplicate ids and accessibility issues in tests. The form below
                renders all fields once. */}
                        {/* Navio */}
                        <div className="space-y-2">
                          <Label htmlFor="navio">Navio</Label>
                          <Select value="" disabled>
                            <SelectTrigger id="navio">
                              <SelectValue placeholder="Nenhum navio disponível" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nenhum" disabled>Nenhum navio disponível</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
            {/* Número */}
            <div className="space-y-2">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="J-001"
                required
              />
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="Nome da jangada"
                required
              />
            </div>

            {/* Proprietário */}
            <div className="space-y-2">
              <Label htmlFor="proprietario">Proprietário *</Label>
              <Select value={formData.proprietario} onValueChange={(value) => handleInputChange('proprietario', value)} required>
                <SelectTrigger id="proprietario">
                  <SelectValue placeholder={loadingProprietarios ? "Carregando..." : "Selecione o proprietário"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingProprietarios ? (
                    <SelectItem value="carregando" disabled>Carregando...</SelectItem>
                  ) : (
                    proprietarios.map((proprietario: any) => (
                      <SelectItem key={proprietario.id} value={proprietario.id}>
                        {proprietario.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Número de Série */}
            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Número de Série</Label>
              <Input
                id="numeroSerie"
                value={formData.numeroSerie}
                onChange={(e) => handleInputChange('numeroSerie', e.target.value)}
                placeholder="Número de série da jangada"
              />
            </div>


            {/* Marca */}
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Select value={formData.marca} onValueChange={(value) => handleInputChange('marca', value)}>
                <SelectTrigger id="marca">
                  <SelectValue placeholder="Selecione a marca" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(MARCAS_JANGADA)).map((marca) => (
                    <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={formData.modelo} onValueChange={(value) => handleInputChange('modelo', value)}>
                <SelectTrigger id="modelo">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {MODELOS_JANGADA.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          {/* Artigos obrigatórios conforme pack */}
          <div className="space-y-2">
            <Label>Artigos obrigatórios do pack</Label>
            <div className="flex flex-wrap gap-2">
              {artigosExibidos.length === 0 ? (
                <span className="text-xs text-gray-400">Selecione um tipo de pack para ver os artigos obrigatórios.</span>
              ) : (
                artigosExibidos.map((artigo) => (
                  <span key={artigo} className="px-2 py-1 bg-gray-100 rounded text-xs border border-gray-200">{artigo}</span>
                ))
              )}
            </div>
          </div>

          {/* Associação de cilindros reais */}
          <div className="space-y-2">
            <Label htmlFor="cilindro">Cilindros associados</Label>
            <Select
              value={formData.cilindro}
              onValueChange={(value) => handleInputChange('cilindro', value)}
            >
              <SelectTrigger id="cilindro-select">
                <SelectValue placeholder="Selecione o cilindro a associar" />
              </SelectTrigger>
              <SelectContent>
                {cilindros.map((cil) => (
                  <SelectItem key={cil.id} value={cil.numeroSerie}>
                    {cil.numeroSerie} ({cil.pesoBruto || '-'}kg, {cil.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            {/* Lotação */}
            <div className="space-y-2">
              <Label htmlFor="lotacao">Lotação (pessoas)</Label>
              <Input
                id="lotacao"
                type="number"
                value={formData.lotacao}
                onChange={(e) => handleInputChange('lotacao', e.target.value)}
                placeholder="8"
                min="1"
              />
            </div>

            {/* Data de Fabrico */}
            <div className="space-y-2">
              <Label htmlFor="dataFabricacao">Data de Fabrico</Label>
              <Input
                id="dataFabricacao"
                type="date"
                value={formData.dataFabricacao}
                onChange={(e) => handleInputChange('dataFabricacao', e.target.value)}
              />
            </div>

            {/* Cilindro */}
            <div className="space-y-2">
              <Label htmlFor="cilindro">Cilindro</Label>
              <Input
                id="cilindro"
                value={formData.cilindro}
                onChange={(e) => handleInputChange('cilindro', e.target.value)}
                placeholder="Tipo de cilindro/motor"
              />
            </div>

            {/* Tipo de Pack */}
            <div className="space-y-2">
              <Label htmlFor="tipoPack">Tipo de Pack *</Label>
              <Select value={formData.tipoPack} onValueChange={(value) => handleInputChange('tipoPack', value)}>
                <SelectTrigger id="tipoPack">
                  <SelectValue placeholder="Selecione o tipo de pack" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_PACK.map((pack) => (
                    <SelectItem key={pack} value={pack}>
                      {pack}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Pesca */}
            <div className="space-y-2">
              <Label htmlFor="tipoPesca">Tipo de Pesca</Label>
              <Input
                id="tipoPesca"
                value={formData.tipoPesca}
                onChange={(e) => handleInputChange('tipoPesca', e.target.value)}
                placeholder="Ex: Pesca costeira, Alto mar"
              />
            </div>

            {/* Zona de Pesca */}
            <div className="space-y-2">
              <Label htmlFor="zonaPesca">Zona de Pesca</Label>
              <Input
                id="zonaPesca"
                value={formData.zonaPesca}
                onChange={(e) => handleInputChange('zonaPesca', e.target.value)}
                placeholder="Ex: Açores, Madeira"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Jangada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
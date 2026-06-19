"use client";
import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { 
  ClipboardList, 
  Wrench, 
  Package, 
  Cylinder, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  Edit3, 
  Save, 
  Play, 
  Ship, 
  Calendar, 
  FileCheck, 
  Plus, 
  Trash2,
  X,
  History,
  Anchor,
  Shield,
  Gauge,
  FileSpreadsheet
} from 'lucide-react';
import JangadaWizardLoader from '@/modules/JangadaWizard/JangadaWizardLoader';
import WizardRouter from '@/modules/JangadaWizard/WizardRouter';
import { SubstituirArtigoDialog } from '@/components/jangadas/SubstituirArtigoDialog';
import { EditarArtigoDialog } from '@/components/jangadas/EditarArtigoDialog';
import { InspecaoDetalhesDialog } from '@/components/jangadas/InspecaoDetalhesDialog';
import { findMatchingArticleForPackItem } from '@/modules/rafts/mandatoryPack';

// Funções utilitárias para cálculos do teste de WP
function normalizePressureUnit(value: unknown) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'inhg') return 'inhg' as const;
  if (raw === 'mbar' || raw === 'mb') return 'mbar' as const;
  return 'inh2o' as const;
}

function parseDecimalValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().replace(',', '.');
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function convertPressureToMbar(value: unknown, unit: 'inh2o' | 'inhg' | 'mbar') {
  const parsed = parseDecimalValue(value);
  if (parsed === null) return null;
  if (unit === 'mbar') return parsed;
  if (unit === 'inhg') return parsed * 33.8638866667;
  return parsed * 2.490889;
}

function convertMbarToUnit(value: number | null, unit: 'inh2o' | 'inhg' | 'mbar') {
  if (value === null || !Number.isFinite(value)) return null;
  if (unit === 'mbar') return value;
  if (unit === 'inhg') return value / 33.8638866667;
  return value / 2.490889;
}

function formatDecimal(value: number | null, digits = 2) {
  if (value === null || !Number.isFinite(value)) return '';
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function addMinutesToClock(value: unknown, minutesToAdd: number) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return '';
  }
  const total = ((hours * 60 + minutes + minutesToAdd) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function buildWpDerivedValues(source: {
  pressureUnit?: unknown;
  startTime?: unknown;
  tempInitial?: unknown;
  tempFinal?: unknown;
  baroInitial?: unknown;
  baroFinal?: unknown;
  upperStart?: unknown;
  upperEnd?: unknown;
  lowerStart?: unknown;
  lowerEnd?: unknown;
}) {
  const unit = normalizePressureUnit(source.pressureUnit);
  const tempInitial = parseDecimalValue(source.tempInitial);
  const tempFinal = parseDecimalValue(source.tempFinal);
  const baroInitial = parseDecimalValue(source.baroInitial);
  const baroFinal = parseDecimalValue(source.baroFinal);
  const tempDelta = tempInitial !== null && tempFinal !== null ? tempFinal - tempInitial : null;
  const baroDelta = baroInitial !== null && baroFinal !== null ? baroFinal - baroInitial : null;
  const correctionTempMb = tempDelta !== null ? -(tempDelta * 4) : null;
  const correctionBaroMb = baroDelta !== null ? baroDelta : null;
  const totalCorrectionMb = correctionTempMb !== null && correctionBaroMb !== null
    ? correctionTempMb + correctionBaroMb
    : correctionTempMb ?? correctionBaroMb;
  const temperatureWithinManual = tempDelta === null ? null : Math.abs(tempDelta) <= 3.5;
  const endTime = addMinutesToClock(source.startTime, 60);

  const analyzeChamber = (startRaw: unknown, endRaw: unknown) => {
    const startMb = convertPressureToMbar(startRaw, unit);
    const endMb = convertPressureToMbar(endRaw, unit);
    const correctedEndMb = endMb !== null && totalCorrectionMb !== null ? endMb + totalCorrectionMb : endMb;
    const dropMbRaw = startMb !== null && correctedEndMb !== null ? startMb - correctedEndMb : null;
    const dropMb = dropMbRaw !== null ? Math.max(0, dropMbRaw) : null;
    const dropPercent = startMb !== null && startMb > 0 && dropMb !== null ? (dropMb / startMb) * 100 : null;
    const passes = dropPercent === null
      ? null
      : dropPercent <= 5 && temperatureWithinManual !== false;

    return {
      correctedEndMb,
      dropMb,
      dropPercent,
      passes,
      correctedEndDisplay: formatDecimal(convertMbarToUnit(correctedEndMb, unit)),
      dropDisplay: formatDecimal(convertMbarToUnit(dropMb, unit)),
      dropPercentDisplay: dropPercent === null ? '' : formatDecimal(dropPercent, 2),
    };
  };

  return {
    unit,
    endTime,
    tempDelta,
    correctionTempMb,
    correctionBaroMb,
    temperatureWithinManual,
    upper: analyzeChamber(source.upperStart, source.upperEnd),
    lower: analyzeChamber(source.lowerStart, source.lowerEnd),
  };
}

type Artigo = {
  id: number;
  name: string;
  quantidade: number;
  validade: string | null;
  referencia: string | null;
  codigoFabricante: string | null;
};

type JangadaCatalogOption = { marca: string; modelo: string; };

type Props = {
  jangadaId: number;
  initialData: any;
  ships: any[];
};

export default function JangadaDetailPageClient({ jangadaId, initialData, ships }: Props) {
  const [isInspecting, setIsInspecting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'artigos' | 'pack' | 'historico' | 'testeWP'>('dados');
  const [data, setData] = useState(initialData || {});
  const [editForm, setEditForm] = useState(initialData ? { ...initialData } : {});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!initialData);
  const [errorData, setErrorData] = useState(false);
  const [selectedInspecao, setSelectedInspecao] = useState<any | null>(null);
  const [printMode, setPrintMode] = useState<'dossier' | 'checklist'>('dossier');
  const [offlineDraftsCount, setOfflineDraftsCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [catalogOptions, setCatalogOptions] = useState<JangadaCatalogOption[]>([]);
  const [availablePackTypeOptions, setAvailablePackTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
      const drafts = JSON.parse(localStorage.getItem('offline_inspections') || '[]');
      setOfflineDraftsCount(drafts.length);
    }
  }, [isInspecting]);

  // Fetch catalog options and pack types for dropdowns
  useEffect(() => {
    fetchJangadaCatalogOptions();
    fetchAvailablePackTypeOptions();
  }, []);

  async function fetchJangadaCatalogOptions() {
    try {
      const res = await fetch('/api/jangadas/catalog-options');
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Erro HTTP ${res.status}`);
      }
      const nextOptions = Array.isArray(data?.options)
        ? data.options.filter((item: unknown): item is JangadaCatalogOption => {
            if (!item || typeof item !== 'object') return false;
            const candidate = item as Partial<JangadaCatalogOption>;
            return Boolean(String(candidate.marca || '').trim()) && Boolean(String(candidate.modelo || '').trim());
          })
        : [];
      setCatalogOptions(nextOptions);
    } catch (err) {
      console.error('Error fetching jangada catalog options:', err);
      setCatalogOptions([]);
    }
  }

  async function fetchAvailablePackTypeOptions() {
    try {
      const res = await fetch('/api/jangadas/pack-types', { cache: 'no-store' });
      const raw = await res.text();
      const data = raw ? JSON.parse(raw) : {};
      if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Erro HTTP ${res.status}`);
      }
      setAvailablePackTypeOptions(
        Array.isArray(data?.options)
          ? data.options.map((item: unknown) => String(item || '').trim()).filter(Boolean)
          : []
      );
    } catch (err) {
      console.error('Error fetching available pack type options:', err);
      setAvailablePackTypeOptions([]);
    }
  }

  const syncOfflineDrafts = async () => {
    const drafts = JSON.parse(localStorage.getItem('offline_inspections') || '[]');
    if (drafts.length === 0) return;
    
    let successCount = 0;
    setSaving(true);
    for (const draft of drafts) {
      try {
        const method = typeof draft.payload.id === 'string' && draft.payload.id.startsWith('offline_') ? "POST" : (draft.payload.id ? "PUT" : "POST");
        const url = method === "PUT" ? `/api/inspecoes?id=${draft.payload.id}` : '/api/inspecoes';
        
        const jangadaPayload = { ...draft.payload };
        delete jangadaPayload.checklist;
        delete jangadaPayload.packItems;
        delete jangadaPayload.artigosSubstituidos;
        if (typeof jangadaPayload.id === 'string' && jangadaPayload.id.startsWith('offline_')) {
          delete jangadaPayload.id;
        }
        
        await fetch(`/api/jangadas/${draft.jangadaId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jangadaPayload)
        });

        const cleanPayload = { ...draft.payload };
        if (typeof cleanPayload.id === 'string' && cleanPayload.id.startsWith('offline_')) {
          delete cleanPayload.id;
        }

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload)
        });
        
        if (res.ok) successCount++;
      } catch (err) {
        console.error("Erro ao sincronizar rascunho offline:", err);
      }
    }
    setSaving(false);
    
    if (successCount === drafts.length) {
      localStorage.removeItem('offline_inspections');
      alert(`Sincronização concluída com sucesso! ${successCount} inspeção(ões) enviada(s) para o servidor.`);
      setOfflineDraftsCount(0);
      
      const raftRes = await fetch(`/api/jangadas/${jangadaId}`);
      if (raftRes.ok) {
        const raftData = await raftRes.json();
        setData(raftData);
        setEditForm(raftData);
      }
    } else {
      alert(`Sincronização concluída parcialmente: ${successCount} de ${drafts.length} rascunhos sincronizados.`);
      const remaining = drafts.slice(successCount);
      localStorage.setItem('offline_inspections', JSON.stringify(remaining));
      setOfflineDraftsCount(remaining.length);
    }
  };
  
  const [isAddingInspecao, setIsAddingInspecao] = useState(false);
  const [editingInspecao, setEditingInspecao] = useState<any | null>(null);
  const [inspecaoForm, setInspecaoForm] = useState({
    certificadoNumero: '',
    dataInspecao: '',
    dataProxInspecao: '',
    responsavel: '',
    status: 'Concluída',
    navioNome: '',
  });

  React.useEffect(() => {
    if (editingInspecao) {
      setInspecaoForm({
        certificadoNumero: editingInspecao.certificadoNumero || '',
        dataInspecao: editingInspecao.dataInspecao || '',
        dataProxInspecao: editingInspecao.dataProxInspecao || '',
        responsavel: editingInspecao.responsavel || editingInspecao.usuario || '',
        status: editingInspecao.status || 'Concluída',
        navioNome: editingInspecao.navioNome || data.shipNameManual || '',
      });
    } else {
      setInspecaoForm({
        certificadoNumero: '',
        dataInspecao: '',
        dataProxInspecao: '',
        responsavel: '',
        status: 'Concluída',
        navioNome: data.shipNameManual || '',
      });
    }
  }, [editingInspecao, isAddingInspecao, data]);

  React.useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('dossier');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('startInspection') === '1') {
        setIsInspecting(true);
      }
    }
  }, []);

  // Articles state
  const [artigos, setArtigos] = useState<Artigo[]>(initialData?.artigos || []);
  const [newArtigo, setNewArtigo] = useState<Partial<Artigo>>({ name: '', quantidade: 1, validade: '', referencia: '', codigoFabricante: '' });
  const [isAddingArtigo, setIsAddingArtigo] = useState(false);

  const fetchJangadaData = async () => {
    try {
      const res = await fetch(`/api/jangadas/${jangadaId}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      setData(json);
      setEditForm(json);
      if (json.artigos) {
        setArtigos(json.artigos);
      }
    } catch (err) {
      console.error('Erro ao recarregar dados da jangada:', err);
    }
  };

  React.useEffect(() => {
    if (!initialData) {
      setLoadingData(true);
      fetchJangadaData()
        .then(() => setLoadingData(false))
        .catch(() => {
          setErrorData(true);
          setLoadingData(false);
        });
    }
  }, [jangadaId, initialData]);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium text-sm">A carregar dossier da jangada...</p>
        </div>
      </div>
    );
  }

  if (errorData || !data || !data.id) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-red-200 text-red-600 max-w-lg mx-auto mt-12 shadow-sm">
        <AlertCircle className="mx-auto mb-4" size={48} />
        <h2 className="text-xl font-bold">Jangada Não Encontrada</h2>
        <p className="mt-2 text-sm text-slate-500">O identificador da jangada solicitado é inválido ou não existe na base de dados.</p>
      </div>
    );
  }

  const handleEditChange = (field: string, value: any) => {
    setEditForm((prev: any) => {
      const updated = { ...prev, [field]: value };
      // Limpar modelo quando a marca muda
      if (field === 'brand') {
        updated.model = '';
      }
      if (field === 'dataInspecao' && value) {
        const brandNorm = (updated.brand || '').toUpperCase().trim();
        const isRfdDsb = brandNorm === 'RFD' || brandNorm === 'DSB';
        let years = 1;
        if (!isRfdDsb && linkedShip) {
          const haystack = `${linkedShip.tipoPesca || ''} ${linkedShip.tipoNavio || ''}`.toLowerCase();
          if (haystack.includes("recreio")) {
            years = 3;
          }
        }
        const parts = value.split('-');
        if (parts[0] && parts[0].length === 4) {
          const year = parseInt(parts[0]) + years;
          const month = parts[1] || '01';
          const day = parts[2] || '01';
          updated.dataProxInspecao = `${year}-${month}-${day}`;
        }
      }
      if (field === 'hruDataInstalacao') {
        if (value) {
          const parts = value.split('-');
          if (parts[0] && parts[0].length === 4) {
            const year = parseInt(parts[0]) + 2;
            const month = parts[1] || '01';
            const day = parts[2];
            updated.hruValidade = day ? `${year}-${month}-${day}` : `${year}-${month}`;
          }
        } else {
          updated.hruValidade = '';
        }
      }
      return updated;
    });
  };

  const handleWpFieldChange = (field: string, value: any) => {
    setEditForm((prev: any) => {
      const updated = { ...prev, [field]: value };
      
      const derived = buildWpDerivedValues({
        pressureUnit: updated.testeWPUnidadePressao,
        startTime: updated.testeWPHoraInicio,
        tempInitial: updated.testeWPTemperaturaInicial,
        tempFinal: updated.testeWPTemperaturaFinal,
        baroInitial: updated.testeWPPressaoAtmosfericaInicial,
        baroFinal: updated.testeWPPressaoAtmosfericaFinal,
        upperStart: updated.testeWPCamaraSuperiorInicio,
        upperEnd: updated.testeWPCamaraSuperiorFim,
        lowerStart: updated.testeWPCamaraInferiorInicio,
        lowerEnd: updated.testeWPCamaraInferiorFim,
      });

      updated.testeWPHoraFim = derived.endTime;
      updated.testeWPCamaraSuperiorQueda = derived.upper.dropDisplay;
      updated.testeWPCamaraInferiorQueda = derived.lower.dropDisplay;

      return updated;
    });
  };

  const handleCylinderChange = (field: string, value: any) => {
    setEditForm((prev: any) => {
      const updated = {
        ...prev,
        [field]: value
      };
      if (field === 'cylinderDataTeste' && value) {
        const parts = value.split('-');
        if (parts[0] && parts[0].length === 4) {
          const year = parseInt(parts[0]) + 5;
          const month = parts[1] || '01';
          const day = parts[2];
          updated.cylinderDataProxTeste = day ? `${year}-${month}-${day}` : `${year}-${month}`;
        }
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || errorJson.message || `Código ${response.status}`);
      }

      const updated = await response.json();
      setData(updated);
      setEditForm(updated);
      setIsEditing(false);
      alert('Alterações guardadas com sucesso!');
    } catch (err: any) {
      alert('Erro ao guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const buildChecklistPayload = () => {
    const checklist: Record<string, any> = {
      ...(data.inspectionChecklistValues || {})
    };

    const normalizeText = (text: string) => {
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    };

    const findArticle = (tokens: string[]) => {
      if (!data.artigos || !Array.isArray(data.artigos)) return null;
      return data.artigos.find((art: any) => {
        const nameNorm = normalizeText(art.name || '');
        return tokens.every(token => nameNorm.includes(normalizeText(token)));
      });
    };

    const mapArticle = (tokens: string[], refKey?: string, valKey?: string, qtyKey?: string, statusKey?: string, loteKey?: string) => {
      const art = findArticle(tokens);
      if (art) {
        if (refKey && art.referencia) checklist[refKey] = art.referencia;
        if (valKey && art.validade) {
          const valStr = String(art.validade);
          if (valStr.includes('T')) {
            checklist[valKey] = valStr.slice(0, 7);
          } else {
            checklist[valKey] = valStr;
          }
        }
        if (qtyKey && art.quantidade !== undefined) checklist[qtyKey] = art.quantidade;
        if (statusKey) checklist[statusKey] = 'YES';
        if (loteKey && art.codigoFabricante) {
          const lote = String(art.codigoFabricante).trim();
          checklist[loteKey] = lote.toUpperCase().startsWith('LOTE') ? lote : `LOTE ${lote}`;
        }
      } else if (statusKey) {
        checklist[statusKey] = 'NO';
      }
    };

    mapArticle(['farmacia'], 'ref_farmacia', 'validade_farmacia', 'qtd_farmacia', 'ambulancia', 'lote_farmacia');
    if (!checklist.ref_farmacia) mapArticle(['ambulancia'], 'ref_farmacia', 'validade_farmacia', 'qtd_farmacia', 'ambulancia', 'lote_farmacia');
    if (!checklist.ref_farmacia) mapArticle(['first', 'aid'], 'ref_farmacia', 'validade_farmacia', 'qtd_farmacia', 'ambulancia', 'lote_farmacia');
    if (!checklist.ref_farmacia) mapArticle(['socorros'], 'ref_farmacia', 'validade_farmacia', 'qtd_farmacia', 'ambulancia', 'lote_farmacia');

    mapArticle(['comprimido'], 'ref_comprimidos', 'validade_comprimidos', 'qtd_comprimidos', 'comprimidos_enjoo', 'lote_comprimidos');
    if (!checklist.ref_comprimidos) mapArticle(['pastilha'], 'ref_comprimidos', 'validade_comprimidos', 'qtd_comprimidos', 'comprimidos_enjoo', 'lote_comprimidos');
    if (!checklist.ref_comprimidos) mapArticle(['enjoo'], 'ref_comprimidos', 'validade_comprimidos', 'qtd_comprimidos', 'comprimidos_enjoo', 'lote_comprimidos');
    if (!checklist.ref_comprimidos) mapArticle(['seasick'], 'ref_comprimidos', 'validade_comprimidos', 'qtd_comprimidos', 'comprimidos_enjoo', 'lote_comprimidos');

    mapArticle(['paraquedas'], 'ref_paraquedas', 'validade_paraquedas', 'qtd_paraquedas', 'foguetoes_paraquedas', 'lote_paraquedas');
    if (!checklist.ref_paraquedas) mapArticle(['parachute'], 'ref_paraquedas', 'validade_paraquedas', 'qtd_paraquedas', 'foguetoes_paraquedas', 'lote_paraquedas');
    if (!checklist.ref_paraquedas) mapArticle(['rocket'], 'ref_paraquedas', 'validade_paraquedas', 'qtd_paraquedas', 'foguetoes_paraquedas', 'lote_paraquedas');

    mapArticle(['facho'], 'ref_fachos', 'validade_fachos_mao', 'qtd_fachos', 'fachos_mao', 'lote_fachos');
    if (!checklist.ref_fachos) mapArticle(['handflare'], 'ref_fachos', 'validade_fachos_mao', 'qtd_fachos', 'fachos_mao', 'lote_fachos');

    mapArticle(['fumo'], 'ref_potes', 'validade_potes_fumo', 'qtd_potes', 'potes_fumo', 'lote_potes');
    if (!checklist.ref_potes) mapArticle(['smoke'], 'ref_potes', 'validade_potes_fumo', 'qtd_potes', 'potes_fumo', 'lote_potes');
    if (!checklist.ref_potes) mapArticle(['fumigeno'], 'ref_potes', 'validade_potes_fumo', 'qtd_potes', 'potes_fumo', 'lote_potes');
    if (!checklist.ref_potes) mapArticle(['fumígeno'], 'ref_potes', 'validade_potes_fumo', 'qtd_potes', 'potes_fumo', 'lote_potes');

    mapArticle(['lanterna'], 'ref_lanterna', 'validade_lanterna', 'qtd_lanterna', 'lanterna', 'lote_lanterna');
    if (!checklist.ref_lanterna) mapArticle(['torch'], 'ref_lanterna', 'validade_lanterna', 'qtd_lanterna', 'lanterna', 'lote_lanterna');

    mapArticle(['pilha'], 'ref_bateria', 'validade_pilhas_lanterna', 'qtd_pilhas_lanterna', 'pilhas_lanterna', 'lote_bateria');
    if (!checklist.ref_bateria) mapArticle(['torch', 'batter'], 'ref_bateria', 'validade_pilhas_lanterna', 'qtd_pilhas_lanterna', 'pilhas_lanterna', 'lote_bateria');

    mapArticle(['bateria', 'litio'], 'ref_bateria_litio', 'validade_bateria', 'qtd_bateria_litio', 'bateria_litio', 'lote_bateria_litio');
    if (!checklist.ref_bateria_litio) mapArticle(['bateria', 'lítio'], 'ref_bateria_litio', 'validade_bateria', 'qtd_bateria_litio', 'bateria_litio', 'lote_bateria_litio');
    if (!checklist.ref_bateria_litio) mapArticle(['bateria', 'lithium'], 'ref_bateria_litio', 'validade_bateria', 'qtd_bateria_litio', 'bateria_litio', 'lote_bateria_litio');

    mapArticle(['cinta', 'fecho'], 'ref_cinta_fecho', undefined, 'qtd_cinta_fecho', 'cinta_fecho');
    if (!checklist.ref_cinta_fecho) mapArticle(['bursting', 'band'], 'ref_cinta_fecho', undefined, 'qtd_cinta_fecho', 'cinta_fecho');
    if (!checklist.ref_cinta_fecho) mapArticle(['bursting', 'tape'], 'ref_cinta_fecho', undefined, 'qtd_cinta_fecho', 'cinta_fecho');

    mapArticle(['jogo', 'repara'], 'ref_jogo_reparacao', undefined, 'qtd_jogo_reparacao', 'jogo_reparacao');
    if (!checklist.ref_jogo_reparacao) mapArticle(['repair', 'kit'], 'ref_jogo_reparacao', undefined, 'qtd_jogo_reparacao', 'jogo_reparacao');

    mapArticle(['luz', 'ext'], undefined, 'validade_luzes_exteriores', undefined, 'luz_exterior_bateria');
    mapArticle(['luz', 'int'], undefined, 'validade_bateria', undefined, 'luz_interior_bateria');

    mapArticle(['agua'], 'ref_agua', 'validade_agua', undefined, 'saco_agua');
    if (!checklist.ref_agua) mapArticle(['água'], 'ref_agua', 'validade_agua', undefined, 'saco_agua');
    if (!checklist.ref_agua) mapArticle(['water'], 'ref_agua', 'validade_agua', undefined, 'saco_agua');

    mapArticle(['racao'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');
    if (!checklist.ref_racoes) mapArticle(['ração'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');
    if (!checklist.ref_racoes) mapArticle(['racoes'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');
    if (!checklist.ref_racoes) mapArticle(['rações'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');
    if (!checklist.ref_racoes) mapArticle(['ration'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');
    if (!checklist.ref_racoes) mapArticle(['food'], 'ref_racoes', 'validade_racoes', undefined, 'racoes_alimentares');

    checklist.teste_wp = data.testeWP || 'N/A';
    checklist.teste_nap = data.testeNAP || 'N/A';
    checklist.teste_fs = data.testeFS || 'N/A';
    checklist.teste_gi = data.testeGI || 'N/A';
    checklist.teste_dl = data.testeDL || 'N/A';

    return checklist;
  };

  const handleExportCertificadoExcel = async () => {
    try {
      const payload = {
        certNumber: lastInspecao?.certificadoNumero || data.ultimoCertificadoNumero || '',
        inspectionDate: lastInspecao?.dataInspecao || data.dataInspecao || '',
        nextInspectionDate: lastInspecao?.dataProxInspecao || data.dataProxInspecao || '',
        shipName: data.shipNameManual || linkedShip?.nome || '',
        shipFlag: linkedShip?.bandeira || '',
        shipImo: linkedShip?.imo || '',
        shipCallSign: linkedShip?.callSignal || '',
        owner: data.owner || '',
        brand: data.brand || '',
        raftModel: data.model || '',
        raftCapacity: data.capacity || '',
        raftSerial: data.serial || '',
        manufactureDate: data.dataFabrico || '',
        fabricType: data.fabricType || '',
        painterLength: data.painterLength || '',
        maxStowageHeight: data.maxStowageHeight || '',
        cylinderSerial: data.cylinderSerial || '',
        cylinderCo2: data.cylinderCo2 || '',
        cylinderN2: data.cylinderN2 || '',
        cylinderHydroTestDate: data.cylinderDataTeste || '',
        packType: data.packType || '',
        hruReference: data.hruReferencia || '',
        hruExpiry: data.hruValidade || '',
        radarReflector: data.radarReflector || '',
        radarReflectorExpiry: data.radarReflectorValidade || '',
        technician: lastInspecao?.responsavel || 'Técnico Autorizado',
        status: lastInspecao?.status || 'Concluída',
        checklist: buildChecklistPayload()
      };

      const res = await fetch('/api/certificados/orey?format=xlsx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao gerar o ficheiro excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Filename: [certNumber]_[raftSerial]_[shipName].xlsx
      a.download = `${payload.certNumber}_${payload.raftSerial}_${payload.shipName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao exportar certificado: ' + error.message);
    }
  };

  const handleExportQuadroExcel = async () => {
    try {
      const payload = {
        numeroObra: data.numeroObra || '',
        certNumber: lastInspecao?.certificadoNumero || data.ultimoCertificadoNumero || '',
        inspectionDate: lastInspecao?.dataInspecao || data.dataInspecao || '',
        nextInspectionDate: lastInspecao?.dataProxInspecao || data.dataProxInspecao || '',
        shipName: data.shipNameManual || linkedShip?.nome || '',
        brand: data.brand || '',
        raftModel: data.model || '',
        raftCapacity: data.capacity || '',
        raftSerial: data.serial || '',
        manufactureDate: data.dataFabrico || '',
        cylinderSerial: data.cylinderSerial || '',
        cylinderGrossWeight: data.cylinderPesoBruto || '',
        cylinderTara: data.cylinderTara || '',
        cylinderTare: data.cylinderTara || '',
        cylinderCo2: data.cylinderCo2 || '',
        cylinderN2: data.cylinderN2 || '',
        cylinderHydroTestDate: data.cylinderDataTeste || '',
        packType: data.packType || '',
        pressureUnit: data.testeWPUnidadePressao || 'inh2o',
        tempInitial: data.testeWPTemperaturaInicial || '',
        tempFinal: data.testeWPTemperaturaFinal || '',
        baroInitial: data.testeWPPressaoAtmosfericaInicial || '',
        baroFinal: data.testeWPPressaoAtmosfericaFinal || '',
        wpStartTime: data.testeWPHoraInicio || '',
        wpEndTime: data.testeWPHoraFim || '',
        wpUpperStart: data.testeWPCamaraSuperiorInicio || '',
        wpUpperEnd: data.testeWPCamaraSuperiorFim || '',
        wpUpperCorrected: '',
        wpUpperDrop: '',
        wpUpperDropPercent: data.testeWPCamaraSuperiorQueda || '',
        wpLowerStart: data.testeWPCamaraInferiorInicio || '',
        wpLowerEnd: data.testeWPCamaraInferiorFim || '',
        wpLowerCorrected: '',
        wpLowerDrop: '',
        wpLowerDropPercent: data.testeWPCamaraInferiorQueda || '',
        napTestDone: data.testeNAP || '',
        fsTestDone: data.testeFS || '',
        giTestDone: data.testeGI || '',
        dlTestDone: data.testeDL || '',
        checklist: buildChecklistPayload()
      };

      const res = await fetch('/api/exportar-raft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Falha ao gerar o ficheiro excel');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Filename: [raftSerial] [raftModel] [capacity]P (MM YYYY).xlsx
      const nextDate = new Date(payload.nextInspectionDate);
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const year = nextDate.getFullYear();
      const monthYear = `${month} ${year}`;
      a.download = `${payload.raftSerial} ${payload.raftModel} ${payload.raftCapacity}P (${monthYear}).xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert('Erro ao exportar quadro: ' + error.message);
    }
  };

  const handleAddArtigo = async () => {
    if (!newArtigo.name) {
      alert('Por favor insira o nome do artigo.');
      return;
    }
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}/artigos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtigo),
      });
      if (!response.ok) throw new Error('Erro ao adicionar artigo');
      const added = await response.json();
      setArtigos((prev) => [...prev, added]);
      setNewArtigo({ name: '', quantidade: 1, validade: '', referencia: '', codigoFabricante: '' });
      setIsAddingArtigo(false);
      fetchJangadaData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteArtigo = async (artigoId: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este artigo da jangada?')) return;
    try {
      const response = await fetch(`/api/jangadas/${jangadaId}/artigos/${artigoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao apagar artigo');
      setArtigos((prev) => prev.filter((a) => a.id !== artigoId));
      fetchJangadaData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveInspecao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingInspecao 
        ? `/api/inspecoes?id=${editingInspecao.id}` 
        : `/api/inspecoes`;
      const method = editingInspecao ? 'PUT' : 'POST';
      const body = {
        ...inspecaoForm,
        jangadaId: Number(jangadaId),
        jangadaSerial: data.serial,
        applyStockMovements: false,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Falha ao guardar inspeção');
      
      setIsAddingInspecao(false);
      setEditingInspecao(null);
      fetchJangadaData();
    } catch (err: any) {
      alert('Erro ao guardar inspeção: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInspecao = async (id: number) => {
    if (!window.confirm('Tem a certeza que deseja eliminar esta inspeção?')) return;
    try {
      const res = await fetch(`/api/inspecoes?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao eliminar');
      fetchJangadaData();
    } catch (err: any) {
      alert('Erro ao eliminar inspeção: ' + err.message);
    }
  };

  const formatMonthYear = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${yyyy}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-PT');
  };

  const toMonthInputFormat = (dateStr?: string | null) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
    const mmYyyy = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
    if (mmYyyy) {
      return `${mmYyyy[2]}-${mmYyyy[1].padStart(2, '0')}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  };

  const isExpired = (expiryStr?: string | null) => {
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    if (isNaN(expiry.getTime())) return false;
    return expiry < new Date();
  };

  const getInspectionStatus = (dateStr?: string | null): {
    label: string;
    color: 'green' | 'yellow' | 'orange' | 'red' | 'gray';
    daysLeft: number | null;
  } => {
    if (!dateStr) return { label: 'Sem data', color: 'gray', daysLeft: null };
    const expiry = new Date(dateStr);
    if (isNaN(expiry.getTime())) return { label: 'Sem data', color: 'gray', daysLeft: null };
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expirada', color: 'red', daysLeft };
    if (daysLeft <= 30) return { label: `${daysLeft}d`, color: 'orange', daysLeft };
    if (daysLeft <= 60) return { label: `${daysLeft}d`, color: 'yellow', daysLeft };
    return { label: 'OK', color: 'green', daysLeft };
  };

  const inspectionStatus = getInspectionStatus(data.dataProxInspecao);

  const statusStyles = {
    green:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', banner: null },
    yellow: { dot: 'bg-yellow-400',  badge: 'bg-yellow-50 border-yellow-200 text-yellow-700',   banner: 'bg-yellow-50 border-yellow-200' },
    orange: { dot: 'bg-orange-500',  badge: 'bg-orange-50 border-orange-200 text-orange-700',   banner: 'bg-orange-50 border-orange-200' },
    red:    { dot: 'bg-red-500',     badge: 'bg-red-50 border-red-200 text-red-700',            banner: 'bg-red-50 border-red-200' },
    gray:   { dot: 'bg-slate-300',   badge: 'bg-slate-50 border-slate-200 text-slate-500',      banner: null },
  };

  const getComplianceSummary = () => {
    const items = data.mandatoryPackItems || [];
    const total = items.length;
    let complete = 0;
    let incomplete = 0;
    let missing = 0;
    let expired = 0;

    for (const item of items) {
      const matched = findMatchingArticleForPackItem(item, artigos || []) as any;
      if (!matched) {
        missing++;
      } else {
        const presentQty = Number(matched.quantidade || 0);
        if (presentQty < item.quantity) {
          incomplete++;
        } else {
          complete++;
        }
        
        if (isExpired(matched.validade)) {
          expired++;
        }
      }
    }

    const percent = total > 0 ? Math.round((complete / total) * 100) : 0;
    return { total, complete, incomplete, missing, expired, percent };
  };

  // If in inspect mode, render the multi-step wizard
  if (isInspecting) {
    return (
      <div className="min-h-screen bg-slate-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Inspeção da Jangada</h1>
              <p className="text-sm text-slate-500 mt-1">Série: <span className="font-semibold text-slate-700">{data.serial}</span> · Modelo: <span className="font-semibold text-slate-700">{data.brand} {data.model}</span></p>
            </div>
            <button 
              onClick={() => {
                if (confirm('Deseja interromper a inspeção? O rascunho atual será preservado.')) {
                  setIsInspecting(false);
                }
              }}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition-all text-sm"
            >
              Sair da Inspeção
            </button>
          </div>
          <JangadaWizardLoader jangadaId={jangadaId}>
            <WizardRouter />
          </JangadaWizardLoader>
        </div>
      </div>
    );
  }

  const linkedShip = ships.find((s) => s.id === data.shipId);
  const lastInspecao = data.inspecoes && data.inspecoes.length > 0
    ? [...data.inspecoes].sort((a: any, b: any) => new Date(b.dataInspecao).getTime() - new Date(a.dataInspecao).getTime())[0]
    : null;

  const exportPdf = () => {
    const element = document.querySelector('.print-dossier-page') as HTMLElement;
    const opt = {
      margin: [5, 8],
      filename: `dossier-${jangadaId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };
    // @ts-ignore - html2pdf is loaded via import
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/30 to-white py-8 print:bg-white print:py-0 ${
      printMode === 'checklist' ? 'print-checklist-only' : 'print-dossier-only'
    }`}>
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 5mm 8mm;
          }
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, button, nav, .no-print, [role="tablist"] {
            display: none !important;
          }
          .print-dossier-only .screen-container-dossier {
            display: none !important;
          }
          .print-dossier-only .print-dossier-page {
            display: block !important;
          }
          .print-checklist-only .screen-container-dossier {
            display: block !important;
          }
          .print-checklist-only .print-dossier-page {
            display: none !important;
          }
          .max-w-7xl {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .shadow-sm, .shadow-md, .shadow-lg {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
          }
          .bg-white {
            background-color: white !important;
          }

          /* Print-Only Compact Dossier styling overrides */
          .print-dossier-page {
            display: block !important;
            font-family: system-ui, -apple-system, sans-serif !important;
            font-size: 9px !important;
            line-height: 1.2 !important;
            max-height: 198mm !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            color: #000000 !important;
          }
          .print-dossier-page h1 {
            font-size: 12px !important;
            font-weight: 850 !important;
            color: #000000 !important;
            margin: 0 !important;
            text-transform: uppercase !important;
            line-height: 1.2 !important;
          }
          .print-dossier-page h2 {
            font-size: 9px !important;
            font-weight: 700 !important;
            color: #000000 !important;
            margin: 0 !important;
          }
          .print-dossier-page .grid-cols-2 {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 5px !important;
          }
          .print-dossier-page .grid-cols-3 {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 5px !important;
          }
          .print-dossier-page .grid-cols-4 {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 4px !important;
          }
          .print-dossier-page table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          .print-dossier-page th, .print-dossier-page td {
            padding: 1px 1.5px !important;
            font-size: 7px !important;
            vertical-align: middle !important;
            word-wrap: break-word !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .print-dossier-page td span {
            font-size: 7px !important;
          }
          .print-dossier-page .flex-row-print {
            display: flex !important;
          }
          /* New header/footer styles */
          .print-header, .print-footer {
            display: block !important;
            width: 100%;
            text-align: center;
            font-family: Georgia, serif;
            color: #000;
          }
          .print-header { border-bottom: 1px solid #000; margin-bottom: 2mm; }
          .print-footer { border-top: 1px solid #000; margin-top: 2mm; }
          .print-footer .page-number::after { content: counter(page); }
          .print-dossier-page .flex-row-print {
            display: flex !important;
            justify-content: space-between !important;
            gap: 6px !important;
          }
          .print-dossier-page .col-print {
            width: 32.5% !important;
          }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500 screen-container-dossier">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white rounded-2xl p-4 shadow-md shadow-indigo-600/10">
              <Anchor size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">Dossier Técnico da Jangada</span>
                <span className="text-xs font-semibold text-slate-400">ID: #{jangadaId}</span>
                {/* Semáforo de Estado */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${statusStyles[inspectionStatus.color].badge}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyles[inspectionStatus.color].dot} animate-${inspectionStatus.color === 'red' ? 'pulse' : 'none'}`} />
                  {inspectionStatus.color === 'gray' ? 'Sem inspecção' :
                   inspectionStatus.color === 'red' ? 'GI Expirada' :
                   inspectionStatus.color === 'orange' ? `GI em ${inspectionStatus.daysLeft}d` :
                   inspectionStatus.color === 'yellow' ? `GI em ${inspectionStatus.daysLeft}d` :
                   'GI em dia'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1">
                {data.brand || 'EUROVINIL'} {data.model || 'COMPACT DRY'}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">Nº de Série: <span className="font-mono font-bold text-slate-700">{data.serial}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 no-print">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'A guardar...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setEditForm({ ...data });
                    setIsEditing(false);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setPrintMode('dossier');
                    setTimeout(() => { window.print(); }, 50);
                  }}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileText size={18} />
                  Imprimir Dossier
                </button>
                <button
                  onClick={exportPdf}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={18} className="text-indigo-600" />
                  Exportar PDF
                </button>
                <button
                  onClick={handleExportCertificadoExcel}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  Gerar Certificado Excel
                </button>
                <button
                  onClick={handleExportQuadroExcel}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={18} className="text-blue-600" />
                  Gerar Quadro Excel
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Edit3 size={18} />
                  Editar Ficha
                </button>
                <button
                  onClick={() => setIsInspecting(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 hover:scale-105"
                >
                  <Play size={18} fill="currentColor" />
                  Inspecionar
                </button>
                {currentUrl && (
                  <div className="hidden md:flex flex-col items-center gap-0.5 border-l border-slate-150 pl-3 shrink-0">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(currentUrl)}`} 
                      alt="QR Code" 
                      className="w-10 h-10 p-0.5 border border-slate-200 rounded bg-white shadow-sm"
                    />
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">QR Ficha</span>
                  </div>
                )}
              </>
            )}
          </div>
        </header>

        {/* Banner de alerta de validade da inspecção */}
        {(inspectionStatus.color === 'red' || inspectionStatus.color === 'orange' || inspectionStatus.color === 'yellow') && (
          <div className={`${statusStyles[inspectionStatus.color].banner} border rounded-3xl p-5 flex items-center gap-4 no-print shadow-sm`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              inspectionStatus.color === 'red' ? 'bg-red-100 text-red-600' :
              inspectionStatus.color === 'orange' ? 'bg-orange-100 text-orange-600' :
              'bg-yellow-100 text-yellow-600'
            }`}>
              <AlertCircle size={24} />
            </div>
            <div>
              <p className={`font-extrabold text-base ${
                inspectionStatus.color === 'red' ? 'text-red-900' :
                inspectionStatus.color === 'orange' ? 'text-orange-900' :
                'text-yellow-900'
              }`}>
                {inspectionStatus.color === 'red'
                  ? '⛔ Inspecção expirada'
                  : inspectionStatus.color === 'orange'
                  ? '🔶 Inspecção urgente'
                  : '⚠️ Inspecção próxima'}
              </p>
              <p className={`text-sm mt-0.5 ${
                inspectionStatus.color === 'red' ? 'text-red-700' :
                inspectionStatus.color === 'orange' ? 'text-orange-700' :
                'text-yellow-700'
              }`}>
                {inspectionStatus.color === 'red'
                  ? `A próxima inspecção estava prevista para ${formatDate(data.dataProxInspecao)} — há ${Math.abs(inspectionStatus.daysLeft!)} dias.`
                  : `A próxima inspecção é a ${formatDate(data.dataProxInspecao)} — faltam ${inspectionStatus.daysLeft} dias.`}
              </p>
            </div>
          </div>
        )}

        {offlineDraftsCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <p className="font-extrabold text-amber-900 text-base">Rascunhos Offline Detetados</p>
                <p className="text-sm text-amber-700 mt-0.5">Tem {offlineDraftsCount} inspeção(ões) pendente(s) salvas no dispositivo. Sincronize com o servidor.</p>
              </div>
            </div>
            <button 
              onClick={syncOfflineDrafts}
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-6 py-3.5 rounded-xl text-sm shadow-md shadow-amber-600/10 transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "A Sincronizar..." : "Sincronizar Rascunhos"}
            </button>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 w-full sm:w-max no-print">
          <button
            onClick={() => setActiveTab('dados')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === 'dados' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={16} />
            Ficha Técnica
          </button>
          <button
            onClick={() => setActiveTab('artigos')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === 'artigos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package size={16} />
            Artigos ({artigos.length})
          </button>
          <button
            onClick={() => setActiveTab('pack')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === 'pack' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield size={16} />
            Pack de Emergência
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === 'historico' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <History size={16} />
            Histórico
          </button>
          <button
            onClick={() => setActiveTab('testeWP')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all w-full sm:w-auto justify-center ${
              activeTab === 'testeWP' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gauge size={16} />
            Testes
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Bloco 1: Identificação Geral */}
            <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                <ClipboardList className="text-indigo-600" />
                Características Gerais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marca</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.brand || ''}
                      onChange={(e) => handleEditChange('brand', e.target.value)}
                    >
                      <option value="">Selecione a marca</option>
                      {Array.from(new Set(catalogOptions.map(o => o.marca))).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800">{data.brand || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Modelo</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.model || ''}
                      onChange={(e) => handleEditChange('model', e.target.value)}
                    >
                      <option value="">Selecione o modelo</option>
                      {catalogOptions
                        .filter((o) => o.marca === (editForm.brand || data.brand))
                        .map((o) => o.modelo)
                        .filter((v, i, arr) => arr.indexOf(v) === i)
                        .map((model) => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800">{data.model || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nº de Série</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.serial || ''} 
                      onChange={(e) => handleEditChange('serial', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.serial || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Capacidade (Pessoas)</span>
                  {isEditing ? (
                    <input 
                      type="number"
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.capacity ?? ''} 
                      onChange={(e) => handleEditChange('capacity', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.capacity ?? '—'} P</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Pack</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.packType || ''}
                      onChange={(e) => handleEditChange('packType', e.target.value)}
                    >
                      <option value="">Selecione o tipo de pack</option>
                      {availablePackTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800">{data.packType || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Tecido</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.fabricType || ''} 
                      onChange={(e) => handleEditChange('fabricType', e.target.value)}
                    >
                      <option value="">Desconhecido</option>
                      <option value="PU">PU (Poliuretano)</option>
                      <option value="NR">NR (Borracha Natural)</option>
                      <option value="PVC">PVC</option>
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800">{data.fabricType || 'Desconhecido'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tipo de Lançamento</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.launchType || ''} 
                      onChange={(e) => handleEditChange('launchType', e.target.value)}
                    >
                      <option value="">Desconhecido</option>
                      <option value="Throw-Over">Throw-Over</option>
                      <option value="Davit-Launched">Davit-Launched</option>
                    </select>
                  ) : (
                    <p className="font-semibold text-slate-800">{data.launchType || 'Desconhecido'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Comprimento da Retenida (m)</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.painterLength || ''} 
                      onChange={(e) => handleEditChange('painterLength', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.painterLength || '—'} m</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Altura Máxima Lançamento (m)</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.maxStowageHeight || ''} 
                      onChange={(e) => handleEditChange('maxStowageHeight', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.maxStowageHeight || '—'} m</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Proprietário / Armador</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.owner || ''} 
                      onChange={(e) => handleEditChange('owner', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.ownerDisplay || data.owner || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Data de Fabrico</span>
                  {isEditing ? (
                    <input 
                      type="month"
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={toMonthInputFormat(editForm.dataFabrico)} 
                      onChange={(e) => handleEditChange('dataFabrico', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{formatMonthYear(data.dataFabrico)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Embarcação Associada</span>
                  {isEditing ? (
                    <select
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.shipId || ''} 
                      onChange={(e) => handleEditChange('shipId', e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Sem Navio Associado</option>
                      {ships.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome} ({s.matricula})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-700">
                      <Ship size={16} />
                      <span>{linkedShip ? `${linkedShip.nome} (${linkedShip.matricula})` : 'Nenhum navio associado'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Modelo do Container</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.containerModel || ''} 
                      onChange={(e) => handleEditChange('containerModel', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.containerModel || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Último Certificado Nº</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.ultimoCertificadoNumero || ''} 
                      onChange={(e) => handleEditChange('ultimoCertificadoNumero', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.ultimoCertificadoNumero || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Último Teste WP</span>
                  {isEditing ? (
                    <input 
                      type="month"
                      className="w-full border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-sm"
                      value={editForm.testeWP || ''} 
                      onChange={(e) => handleEditChange('testeWP', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{formatDate(data.testeWP)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco 2: Cilindro de Insuflação */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Cylinder className="text-indigo-600" />
                Cilindro de Gás
              </h2>

              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nº de Série Cilindro</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.cylinderSerial || ''} 
                      onChange={(e) => handleCylinderChange('cylinderSerial', e.target.value)} 
                    />
                  ) : (
                    <p className="font-bold text-slate-700 font-mono">{data.cylinderSerial || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sistema Insuflação</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.cylinderSistema || ''} 
                      onChange={(e) => handleCylinderChange('cylinderSistema', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.cylinderSistema || '—'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Peso Bruto (kg)</span>
                    {isEditing ? (
                      <input 
                        type="number" step="0.001"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderPesoBruto || ''} 
                        onChange={(e) => handleCylinderChange('cylinderPesoBruto', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{data.cylinderPesoBruto ? `${data.cylinderPesoBruto} kg` : '—'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tara (kg)</span>
                    {isEditing ? (
                      <input 
                        type="number" step="0.001"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderTara || ''} 
                        onChange={(e) => handleCylinderChange('cylinderTara', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{data.cylinderTara ? `${data.cylinderTara} kg` : '—'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gás CO2 (kg)</span>
                    {isEditing ? (
                      <input 
                        type="number" step="0.001"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderCo2 || ''} 
                        onChange={(e) => handleCylinderChange('cylinderCo2', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{data.cylinderCo2 ? `${data.cylinderCo2} kg` : '—'}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gás N2 (kg)</span>
                    {isEditing ? (
                      <input 
                        type="number" step="0.001"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderN2 || ''} 
                        onChange={(e) => handleCylinderChange('cylinderN2', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{data.cylinderN2 ? `${data.cylinderN2} kg` : '—'}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Último Teste Hid.</span>
                    {isEditing ? (
                      <input 
                        type="month"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderDataTeste || ''} 
                        onChange={(e) => handleCylinderChange('cylinderDataTeste', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{formatDate(data.cylinderDataTeste)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Próx. Teste Hid.</span>
                    {isEditing ? (
                      <input 
                        type="month"
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.cylinderDataProxTeste || ''} 
                        onChange={(e) => handleCylinderChange('cylinderDataProxTeste', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{formatDate(data.cylinderDataProxTeste)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: HRU & Radar Reflector */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                <FileCheck className="text-indigo-600" />
                HRU & Refletor Radar
              </h2>

              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Referência HRU</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.hruReferencia || ''} 
                      onChange={(e) => handleEditChange('hruReferencia', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.hruReferencia || 'Não aplicável / Não instalado'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Data de Instalação do HRU</span>
                  {isEditing ? (
                    <input 
                      type="date"
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.hruDataInstalacao || ''} 
                      onChange={(e) => handleEditChange('hruDataInstalacao', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{formatDate(data.hruDataInstalacao)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Validade do HRU (Auto: 2 Anos)</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {formatDate(isEditing ? editForm.hruValidade : data.hruValidade)}
                    </span>
                    {isExpired(isEditing ? editForm.hruValidade : data.hruValidade) && (
                      <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Expirado</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Refletor Radar</span>
                    {isEditing ? (
                      <input 
                        className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                        value={editForm.radarReflector || ''} 
                        onChange={(e) => handleEditChange('radarReflector', e.target.value)} 
                      />
                    ) : (
                      <p className="font-semibold text-slate-800">{data.radarReflector || 'Não instalado'}</p>
                    )}
                  </div>


                </div>
              </div>
            </div>

            {/* Bloco 4: Estado Geral do Próximo Serviço */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Próximo Serviço Operacional</h3>
                
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Última Inspeção</p>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                        value={editForm.dataInspecao || ''} 
                        onChange={(e) => handleEditChange('dataInspecao', e.target.value)} 
                      />
                    ) : (
                      <p className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        {formatDate(data.dataInspecao)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Validade / Próxima Inspeção</p>
                    {isEditing ? (
                      <input 
                        type="date"
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                        value={editForm.dataProxInspecao || ''} 
                        onChange={(e) => handleEditChange('dataProxInspecao', e.target.value)} 
                      />
                    ) : (
                      <>
                        <p className={`text-lg font-bold flex items-center gap-2 ${isExpired(data.dataProxInspecao) ? "text-red-600" : "text-slate-800"}`}>
                          <Calendar size={18} className={isExpired(data.dataProxInspecao) ? "text-red-500" : "text-slate-400"} />
                          {formatDate(data.dataProxInspecao)}
                        </p>
                        {isExpired(data.dataProxInspecao) && (
                          <span className="mt-1 inline-block bg-red-100 border border-red-200 text-red-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">Serviço Expirado</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-6">
                <button
                  onClick={() => setIsInspecting(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Play size={16} fill="currentColor" />
                  Iniciar Nova Inspeção
                </button>
              </div>
            </div>

            {/* Bloco 5: Válvulas & Disparo */}
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Wrench className="text-indigo-600" />
                Válvulas & Disparo
              </h2>

              <div className="space-y-5">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ref. Cabeça Disparo</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.cylinderCabecaDisparoRef || ''} 
                      onChange={(e) => handleEditChange('cylinderCabecaDisparoRef', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.cylinderCabecaDisparoRef || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ref. Tubo Câmara Sup.</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.cylinderTuboCamaraSuperiorRef || ''} 
                      onChange={(e) => handleEditChange('cylinderTuboCamaraSuperiorRef', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.cylinderTuboCamaraSuperiorRef || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ref. Tubo Câmara Inf.</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.cylinderTuboCamaraInferiorRef || ''} 
                      onChange={(e) => handleEditChange('cylinderTuboCamaraInferiorRef', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.cylinderTuboCamaraInferiorRef || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Válvulas de Alívio</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.valvulasAlivio || ''} 
                      onChange={(e) => handleEditChange('valvulasAlivio', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.valvulasAlivio || '—'}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Válvulas de Atestar</span>
                  {isEditing ? (
                    <input 
                      className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm"
                      value={editForm.valvulasAtestar || ''} 
                      onChange={(e) => handleEditChange('valvulasAtestar', e.target.value)} 
                    />
                  ) : (
                    <p className="font-semibold text-slate-800">{data.valvulasAtestar || '—'}</p>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'artigos' && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="text-indigo-600" />
                Artigos e Componentes da Jangada
              </h2>
              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={async () => {
                    if (!confirm('Deseja sincronizar os artigos com o template do pack? Isto adicionará artigos obrigatórios em falta e atualizará quantidades.')) return;
                    try {
                      const res = await fetch(`/api/jangadas/${jangadaId}/sync-pack`, { method: 'POST' });
                      if (!res.ok) throw new Error('Falha ao sincronizar');
                      const json = await res.json();
                      alert(`Sincronização concluída!\nAdicionados: ${json.summary?.added || 0}\nAtualizados: ${json.summary?.updated || 0}`);
                      fetchJangadaData();
                    } catch (err: any) {
                      alert('Erro na sincronização: ' + err.message);
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
                >
                  🔄 Sincronizar com Pack
                </button>
                <button
                  onClick={() => setIsAddingArtigo(!isAddingArtigo)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm"
                >
                  {isAddingArtigo ? <X size={14} /> : <Plus size={14} />}
                  {isAddingArtigo ? 'Cancelar' : 'Adicionar Artigo'}
                </button>
              </div>
            </div>

            {/* Adicionar Artigo Form */}
            {isAddingArtigo && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Artigo *</label>
                  <input
                    placeholder="Nome"
                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    value={newArtigo.name || ''}
                    onChange={(e) => setNewArtigo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Referência</label>
                  <input
                    placeholder="Ex: 2070100"
                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    value={newArtigo.referencia || ''}
                    onChange={(e) => setNewArtigo(prev => ({ ...prev, referencia: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Fabricante Cód.</label>
                  <input
                    placeholder="Ex: EV-99"
                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    value={newArtigo.codigoFabricante || ''}
                    onChange={(e) => setNewArtigo(prev => ({ ...prev, codigoFabricante: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Qtd</label>
                  <input
                    type="number"
                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    value={newArtigo.quantidade || 1}
                    onChange={(e) => setNewArtigo(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Validade</label>
                  <input
                    type="month"
                    className="w-full border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                    value={newArtigo.validade || ''}
                    onChange={(e) => setNewArtigo(prev => ({ ...prev, validade: e.target.value }))}
                  />
                </div>
                <div className="col-span-full flex justify-end gap-2 mt-2">
                  <button
                    onClick={handleAddArtigo}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 shadow-sm"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            {artigos.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-350">
                <Package className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">Não há artigos ou consumíveis inventariados para esta jangada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm">
                <table className="w-full text-left border-collapse bg-white">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4">Artigo / Equipamento</th>
                      <th className="px-6 py-4">Referência</th>
                      <th className="px-6 py-4">Fabricante Cód.</th>
                      <th className="px-6 py-4 text-center">Quantidade</th>
                      <th className="px-6 py-4">Validade</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {artigos.map((artigo) => (
                      <tr key={artigo.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{artigo.name}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{artigo.referencia || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{artigo.codigoFabricante || '—'}</td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">{artigo.quantidade}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatDate(artigo.validade)}</span>
                            {isExpired(artigo.validade) && (
                              <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Expirado</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <EditarArtigoDialog
                            jangadaId={jangadaId}
                            artigo={{
                              id: artigo.id,
                              name: artigo.name,
                              quantidade: artigo.quantidade,
                              referencia: artigo.referencia,
                              validade: artigo.validade,
                              codigoFabricante: artigo.codigoFabricante,
                            }}
                            onSuccess={fetchJangadaData}
                          />
                          {artigo.referencia && (
                            <SubstituirArtigoDialog
                              jangadaId={jangadaId}
                              artigo={{
                                id: artigo.id,
                                name: artigo.name,
                                quantidade: artigo.quantidade,
                                referencia: artigo.referencia,
                              }}
                              onSuccess={fetchJangadaData}
                            />
                          )}
                          <button
                            onClick={() => handleDeleteArtigo(artigo.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar Artigo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pack' && (() => {
          // Group mandatory pack items by category
          const items = data.mandatoryPackItems || [];
          const groupedPackItems: Record<string, typeof items> = {};
          for (const item of items) {
            const cat = item.category || 'Outros';
            if (!groupedPackItems[cat]) groupedPackItems[cat] = [];
            groupedPackItems[cat].push(item);
          }

          return (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 shadow-sm space-y-8">
              <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Shield className="text-indigo-600" />
                    Pack de Emergência ({data.packType || 'Desconhecido'})
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Definição de artigos obrigatórios obtida via:{' '}
                    <span className="font-semibold text-slate-700">
                      {data.mandatoryPackSource === 'technical'
                        ? 'Ficha Técnica do Modelo'
                        : 'Template Padrão do Tipo de Pack'}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={async () => {
                      if (!confirm('Deseja sincronizar os artigos com o template do pack? Isto adicionará artigos obrigatórios em falta e atualizará quantidades.')) return;
                      try {
                        const res = await fetch(`/api/jangadas/${jangadaId}/sync-pack`, { method: 'POST' });
                        if (!res.ok) throw new Error('Falha ao sincronizar');
                        const json = await res.json();
                        alert(`Sincronização concluída!\nAdicionados: ${json.summary?.added || 0}\nAtualizados: ${json.summary?.updated || 0}`);
                        fetchJangadaData();
                      } catch (err: any) {
                        alert('Erro na sincronização: ' + err.message);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-250"
                  >
                    🔄 Sincronizar com Pack
                  </button>
                  <button
                    onClick={() => {
                      setPrintMode('checklist');
                      setTimeout(() => {
                        window.print();
                      }, 50);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all text-xs shadow-sm"
                  >
                    <FileText size={14} />
                    Imprimir Checklist do Pack
                  </button>
                </div>
              </div>

              {Object.keys(groupedPackItems).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-350">
                  <Shield className="mx-auto text-slate-300 mb-3" size={48} />
                  <p className="text-slate-500 font-medium">
                    Não existem requisitos de pack de emergência configurados para este modelo ou tipo de pack.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedPackItems).map(([category, catItems]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm">
                        <table className="w-full text-left border-collapse bg-white">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                              <th className="px-6 py-4">Requisito do Pack</th>
                              <th className="px-6 py-4">Artigo Associado (Jangada)</th>
                              <th className="px-6 py-4">Referência</th>
                              <th className="px-6 py-4 text-center">Qtd Req.</th>
                              <th className="px-6 py-4 text-center">Qtd Reg.</th>
                              <th className="px-6 py-4 text-center">Estado</th>
                              <th className="px-6 py-4">Validade</th>
                              <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {catItems.map((item: any) => {
                              const matched = findMatchingArticleForPackItem(item, artigos) as any;
                              const isPresent = !!matched;
                              const presentQty = matched ? Number(matched.quantidade || 0) : 0;
                              const isComplete = isPresent && presentQty >= item.quantity;

                              let statusBadge = (
                                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                  Em Falta
                                </span>
                              );
                              if (isPresent) {
                                if (isComplete) {
                                  statusBadge = (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Completo
                                    </span>
                                  );
                                } else {
                                  statusBadge = (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Incompleto
                                    </span>
                                  );
                                }
                              }

                              return (
                                <tr key={item.label} className="hover:bg-slate-50/55 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800">{item.label}</div>
                                    {item.englishLabel && (
                                      <div className="text-xs text-slate-400 italic">
                                        {item.englishLabel}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-slate-700">
                                    {matched ? matched.name : <span className="text-red-500 italic font-medium">Nenhum</span>}
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                    {matched?.referencia || '—'}
                                  </td>
                                  <td className="px-6 py-4 text-center font-semibold text-slate-500">
                                    {item.quantity}
                                  </td>
                                  <td className="px-6 py-4 text-center font-bold text-slate-700">
                                    {presentQty}
                                  </td>
                                  <td className="px-6 py-4 text-center">{statusBadge}</td>
                                  <td className="px-6 py-4">
                                    {matched?.validade ? (
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                          {formatDate(matched.validade)}
                                        </span>
                                        {isExpired(matched.validade) && (
                                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                            Expirado
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <EditarArtigoDialog
                                      jangadaId={jangadaId}
                                      artigo={{
                                        id: matched ? Number(matched.id || 0) : 0,
                                        name: matched ? (matched.name || '') : item.label,
                                        quantidade: matched ? Number(matched.quantidade || 0) : item.quantity,
                                        referencia: matched ? (matched.referencia || null) : null,
                                        validade: matched ? (matched.validade || null) : null,
                                        codigoFabricante: matched ? (matched.codigoFabricante || null) : null,
                                      }}
                                      onSuccess={fetchJangadaData}
                                    />
                                    {matched && matched.referencia ? (
                                      <SubstituirArtigoDialog
                                        jangadaId={jangadaId}
                                        artigo={{
                                          id: Number(matched.id || 0),
                                          name: matched.name || '',
                                          quantidade: Number(matched.quantidade || 0),
                                          referencia: matched.referencia || '',
                                        }}
                                        onSuccess={fetchJangadaData}
                                      />
                                    ) : (
                                      !matched && <span className="text-slate-400 text-xs italic">Não associado</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'historico' && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-4 border-b border-slate-100">
              <History className="text-indigo-600" />
              Histórico Técnico de Inspeções
            </h2>

            {(!(data.inspecoes || initialData.inspecoes) || (data.inspecoes || initialData.inspecoes).length === 0) ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-350">
                <History className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500 font-medium">Ainda não há registos históricos de inspeção ou rascunhos para esta jangada.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(data.inspecoes || initialData.inspecoes).map((insp: any) => (
                  <div 
                    key={insp.id} 
                    className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col items-center justify-center min-w-[100px] text-center">
                        <Calendar className="text-indigo-600 mb-1" size={20} />
                        <span className="text-xs font-bold text-indigo-950">{formatDate(insp.dataInspecao)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">
                          Certificado nº: {insp.certificadoNumero || 'Draft / Não emitido'}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span>Responsável: <strong>{insp.responsavel || 'Operador'}</strong></span>
                          <span>•</span>
                          <span>Próxima Inspeção: <strong>{formatDate(insp.dataProxInspecao)}</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        insp.status === 'Concluída' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : insp.status === 'Draft'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {insp.status || 'Pendente'}
                      </span>
                      <button
                        onClick={() => setSelectedInspecao(insp)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-150 transition-all no-print"
                      >
                        📄 Detalhes
                      </button>
                      <pre className="bg-slate-100 p-2 rounded mt-2 text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(insp, null, 2)}</pre>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'testeWP' && (() => {
          const wpSource = isEditing ? editForm : data;
          const wpDerived = buildWpDerivedValues({
            pressureUnit: wpSource.testeWPUnidadePressao,
            startTime: wpSource.testeWPHoraInicio,
            tempInitial: wpSource.testeWPTemperaturaInicial,
            tempFinal: wpSource.testeWPTemperaturaFinal,
            baroInitial: wpSource.testeWPPressaoAtmosfericaInicial,
            baroFinal: wpSource.testeWPPressaoAtmosfericaFinal,
            upperStart: wpSource.testeWPCamaraSuperiorInicio,
            upperEnd: wpSource.testeWPCamaraSuperiorFim,
            lowerStart: wpSource.testeWPCamaraInferiorInicio,
            lowerEnd: wpSource.testeWPCamaraInferiorFim,
          });

          const isTestPassed = 
            wpDerived.upper.passes !== false && 
            wpDerived.lower.passes !== false && 
            (wpDerived.upper.passes !== null || wpDerived.lower.passes !== null);

          const isTestDefined = 
            wpSource.testeWP || 
            wpSource.testeWPHoraInicio || 
            wpSource.testeWPCamaraSuperiorInicio || 
            wpSource.testeWPCamaraInferiorInicio;

          return (
            <div className="bg-white rounded-3xl border border-slate-200/60 p-6 lg:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Gauge className="text-indigo-600" />
                  Registo do Teste de Pressão de Trabalho (WP)
                </h2>
                {isEditing && (
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full animate-pulse">
                    Modo de Edição Ativo
                  </span>
                )}
              </div>

              {/* Status Banner */}
              {isTestDefined ? (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                  isTestPassed 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className={`rounded-xl p-2.5 ${isTestPassed ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
                    <Gauge size={24} className={isTestPassed ? 'text-emerald-700' : 'text-rose-700'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      Resultado Geral: {isTestPassed ? 'APROVADO' : 'REPROVADO / NÃO EM CONFORMIDADE'}
                    </h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      {isTestPassed 
                        ? 'O ensaio cumpre as especificações do manual: queda de pressão ≤ 5% e variação térmica ΔT ≤ 3.5°C.'
                        : 'A queda de pressão excedeu o limite máximo de 5% em pelo menos uma câmara ou a variação térmica de temperatura foi superior a 3.5°C.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 flex items-center gap-4">
                  <div className="rounded-xl p-2.5 bg-amber-500/15">
                    <AlertCircle size={24} className="text-amber-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Sem registo completo</h3>
                    <p className="text-xs opacity-90 mt-0.5">
                      Não existem dados completos registados para o último ensaio WP. Use o botão &quot;Editar&quot; no topo da página para registar as leituras.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Coluna Esquerda: Condições WP e Outros Testes */}
                <div className="space-y-6">
                  {/* Condições do Ensaio */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                      <ClipboardList size={16} className="text-indigo-500" />
                      Condições Gerais do Ensaio
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Data do Teste (Mês/Ano)</span>
                        {isEditing ? (
                          <input
                            type="month"
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWP || ''}
                            onChange={(e) => handleWpFieldChange('testeWP', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{formatDate(data.testeWP)}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Unidade de Pressão</span>
                        {isEditing ? (
                          <select
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPUnidadePressao || 'inh2o'}
                            onChange={(e) => handleWpFieldChange('testeWPUnidadePressao', e.target.value)}
                          >
                            <option value="inh2o">inH2O</option>
                            <option value="inhg">inHg</option>
                            <option value="mbar">mbar</option>
                          </select>
                        ) : (
                          <p className="font-semibold text-slate-800 uppercase">{data.testeWPUnidadePressao || 'inH2O'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hora de Início</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPHoraInicio || ''}
                            placeholder="Ex.: 09:00"
                            onChange={(e) => handleWpFieldChange('testeWPHoraInicio', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPHoraInicio || '—'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hora de Fim (Calculada)</span>
                        <p className="font-semibold text-slate-800 bg-slate-100/60 px-3 py-2 rounded-xl text-sm border border-slate-200/40">
                          {wpDerived.endTime || wpSource.testeWPHoraFim || '—'}
                        </p>
                      </div>

                      {/* Temperaturas */}
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Temp. Inicial (°C)</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPTemperaturaInicial || ''}
                            placeholder="Ex.: 18.5"
                            onChange={(e) => handleWpFieldChange('testeWPTemperaturaInicial', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPTemperaturaInicial ? `${data.testeWPTemperaturaInicial} °C` : '—'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Temp. Final (°C)</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPTemperaturaFinal || ''}
                            placeholder="Ex.: 19.5"
                            onChange={(e) => handleWpFieldChange('testeWPTemperaturaFinal', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPTemperaturaFinal ? `${data.testeWPTemperaturaFinal} °C` : '—'}</p>
                        )}
                      </div>

                      {/* Pressões Atmosféricas */}
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pressão Barométrica Inicial (mb)</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPPressaoAtmosfericaInicial || ''}
                            placeholder="Ex.: 1013"
                            onChange={(e) => handleWpFieldChange('testeWPPressaoAtmosfericaInicial', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPPressaoAtmosfericaInicial ? `${data.testeWPPressaoAtmosfericaInicial} mb` : '—'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pressão Barométrica Final (mb)</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPPressaoAtmosfericaFinal || ''}
                            placeholder="Ex.: 1012"
                            onChange={(e) => handleWpFieldChange('testeWPPressaoAtmosfericaFinal', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPPressaoAtmosfericaFinal ? `${data.testeWPPressaoAtmosfericaFinal} mb` : '—'}</p>
                        )}
                      </div>
                    </div>

                    {/* Variações Calculadas */}
                    {isTestDefined && (
                      <div className="mt-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2 text-xs text-indigo-900">
                        <div className="flex justify-between">
                          <span>Variação de Temperatura (ΔT):</span>
                          <span className={`font-bold ${wpDerived.temperatureWithinManual === false ? 'text-rose-650' : 'text-indigo-950'}`}>
                            {wpDerived.tempDelta !== null ? `${wpDerived.tempDelta.toFixed(2)} °C` : '—'}
                            {wpDerived.temperatureWithinManual !== null && (
                              <span className="ml-1.5 font-semibold text-[10px]">
                                ({wpDerived.temperatureWithinManual ? 'ΔT ≤ 3.5°C OK' : 'ΔT > 3.5°C FORA DO LIMITE'})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fator Correção Temp:</span>
                          <span className="font-bold">{wpDerived.correctionTempMb !== null ? `${wpDerived.correctionTempMb.toFixed(1)} mb` : '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fator Correção Barométrica:</span>
                          <span className="font-bold">{wpDerived.correctionBaroMb !== null ? `${wpDerived.correctionBaroMb.toFixed(1)} mb` : '—'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Outros Testes e Ensaios */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-200/60">
                      <Wrench size={16} className="text-indigo-500" />
                      Outros Testes e Ensaios Operacionais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {([
                        ['Teste NAP (Pressão Adicional)', 'testeNAP'],
                        ['Teste FS (Resistência Fundo)', 'testeFS'],
                        ['Teste GI (Insuflação por Gás)', 'testeGI'],
                        ['Teste DL (Lançamento por Turco)', 'testeDL'],
                      ] as const).map(([label, key]) => (
                        <div key={key} className="space-y-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
                          {isEditing ? (
                            <select
                              className="w-full border-slate-200 rounded-xl px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-500"
                              value={editForm[key] || 'N/A'}
                              onChange={(e) => handleEditChange(key, e.target.value)}
                            >
                              <option value="YES">YES</option>
                              <option value="NO">NO</option>
                              <option value="N/A">N/A</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                wpSource[key] === 'YES' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : wpSource[key] === 'NO'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                              }`}>
                                {wpSource[key] || 'N/A'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Coluna Direita: Câmaras Superior e Inferior */}
                <div className="space-y-6">
                  {/* Câmara Superior */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between pb-2 border-b border-slate-100">
                      <span>Câmara Superior</span>
                      {isTestDefined && wpDerived.upper.passes !== null && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          wpDerived.upper.passes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {wpDerived.upper.passes ? 'Aprovado' : 'Falhou'}
                        </span>
                      )}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leitura Inicial</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPCamaraSuperiorInicio || ''}
                            placeholder="Ex.: 2.50"
                            onChange={(e) => handleWpFieldChange('testeWPCamaraSuperiorInicio', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPCamaraSuperiorInicio || '—'} {data.testeWPUnidadePressao || 'inH2O'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leitura Final</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPCamaraSuperiorFim || ''}
                            placeholder="Ex.: 2.45"
                            onChange={(e) => handleWpFieldChange('testeWPCamaraSuperiorFim', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPCamaraSuperiorFim || '—'} {data.testeWPUnidadePressao || 'inH2O'}</p>
                        )}
                      </div>
                    </div>

                    {isTestDefined && (
                      <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Pressão Corrigida</span>
                          <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{wpDerived.upper.correctedEndDisplay || '—'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Queda Real</span>
                          <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{wpDerived.upper.dropDisplay || '—'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Percentagem Queda</span>
                          <span className={`text-xs font-extrabold mt-0.5 block ${wpDerived.upper.passes === false ? 'text-rose-650' : 'text-slate-800'}`}>
                            {wpDerived.upper.dropPercentDisplay ? `${wpDerived.upper.dropPercentDisplay}%` : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Câmara Inferior */}
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between pb-2 border-b border-slate-100">
                      <span>Câmara Inferior</span>
                      {isTestDefined && wpDerived.lower.passes !== null && (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          wpDerived.lower.passes ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {wpDerived.lower.passes ? 'Aprovado' : 'Falhou'}
                        </span>
                      )}
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leitura Inicial</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPCamaraInferiorInicio || ''}
                            placeholder="Ex.: 2.50"
                            onChange={(e) => handleWpFieldChange('testeWPCamaraInferiorInicio', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPCamaraInferiorInicio || '—'} {data.testeWPUnidadePressao || 'inH2O'}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Leitura Final</span>
                        {isEditing ? (
                          <input
                            className="w-full border-slate-200 rounded-xl px-4 py-2 bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500"
                            value={editForm.testeWPCamaraInferiorFim || ''}
                            placeholder="Ex.: 2.45"
                            onChange={(e) => handleWpFieldChange('testeWPCamaraInferiorFim', e.target.value)}
                          />
                        ) : (
                          <p className="font-semibold text-slate-800">{data.testeWPCamaraInferiorFim || '—'} {data.testeWPUnidadePressao || 'inH2O'}</p>
                        )}
                      </div>
                    </div>

                    {isTestDefined && (
                      <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Pressão Corrigida</span>
                          <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{wpDerived.lower.correctedEndDisplay || '—'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Queda Real</span>
                          <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">{wpDerived.lower.dropDisplay || '—'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wide">Percentagem Queda</span>
                          <span className={`text-xs font-extrabold mt-0.5 block ${wpDerived.lower.passes === false ? 'text-rose-650' : 'text-slate-800'}`}>
                            {wpDerived.lower.dropPercentDisplay ? `${wpDerived.lower.dropPercentDisplay}%` : '—'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {selectedInspecao && (
          <InspecaoDetalhesDialog
            inspecao={selectedInspecao}
            onClose={() => setSelectedInspecao(null)}
          />
        )}
      </div>

      {/* Print-Only Compact Dossier Page */}
      <div className="hidden print:block print-dossier-page text-slate-800 text-[10px] leading-tight">
        {(() => {
          const wpPrintDerived = buildWpDerivedValues({
            pressureUnit: data.testeWPUnidadePressao,
            startTime: data.testeWPHoraInicio,
            tempInitial: data.testeWPTemperaturaInicial,
            tempFinal: data.testeWPTemperaturaFinal,
            baroInitial: data.testeWPPressaoAtmosfericaInicial,
            baroFinal: data.testeWPPressaoAtmosfericaFinal,
            upperStart: data.testeWPCamaraSuperiorInicio,
            upperEnd: data.testeWPCamaraSuperiorFim,
            lowerStart: data.testeWPCamaraInferiorInicio,
            lowerEnd: data.testeWPCamaraInferiorFim,
          });

          const completedInspections = (data.inspecoes || [])
            .filter((insp: any) => insp.status === 'Concluída')
            .sort((a: any, b: any) => new Date(b.dataInspecao).getTime() - new Date(a.dataInspecao).getTime());
          const lastInspecao = completedInspections[0];

          return (
            <>
              {/* Header */}
              <div className="border-b-2 border-indigo-600 pb-1 mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <img src="/orey-logo.jpg" alt="Orey" className="h-6 object-contain" />
                  {currentUrl && (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(currentUrl)}`} 
                      alt="QR Code" 
                      className="h-7 w-7 p-0.5 border border-slate-200 rounded bg-white shrink-0" 
                    />
                  )}
                </div>
                <div className="text-right">
                  <h1 className="text-xs font-black text-slate-800 uppercase tracking-tight">Dossier Técnico da Jangada</h1>
                  <div className="text-[6.5px] text-slate-450 font-medium mt-0.5">
                    Data do Dossier: {new Date().toLocaleDateString('pt-PT')} · ID Jangada: #{jangadaId}
                  </div>
                </div>
              </div>

              {/* Main Grid: 2 columns for A4 portrait */}
              <div className="grid grid-cols-2 gap-2">
                {/* Left Column (Identificação + Válvulas) */}
                <div className="space-y-2">
                  {/* Box 1: Identificação */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-750 uppercase tracking-wider text-[8px]">
                      1. Identificação da Jangada
                    </div>
                    <table className="w-full text-left text-[8.5px] leading-tight">
                      <tbody>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450 w-[35%]">Marca</td><td className="px-2 py-0.5 font-bold text-slate-800">{data.brand || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Modelo</td><td className="px-2 py-0.5 font-bold text-slate-800">{data.model || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Nº Série</td><td className="px-2 py-0.5 font-mono font-bold text-slate-850">{data.serial || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Lotação</td><td className="px-2 py-0.5 text-slate-700 font-medium">{data.capacity ? `${data.capacity} P` : '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Tipo Pack</td><td className="px-2 py-0.5 font-bold text-slate-800">{data.packType || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Fabricação</td><td className="px-2 py-0.5 text-slate-700">{data.dataFabrico || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Tipo Tecido</td><td className="px-2 py-0.5 text-slate-700">{data.fabricType || 'Desconhecido'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Tipo Lançam.</td><td className="px-2 py-0.5 text-slate-700">{data.launchType || 'Desconhecido'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Retenida</td><td className="px-2 py-0.5 text-slate-700">{data.painterLength ? `${data.painterLength} m` : '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Alt. Lançam.</td><td className="px-2 py-0.5 text-slate-700">{data.maxStowageHeight ? `${data.maxStowageHeight} m` : '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Navio</td><td className="px-2 py-0.5 font-bold text-indigo-700 truncate max-w-[120px]">{linkedShip?.nome || data.shipNameManual || '—'}</td></tr>
                        <tr><td className="px-2 py-0.5 font-semibold text-slate-450">Proprietário</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{linkedShip?.cliente?.nome || data.owner || '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Box 3: Válvulas, Disparo & Extras */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-750 uppercase tracking-wider text-[8px]">
                      3. Válvulas, Disparo & Extras
                    </div>
                    <table className="w-full text-left text-[8.5px] leading-tight">
                      <tbody>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450 w-[35%]">Cabeça Disparo</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.cylinderCabecaDisparoRef || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Câmara Sup.</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.cylinderTuboCamaraSuperiorRef || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Câmara Inf.</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.cylinderTuboCamaraInferiorRef || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Válvulas Alívio</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.valvulasAlivio || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Válvulas Atestar</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.valvulasAtestar || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Contentor Mod.</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.containerModel || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Última Insp.</td><td className="px-2 py-0.5 text-slate-700">{formatDate(data.dataInspecao)}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Próx. Insp.</td><td className="px-2 py-0.5 font-bold text-slate-800">{formatDate(data.dataProxInspecao)}</td></tr>
                        <tr><td className="px-2 py-0.5 font-semibold text-slate-450">Nº Certificado</td><td className="px-2 py-0.5 font-mono text-slate-800">{data.ultimoCertificadoNumero || '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column (Cilindro + Testes) */}
                <div className="space-y-2">
                  {/* Box 2: Cilindro e HRU */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-750 uppercase tracking-wider text-[8px]">
                      2. Cilindro & HRU
                    </div>
                    <table className="w-full text-left text-[8.5px] leading-tight">
                      <tbody>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450 w-[35%]">Cilindro Série</td><td className="px-2 py-0.5 font-mono text-slate-850">{data.cylinderSerial || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Insuflação</td><td className="px-2 py-0.5 text-slate-700">{data.cylinderSistema || data.cylinderInflationSystem || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Bruto / Tara</td><td className="px-2 py-0.5 text-slate-700">{data.cylinderPesoBruto ? `${data.cylinderPesoBruto} kg` : '—'} / {data.cylinderTara ? `${data.cylinderTara} kg` : '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Gás CO2 / N2</td><td className="px-2 py-0.5 text-slate-700">{data.cylinderCo2 ? `${data.cylinderCo2} kg` : '—'} / {data.cylinderN2 ? `${data.cylinderN2} kg` : '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">Último Teste Hid.</td><td className="px-2 py-0.5 text-slate-700">{data.cylinderDataTeste || '—'}</td></tr>
                        <tr className="border-b border-slate-100"><td className="px-2 py-0.5 font-semibold text-slate-450">HRU Ref. / Val.</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.hruReferencia || '—'} / <span className="font-bold text-slate-850">{formatMonthYear(data.hruValidade)}</span></td></tr>
                        <tr><td className="px-2 py-0.5 font-semibold text-slate-450">Refletor Radar</td><td className="px-2 py-0.5 text-slate-700 truncate max-w-[120px]">{data.radarReflector || '—'}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Box 4: Testes & Ensaios Operacionais */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-750 uppercase tracking-wider text-[8px]">
                      4. Testes & Ensaios Operacionais
                    </div>
                    <table className="w-full text-left text-[8.5px] leading-tight">
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-0.5 font-semibold text-slate-450 w-[35%]">Teste WP</td>
                          <td className="px-2 py-0.5 font-bold text-slate-850">{formatDate(data.testeWP)}</td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Horário WP</td>
                          <td className="px-2 py-0.5 text-slate-700">
                            {data.testeWPHoraInicio || '—'} → {data.testeWPHoraFim || wpPrintDerived.endTime || '—'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Temp WP</td>
                          <td className="px-2 py-0.5 text-slate-700">
                            {data.testeWPTemperaturaInicial ? `${data.testeWPTemperaturaInicial}ºC` : '—'} / {data.testeWPTemperaturaFinal ? `${data.testeWPTemperaturaFinal}ºC` : '—'}
                            {wpPrintDerived.tempDelta !== null ? ` (ΔT: ${wpPrintDerived.tempDelta.toFixed(1)}ºC)` : ''}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Baro WP</td>
                          <td className="px-2 py-0.5 text-slate-700">
                            {data.testeWPPressaoAtmosfericaInicial ? `${data.testeWPPressaoAtmosfericaInicial}mb` : '—'} / {data.testeWPPressaoAtmosfericaFinal ? `${data.testeWPPressaoAtmosfericaFinal}mb` : '—'}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Câmara Sup.</td>
                          <td className="px-2 py-0.5 text-slate-700">
                            <div>{data.testeWPCamaraSuperiorInicio || '—'} → {data.testeWPCamaraSuperiorFim || '—'} {data.testeWPUnidadePressao || 'inH2O'}</div>
                            <div className="text-[7.2px] text-slate-500">
                              Queda: {wpPrintDerived.upper.dropDisplay || '—'} ({wpPrintDerived.upper.dropPercentDisplay ? `${wpPrintDerived.upper.dropPercentDisplay}%` : '—'}) 
                              <span className={`ml-1 font-bold ${wpPrintDerived.upper.passes === true ? 'text-emerald-600' : wpPrintDerived.upper.passes === false ? 'text-rose-600' : ''}`}>
                                [{wpPrintDerived.upper.passes === true ? 'OK' : wpPrintDerived.upper.passes === false ? 'FALHOU' : '—'}]
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Câmara Inf.</td>
                          <td className="px-2 py-0.5 text-slate-700">
                            <div>{data.testeWPCamaraInferiorInicio || '—'} → {data.testeWPCamaraInferiorFim || '—'} {data.testeWPUnidadePressao || 'inH2O'}</div>
                            <div className="text-[7.2px] text-slate-500">
                              Queda: {wpPrintDerived.lower.dropDisplay || '—'} ({wpPrintDerived.lower.dropPercentDisplay ? `${wpPrintDerived.lower.dropPercentDisplay}%` : '—'}) 
                              <span className={`ml-1 font-bold ${wpPrintDerived.lower.passes === true ? 'text-emerald-600' : wpPrintDerived.lower.passes === false ? 'text-rose-600' : ''}`}>
                                [{wpPrintDerived.lower.passes === true ? 'OK' : wpPrintDerived.lower.passes === false ? 'FALHOU' : '—'}]
                              </span>
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Teste NAP / FS</td>
                          <td className="px-2 py-0.5 font-bold text-slate-800">
                            {data.testeNAP || 'N/A'} / {data.testeFS || 'N/A'}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-0.5 font-semibold text-slate-450">Teste GI / DL</td>
                          <td className="px-2 py-0.5 font-bold text-slate-800">
                            {data.testeGI || 'N/A'} / {data.testeDL || 'N/A'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Emergency Pack Compliance Summary */}
              <div className="mt-1.5 border border-slate-200 rounded-xl p-1.5 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Estado de Conformidade do Pack</div>
                  <div className="text-[9px] font-bold text-slate-800 mt-0.5">
                    Pack de Emergência: <span className="text-indigo-700 font-extrabold">{data.packType || '—'}</span> (Lotação: {data.capacity ? `${data.capacity} P` : '—'})
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const summary = getComplianceSummary();
                    let complianceBadge = (
                      <span className="bg-red-100 text-red-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase border border-red-200">
                        Inconforme
                      </span>
                    );
                    if (summary.missing === 0 && summary.expired === 0) {
                      if (summary.incomplete === 0) {
                        complianceBadge = (
                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase border border-emerald-200">
                            Conforme
                          </span>
                        );
                      } else {
                        complianceBadge = (
                          <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase border border-amber-200">
                            Qtd Insuficiente
                          </span>
                        );
                      }
                    }
                    return (
                      <>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-500 font-medium">Itens Completos: </span>
                          <span className="font-bold text-[9px] text-slate-800">{summary.complete} / {summary.total} ({summary.percent}%)</span>
                        </div>
                        {complianceBadge}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Section 5: Inventário de Artigos */}
              {artigos && artigos.length > 0 && (
                <div className="mt-1.5 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[8px]">
                    5. Inventário de Artigos e Consumíveis (Validades)
                  </div>
                  <div className="p-1 grid grid-cols-3 gap-x-3 gap-y-0.5 bg-white text-[7px] leading-tight">
                    {artigos.map((artigo, index) => (
                      <div key={index} className="flex justify-between items-center py-0.5 border-b border-slate-50">
                        <span className="font-semibold truncate max-w-[140px] text-slate-700">{artigo.name}</span>
                        <span className="font-mono text-[6.5px] text-slate-500">
                          {artigo.quantidade}x · Val: {formatMonthYear(artigo.validade)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: Consumíveis Substituídos na Última Inspeção */}
              {lastInspecao && lastInspecao.artigos && lastInspecao.artigos.length > 0 && (
                <div className="mt-1.5 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[8px] flex justify-between items-center">
                    <span>6. Consumíveis Substituídos na Última Inspeção ({formatDate(lastInspecao.dataInspecao)})</span>
                    <span className="text-slate-400 font-medium lowercase text-[7.5px]">({lastInspecao.artigos.length} artigos)</span>
                  </div>
                  <div className="p-1.5 grid grid-cols-4 gap-1 bg-white">
                    {lastInspecao.artigos.map((art: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-lg p-1 text-[7px]">
                        <span className="font-bold truncate max-w-[120px]" title={art.name}>{art.name}</span>
                        <span className="font-semibold text-slate-500 bg-slate-150 px-1 rounded">Qtd: {art.quantidade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signatures & Footer */}
              <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex justify-center text-center">
                <div className="flex flex-col items-center">
                  {data.signatureBase64 ? (
                    <img 
                      src={data.signatureBase64} 
                      alt="Assinatura" 
                      className="h-7 object-contain mb-1" 
                    />
                  ) : lastInspecao?.signatureBase64 ? (
                    <img 
                      src={lastInspecao.signatureBase64} 
                      alt="Assinatura" 
                      className="h-7 object-contain mb-1" 
                    />
                  ) : (
                    <div className="h-4 w-32"></div>
                  )}
                  <div className="w-32 border-b border-slate-300"></div>
                  <span className="text-[6.5px] text-slate-400 mt-1 uppercase font-bold tracking-wider">Técnico Responsável</span>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}

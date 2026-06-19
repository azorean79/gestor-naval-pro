"use client";
import React, { useMemo } from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { Package, ShieldAlert, Zap, Droplets, Flame, Stethoscope, Info, ChevronDown } from 'lucide-react';
import { getMandatoryPackItemsForRaft, findMatchingArticleForPackItem } from '../rafts/mandatoryPack';

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

const isRecreio = (shipDetails: any) => {
  if (!shipDetails) return false;
  const haystack = `${shipDetails.tipoPesca || ''} ${shipDetails.tipoNavio || ''}`.toLowerCase();
  return haystack.includes("recreio");
};

const getInspectionIntervalYears = (brand: string, model: string, shipDetails: any) => {
  if (!isRecreio(shipDetails)) {
    return 1;
  }
  const brandNorm = (brand || '').toUpperCase().trim();
  const modelNorm = (model || '').toUpperCase().trim();
  if (brandNorm === 'RFD' && modelNorm.includes('ISO 9650')) {
    return 3;
  }
  if (brandNorm === 'RFD' || brandNorm === 'DSB') {
    return 1;
  }
  return 3;
};

const checkValidityWarning = (validadeStr: string, dataProxInspecao: string, dataInspecao: string, brand: string, shipDetails: any) => {
  if (!validadeStr) return null;
  
  let refDateStr = dataProxInspecao;
  if (!refDateStr && dataInspecao) {
    const years = getInspectionIntervalYears(brand, '', shipDetails);
    const parts = dataInspecao.split('-');
    if (parts[0] && parts[0].length === 4) {
      const year = parseInt(parts[0]) + years;
      const month = parts[1] || '01';
      const day = parts[2] || '01';
      refDateStr = `${year}-${month}-${day}`;
    }
  }
  
  if (!refDateStr) return null;
  
  const [vYear, vMonth] = validadeStr.split('-').map(Number);
  const valDate = new Date(vYear, (vMonth || 1) - 1, 1);
  
  const [pYear, pMonth] = refDateStr.split('-').map(Number);
  const proxDate = new Date(pYear, (pMonth || 1) - 1, 1);
  
  if (isNaN(valDate.getTime()) || isNaN(proxDate.getTime())) return null;
  
  if (valDate < proxDate) {
    return 'warning';
  }
  return 'ok';
};

const PACK_ICONS: Record<string, any> = {
  'agua': Droplets,
  'racoes': Package,
  'farmacia': Stethoscope,
  'comprimidos': ShieldAlert,
  'paraquedas': Flame,
  'fachos': Flame,
  'fumo': Flame,
  'pilhas': Zap,
};

const PACK_COLORS: Record<string, string> = {
  'agua': 'text-blue-500 bg-blue-50',
  'racoes': 'text-amber-600 bg-amber-50',
  'farmacia': 'text-emerald-600 bg-emerald-50',
  'comprimidos': 'text-teal-600 bg-teal-50',
  'paraquedas': 'text-red-500 bg-red-50',
  'fachos': 'text-orange-500 bg-orange-50',
  'fumo': 'text-slate-600 bg-slate-100',
  'pilhas': 'text-yellow-600 bg-yellow-50',
};

export default function Step4_PackMascara() {
  const { inspectionData, setInspectionData } = useJangadaWizardStore();

  const packItems = inspectionData.packItems || {};

  // Calcular itens obrigatórios baseados na jangada atual
  const mandatoryItems = useMemo(() => {
    return getMandatoryPackItemsForRaft({
      brand: inspectionData.brand,
      model: inspectionData.model,
      packType: inspectionData.packType,
      capacity: inspectionData.capacity,
    });
  }, [inspectionData.brand, inspectionData.model, inspectionData.packType, inspectionData.capacity]);

  
  // Auto-fill mandatory items when packType or capacity changes or on load
  React.useEffect(() => {
    if (mandatoryItems.length > 0 && (!packItems || Object.keys(packItems).length === 0)) {
      const initialPackItems: any = {};
      mandatoryItems.forEach(item => {
        const matched = findMatchingArticleForPackItem(item, inspectionData.artigos || []) as any;
        initialPackItems[item.checklistName] = {
          checklistName: item.checklistName,
          quantidade: item.quantity,
          quantidadeVerificada: matched ? matched.quantidade : 0,
          validade: matched ? toMonthInputFormat(matched.validade) : '',
          lote: matched ? matched.codigoFabricante || matched.referencia || '' : '',
          referencia: matched ? matched.referencia : '',
          stockId: matched ? matched.id : undefined,
        };
      });
      setInspectionData({ packItems: initialPackItems });
    }
  }, [mandatoryItems, packItems, setInspectionData, inspectionData.artigos]);

  const updateItem = (referenciaStr: string, field: string, value: string) => {
    const updated = { ...packItems };
    for (const key of Object.keys(updated)) {
      if (updated[key].referencia === referenciaStr) {
        updated[key] = { ...updated[key], [field]: value };
      }
    }
    setInspectionData({ packItems: updated });
  };

  const handleStockSelect = (referenciaStr: string, stockIdStr: string) => {
    const stockId = parseInt(stockIdStr, 10);
    const stockItem = inspectionData.globalStock?.find((s: any) => s.id === stockId);
    if (stockItem) {
      const updated = { ...packItems };
      for (const key of Object.keys(updated)) {
        if (updated[key].referencia === referenciaStr) {
          updated[key] = { 
            ...updated[key], 
            referencia: stockItem.referencia,
            stockId: stockItem.id,
            validade: stockItem.validade || updated[key].validade,
            lote: stockItem.lote || updated[key].lote
          };
        }
      }
      setInspectionData({ packItems: updated });
    }
  };

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setInspectionData({
      packItems: {
        ...packItems,
        [itemId]: { ...(packItems[itemId] || {}), [field]: value }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">4. Pack de Emergência</h2>
        <p className="text-slate-600 mt-1">Registe as validades e quantidades dos consumíveis obrigatórios da jangada.</p>
        <div className="mt-3 flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm font-medium w-fit border border-indigo-100">
          <Info size={16} />
          A mostrar requisitos para: {inspectionData.packType || 'Pack não definido'} / {inspectionData.capacity || '0'} Pax
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 bg-slate-50 px-6 py-4 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-12 lg:col-span-4">Artigo de Emergência</div>
          <div className="col-span-6 lg:col-span-2 text-center">Obrigatório</div>
          <div className="col-span-6 lg:col-span-3 text-center">Verificado / Substituído</div>
          <div className="col-span-12 lg:col-span-3">Nova Validade / Lote</div>
        </div>

        <div className="divide-y divide-slate-100">
          {mandatoryItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Configure o "Tipo de Pack" e "Capacidade" no Passo 1 para ver os itens obrigatórios.
            </div>
          ) : (
            mandatoryItems.map((item) => {
              const simpleKey = item.checklistName.replace('validade_', '').replace('foguetoes_', '').replace('_alimentares', '').replace('_mao', '').replace('_lanterna', '').replace('_enjoo', '');
              const icon = PACK_ICONS[simpleKey] || Package;
              const color = PACK_COLORS[simpleKey] || 'text-indigo-600 bg-indigo-50';
              const IconComponent = icon;

              const data = packItems[item.checklistName] || { quantidadeVerificada: 0, quantidade: 0, lote: '', validade: '' };
              const isRecreioVal = isRecreio(inspectionData.shipDetails);
              const warningStatus = checkValidityWarning(
                data.validade,
                inspectionData.dataProxInspecao,
                inspectionData.dataInspecao,
                inspectionData.brand,
                inspectionData.shipDetails
              );
              const isWarning = warningStatus === 'warning';
              
              return (
                <div key={item.checklistName} className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="col-span-12 lg:col-span-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{item.category}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-6 lg:col-span-2 flex justify-center">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-semibold text-sm w-fit border border-slate-200">
                      {item.quantityLabel}
                    </div>
                  </div>

                  <div className="col-span-6 lg:col-span-3 flex gap-2">
                    <div className="w-1/2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block lg:hidden">Verificado</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Verif."
                        value={data.quantidadeVerificada || ''}
                        onChange={(e) => handleItemChange(item.checklistName, 'quantidadeVerificada', parseInt(e.target.value) || 0)}
                        className="w-full text-sm border-slate-200 rounded-xl px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-100 transition-colors"
                        title="Quantidade Verificada"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block lg:hidden">Substituído</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Subst."
                        value={data.quantidade || ''}
                        onChange={(e) => handleItemChange(item.checklistName, 'quantidade', parseInt(e.target.value) || 0)}
                        className="w-full text-sm border-slate-200 rounded-xl px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-100 transition-colors"
                        title="Quantidade Substituída"
                      />
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lote no Stock (Opcional)</label>
                      <div className="relative">
                        <select
                          value={data.stockId || ""}
                          onChange={(e) => handleStockSelect(item.checklistName, e.target.value)}
                          className="w-full border-slate-200 rounded-lg px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100 transition-shadow appearance-none"
                        >
                          <option value="" disabled>Selecionar peça/lote do armazém...</option>
                          {(inspectionData.globalStock || [])
                            .filter((s: any) => {
                              const queryDesc = item.label.toLowerCase();
                              const stockDesc = s.descricao.toLowerCase();
                              return stockDesc.includes(queryDesc.split(' ')[0]) || 
                                     (s.categoria && s.categoria === 'PACK');
                            })
                            .map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.referencia} - Lote: {s.lote || 'N/A'} (Qtd: {s.quantidade})
                              </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <ChevronDown size={14} className="text-slate-400" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Validade {data.validade && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>}</label>
                        <input
                          type="month"
                          value={data.validade}
                          onChange={(e) => handleItemChange(item.checklistName, 'validade', e.target.value)}
                          className={`w-full text-sm rounded-xl px-2 py-2 bg-white focus:ring-2 transition-colors border ${
                            data.quantidade > 0 && !data.validade 
                              ? 'border-red-300 ring-2 ring-red-100 bg-red-50' 
                              : isWarning
                                ? 'border-amber-300 ring-2 ring-amber-100 bg-amber-50 focus:ring-amber-200 text-amber-900'
                                : 'border-slate-200 focus:ring-indigo-100'
                          }`}
                        />
                        {isWarning && (
                          <p className="text-[9px] text-amber-700 font-semibold mt-1 leading-tight">
                            ⚠️ Sugere-se substituir (val. inferior a {isRecreioVal && !(inspectionData.brand?.toUpperCase().trim() === 'RFD' && !inspectionData.model?.toUpperCase().trim().includes('ISO 9650')) ? '3 anos' : '12 meses'})
                          </p>
                        )}
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] uppercase text-slate-400 font-bold mb-1 block">Lote Manual</label>
                        <input
                          type="text"
                          placeholder="Ex: A23"
                          value={data.lote}
                          onChange={(e) => handleItemChange(item.checklistName, 'lote', e.target.value)}
                          className="w-full text-sm border-slate-200 rounded-xl px-2 py-2 bg-white focus:ring-2 focus:ring-indigo-100 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
        <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-sm font-bold text-amber-900">Atenção Crítica de Validades</h4>
          <p className="text-xs text-amber-800 mt-1">A validade global da jangada será ditada pelo artigo de emergência que expirar primeiro. Certifique-se que nenhuma validade inserida expira antes da próxima revisão agendada.</p>
        </div>
      </div>
    </div>
  );
}

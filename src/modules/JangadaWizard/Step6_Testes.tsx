"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { Activity, Gauge, ArrowDownToLine, Droplet, Clock } from 'lucide-react';

const TESTS = [
  { id: 'testeWP', label: 'WP (Working Pressure)', icon: Gauge, desc: 'Teste de Pressão de Trabalho (Anual)' },
  { id: 'testeGI', label: 'GI (Gas Inflation)', icon: Droplet, desc: 'Teste de Insuflação por Gás (5 em 5 anos)' },
  { id: 'testeFS', label: 'FS (Floor Seam)', icon: Activity, desc: 'Teste de Costura do Fundo (A partir do 11º ano)' },
  { id: 'testeNAP', label: 'NAP (Necessary Additional Pressure)', icon: Clock, desc: 'Teste de Pressão Adicional (A partir do 11º ano)' },
  { id: 'testeDL', label: 'DL (Davit Load)', icon: ArrowDownToLine, desc: 'Teste de Carga de Turco (Apenas tipo Davit-Launch)' },
];

export default function Step6_Testes() {
  const { inspectionData, setInspectionData } = useJangadaWizardStore();

  const testes = inspectionData.testes || {};

  const handleTestChange = (testId: string, result: string) => {
    setInspectionData({
      testes: {
        ...testes,
        [testId]: result
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">6. Testes Operacionais e de Pressão</h2>
        <p className="text-slate-600 mt-1">Registe os resultados dos testes estruturais realizados na jangada.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Painel de Testes</h3>
        </div>

        <div className="divide-y divide-slate-100 p-6 space-y-6">
          {TESTS.map((test) => {
            const currentResult = testes[test.id] || '';
            const isWP = test.id === 'testeWP';

            return (
              <div key={test.id} className="pt-6 first:pt-0 border-t border-slate-100 first:border-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 shrink-0">
                      <test.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{test.label}</h4>
                      <p className="text-sm text-slate-500 mt-1">{test.desc}</p>
                    </div>
                  </div>

                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    {['PASSOU', 'REPROVOU', 'N/A'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleTestChange(test.id, option)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          currentResult === option
                            ? option === 'PASSOU'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : option === 'REPROVOU'
                                ? 'bg-red-500 text-white shadow-sm'
                                : 'bg-slate-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {isWP && currentResult === 'PASSOU' && (
                  <div className="mt-6 ml-[3.25rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="col-span-full mb-2 flex justify-between items-center">
                      <h5 className="text-sm font-bold text-slate-700">Parâmetros do Teste WP</h5>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unidade:</label>
                        <select 
                          value={testes.wpUnidadePressao || 'mbar'}
                          onChange={(e) => handleTestChange('wpUnidadePressao', e.target.value)}
                          className="border-slate-200 rounded-xl px-2 py-1 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="mbar">mbar</option>
                          <option value="inh2o">inH2O</option>
                          <option value="inhg">inHg</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora Início</label>
                      <input 
                        type="time" 
                        value={testes.wpHoraInicio || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleTestChange('wpHoraInicio', val);
                          if (val) {
                            const [h, m] = val.split(':').map(Number);
                            if (!isNaN(h) && !isNaN(m)) {
                              const endH = (h + 1) % 24;
                              handleTestChange('wpHoraFim', `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                            }
                          }
                        }}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora Fim (Automático +60m)</label>
                      <input 
                        type="time" 
                        value={testes.wpHoraFim || ''}
                        onChange={(e) => handleTestChange('wpHoraFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Temp. Inicial (ºC)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.wpTempInicio || ''}
                        onChange={(e) => handleTestChange('wpTempInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Temp. Final (ºC)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.wpTempFim || ''}
                        onChange={(e) => handleTestChange('wpTempFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">P. Atmosférica Inicial (hPa)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.wpPressaoAtmInicio || ''}
                        onChange={(e) => handleTestChange('wpPressaoAtmInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">P. Atmosférica Final (hPa)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.wpPressaoAtmFim || ''}
                        onChange={(e) => handleTestChange('wpPressaoAtmFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="col-span-full border-t border-slate-200 my-2"></div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Sup. (Início)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.wpCamaraSupInicio || ''}
                        onChange={(e) => handleTestChange('wpCamaraSupInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Sup. (Fim)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.wpCamaraSupFim || ''}
                        onChange={(e) => handleTestChange('wpCamaraSupFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Inf. (Início)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.wpCamaraInfInicio || ''}
                        onChange={(e) => handleTestChange('wpCamaraInfInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Inf. (Fim)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.wpCamaraInfFim || ''}
                        onChange={(e) => handleTestChange('wpCamaraInfFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Cálculos Automáticos WP */}
                    <div className="col-span-full mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                      <h5 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Activity size={16} />
                        Resultados Calculados WP
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const tIn = parseFloat(testes.wpTempInicio);
                          const tOut = parseFloat(testes.wpTempFim);
                          const pAtmIn = parseFloat(testes.wpPressaoAtmInicio);
                          const pAtmOut = parseFloat(testes.wpPressaoAtmFim);
                          
                          const supIn = parseFloat(testes.wpCamaraSupInicio);
                          const supOut = parseFloat(testes.wpCamaraSupFim);
                          const infIn = parseFloat(testes.wpCamaraInfInicio);
                          const infOut = parseFloat(testes.wpCamaraInfFim);

                          const unit = testes.wpUnidadePressao || 'mbar';

                          const toMbar = (val: number) => {
                            if (isNaN(val)) return NaN;
                            if (unit === 'inhg') return val * 33.8638866667;
                            if (unit === 'inh2o') return val * 2.490889;
                            return val;
                          };

                          const fromMbar = (val: number) => {
                            if (isNaN(val)) return NaN;
                            if (unit === 'inhg') return val / 33.8638866667;
                            if (unit === 'inh2o') return val / 2.490889;
                            return val;
                          };

                          if (isNaN(tIn) || isNaN(tOut) || isNaN(pAtmIn) || isNaN(pAtmOut)) {
                            return <div className="text-xs text-indigo-700 col-span-2">Preencha a temperatura e pressão atmosférica para ver as correções.</div>;
                          }

                          const tempDelta = tOut - tIn;
                          const baroDelta = pAtmOut - pAtmIn;
                          const correctionTempMb = -(tempDelta * 4);
                          const correctionBaroMb = baroDelta;
                          const totalCorrectionMb = correctionTempMb + correctionBaroMb;
                          const tempValid = Math.abs(tempDelta) <= 3.5;

                          const analyzeChamber = (startRaw: number, endRaw: number) => {
                            if (isNaN(startRaw) || isNaN(endRaw)) return null;
                            const startMb = toMbar(startRaw);
                            const endMb = toMbar(endRaw);

                            const correctedEndMb = endMb + totalCorrectionMb;
                            const dropMbRaw = startMb - correctedEndMb;
                            const dropMb = Math.max(0, dropMbRaw);
                            const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
                            const passes = percent <= 5 && tempValid;
                            
                            return { 
                              correctedEndDisplay: fromMbar(correctedEndMb), 
                              dropDisplay: fromMbar(dropMb), 
                              percent, 
                              passes 
                            };
                          };

                          const sup = analyzeChamber(supIn, supOut);
                          const inf = analyzeChamber(infIn, infOut);

                          return (
                            <>
                              <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Câmara Superior</p>
                                {sup ? (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm">P. Corrigida: <span className="font-semibold text-slate-800">{sup.correctedEndDisplay.toFixed(2)} {unit}</span></p>
                                    <p className="text-sm">Queda: <span className="font-semibold text-red-500">{sup.dropDisplay.toFixed(2)} {unit} ({sup.percent.toFixed(2)}%)</span></p>
                                    <p className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${sup.passes ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {sup.passes ? '✓ APROVADO' : '✗ REPROVADO'}
                                    </p>
                                  </div>
                                ) : <p className="text-xs text-slate-400 mt-1">A aguardar pressões...</p>}
                              </div>

                              <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Câmara Inferior</p>
                                {inf ? (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm">P. Corrigida: <span className="font-semibold text-slate-800">{inf.correctedEndDisplay.toFixed(2)} {unit}</span></p>
                                    <p className="text-sm">Queda: <span className="font-semibold text-red-500">{inf.dropDisplay.toFixed(2)} {unit} ({inf.percent.toFixed(2)}%)</span></p>
                                    <p className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${inf.passes ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {inf.passes ? '✓ APROVADO' : '✗ REPROVADO'}
                                    </p>
                                  </div>
                                ) : <p className="text-xs text-slate-400 mt-1">A aguardar pressões...</p>}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bloco idêntico para NAP */}
                {test.id === 'testeNAP' && currentResult === 'PASSOU' && (
                  <div className="mt-6 ml-[3.25rem] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="col-span-full mb-2 flex justify-between items-center">
                      <h5 className="text-sm font-bold text-slate-700">Parâmetros do Teste NAP</h5>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Unidade:</label>
                        <select 
                          value={testes.napUnidadePressao || 'mbar'}
                          onChange={(e) => handleTestChange('napUnidadePressao', e.target.value)}
                          className="border-slate-200 rounded-xl px-2 py-1 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-100"
                        >
                          <option value="mbar">mbar</option>
                          <option value="inh2o">inH2O</option>
                          <option value="inhg">inHg</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora Início</label>
                      <input 
                        type="time" 
                        value={testes.napHoraInicio || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleTestChange('napHoraInicio', val);
                          if (val) {
                            const [h, m] = val.split(':').map(Number);
                            if (!isNaN(h) && !isNaN(m)) {
                              const endH = (h + 1) % 24;
                              handleTestChange('napHoraFim', `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                            }
                          }
                        }}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Hora Fim (Automático +60m)</label>
                      <input 
                        type="time" 
                        value={testes.napHoraFim || ''}
                        onChange={(e) => handleTestChange('napHoraFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Temp. Inicial (ºC)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.napTempInicio || ''}
                        onChange={(e) => handleTestChange('napTempInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Temp. Final (ºC)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.napTempFim || ''}
                        onChange={(e) => handleTestChange('napTempFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">P. Atmosférica Inicial (hPa)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.napPressaoAtmInicio || ''}
                        onChange={(e) => handleTestChange('napPressaoAtmInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">P. Atmosférica Final (hPa)</label>
                      <input 
                        type="number" step="0.1"
                        value={testes.napPressaoAtmFim || ''}
                        onChange={(e) => handleTestChange('napPressaoAtmFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div className="col-span-full border-t border-slate-200 my-2"></div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Sup. (Início)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.napCamaraSupInicio || ''}
                        onChange={(e) => handleTestChange('napCamaraSupInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Sup. (Fim)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.napCamaraSupFim || ''}
                        onChange={(e) => handleTestChange('napCamaraSupFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Inf. (Início)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.napCamaraInfInicio || ''}
                        onChange={(e) => handleTestChange('napCamaraInfInicio', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pressão Câm. Inf. (Fim)</label>
                      <input 
                        type="number" step="0.01"
                        value={testes.napCamaraInfFim || ''}
                        onChange={(e) => handleTestChange('napCamaraInfFim', e.target.value)}
                        className="w-full border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    {/* Cálculos Automáticos NAP */}
                    <div className="col-span-full mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                      <h5 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Activity size={16} />
                        Resultados Calculados NAP
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const tIn = parseFloat(testes.napTempInicio);
                          const tOut = parseFloat(testes.napTempFim);
                          const pAtmIn = parseFloat(testes.napPressaoAtmInicio);
                          const pAtmOut = parseFloat(testes.napPressaoAtmFim);
                          
                          const supIn = parseFloat(testes.napCamaraSupInicio);
                          const supOut = parseFloat(testes.napCamaraSupFim);
                          const infIn = parseFloat(testes.napCamaraInfInicio);
                          const infOut = parseFloat(testes.napCamaraInfFim);

                          const unit = testes.napUnidadePressao || 'mbar';

                          const toMbar = (val: number) => {
                            if (isNaN(val)) return NaN;
                            if (unit === 'inhg') return val * 33.8638866667;
                            if (unit === 'inh2o') return val * 2.490889;
                            return val;
                          };

                          const fromMbar = (val: number) => {
                            if (isNaN(val)) return NaN;
                            if (unit === 'inhg') return val / 33.8638866667;
                            if (unit === 'inh2o') return val / 2.490889;
                            return val;
                          };

                          if (isNaN(tIn) || isNaN(tOut) || isNaN(pAtmIn) || isNaN(pAtmOut)) {
                            return <div className="text-xs text-indigo-700 col-span-2">Preencha a temperatura e pressão atmosférica para ver as correções.</div>;
                          }

                          const tempDelta = tOut - tIn;
                          const baroDelta = pAtmOut - pAtmIn;
                          const correctionTempMb = -(tempDelta * 4);
                          const correctionBaroMb = baroDelta;
                          const totalCorrectionMb = correctionTempMb + correctionBaroMb;
                          const tempValid = Math.abs(tempDelta) <= 3.5;

                          const analyzeChamber = (startRaw: number, endRaw: number) => {
                            if (isNaN(startRaw) || isNaN(endRaw)) return null;
                            const startMb = toMbar(startRaw);
                            const endMb = toMbar(endRaw);

                            const correctedEndMb = endMb + totalCorrectionMb;
                            const dropMbRaw = startMb - correctedEndMb;
                            const dropMb = Math.max(0, dropMbRaw);
                            const percent = startMb > 0 ? (dropMb / startMb) * 100 : 0;
                            const passes = percent <= 5 && tempValid;
                            
                            return { 
                              correctedEndDisplay: fromMbar(correctedEndMb), 
                              dropDisplay: fromMbar(dropMb), 
                              percent, 
                              passes 
                            };
                          };

                          const sup = analyzeChamber(supIn, supOut);
                          const inf = analyzeChamber(infIn, infOut);

                          return (
                            <>
                              <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Câmara Superior</p>
                                {sup ? (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm">P. Corrigida: <span className="font-semibold text-slate-800">{sup.correctedEndDisplay.toFixed(2)} {unit}</span></p>
                                    <p className="text-sm">Queda: <span className="font-semibold text-red-500">{sup.dropDisplay.toFixed(2)} {unit} ({sup.percent.toFixed(2)}%)</span></p>
                                    <p className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${sup.passes ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {sup.passes ? '✓ APROVADO' : '✗ REPROVADO'}
                                    </p>
                                  </div>
                                ) : <p className="text-xs text-slate-400 mt-1">A aguardar pressões...</p>}
                              </div>

                              <div className="bg-white p-3 rounded-lg border border-indigo-50 shadow-sm">
                                <p className="text-xs font-bold text-slate-500 uppercase">Câmara Inferior</p>
                                {inf ? (
                                  <div className="mt-2 space-y-1">
                                    <p className="text-sm">P. Corrigida: <span className="font-semibold text-slate-800">{inf.correctedEndDisplay.toFixed(2)} {unit}</span></p>
                                    <p className="text-sm">Queda: <span className="font-semibold text-red-500">{inf.dropDisplay.toFixed(2)} {unit} ({inf.percent.toFixed(2)}%)</span></p>
                                    <p className={`text-sm font-bold mt-1.5 flex items-center gap-1 ${inf.passes ? 'text-emerald-600' : 'text-red-600'}`}>
                                      {inf.passes ? '✓ APROVADO' : '✗ REPROVADO'}
                                    </p>
                                  </div>
                                ) : <p className="text-xs text-slate-400 mt-1">A aguardar pressões...</p>}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

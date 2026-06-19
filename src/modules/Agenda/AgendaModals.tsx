import React from 'react';
import { useAgendaStore } from '@/lib/store/useAgendaStore';
import { AZORES_TECHNICIANS, normalizeTechnicianName } from '@/lib/agenda-technicians';

type AgendaModalsProps = {
  handleQuickSchedule: () => void;
};

export default function AgendaModals({ handleQuickSchedule }: AgendaModalsProps) {
  const { 
    quickScheduleTarget, 
    setQuickScheduleTarget, 
    quickScheduleDateTime, 
    setQuickScheduleDateTime, 
    quickScheduleResponsavel, 
    setQuickScheduleResponsavel 
  } = useAgendaStore();

  if (!quickScheduleTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setQuickScheduleTarget(null)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Agendar inspeção</h3>
          <button onClick={() => setQuickScheduleTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>
        <div className="mb-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-sm font-medium text-blue-900">{quickScheduleTarget.shipName}</p>
          <p className="text-xs text-blue-600">Jangada: {quickScheduleTarget.label}</p>
          {quickScheduleTarget.dataProxInspecao && (
            <p className="text-xs text-blue-500">Validade: {new Date(quickScheduleTarget.dataProxInspecao).toLocaleDateString('pt-PT')}</p>
          )}
        </div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data e Hora
          <input
            type="datetime-local"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={quickScheduleDateTime}
            onChange={e => setQuickScheduleDateTime(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">
          Responsável
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={quickScheduleResponsavel}
            onChange={e => setQuickScheduleResponsavel(normalizeTechnicianName(e.target.value))}
          >
            <option value="">Sem responsável definido</option>
            {AZORES_TECHNICIANS.map((tech) => (
              <option key={tech.id} value={tech.name}>{tech.name} · {tech.role}</option>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-2">
            {AZORES_TECHNICIANS.map((tech) => {
              const isActive = quickScheduleResponsavel === tech.name;
              return (
                <button
                  key={tech.id}
                  type="button"
                  onClick={() => setQuickScheduleResponsavel(tech.name)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}
                >
                  {tech.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </label>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleQuickSchedule}
            disabled={!quickScheduleDateTime}
            className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >Agendar</button>
          <button
            onClick={() => setQuickScheduleTarget(null)}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
          >Cancelar</button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAgendaStore } from '@/lib/store/useAgendaStore';

type AgendaHeaderProps = {
  handleExportCSV: () => void;
  handleExportExcel: () => void;
  handleExportPDF: () => void;
  handleDesmarcarTodos: () => void;
};

export default function AgendaHeader({
  handleExportCSV,
  handleExportExcel,
  handleExportPDF,
  handleDesmarcarTodos
}: AgendaHeaderProps) {
  const { viewMode, setViewMode, exportingFormat, showAdvancedPanels, setShowAdvancedPanels } = useAgendaStore();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
      <h1 className="text-2xl font-bold">Agenda de Inspeções</h1>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 transition-colors ${viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >Calendário</button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >Lista</button>
          <button
            onClick={() => setViewMode('board')}
            className={`px-3 py-1.5 border-l border-gray-200 transition-colors ${viewMode === 'board' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >Quadro</button>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exportingFormat !== null}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >{exportingFormat === 'csv' ? 'A exportar CSV...' : 'Exportar CSV'}</button>
        <button
          onClick={handleExportExcel}
          disabled={exportingFormat !== null}
          className="text-sm px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >{exportingFormat === 'excel' ? 'A exportar Excel...' : 'Exportar Excel'}</button>
        <button
          onClick={handleExportPDF}
          disabled={exportingFormat !== null}
          className="text-sm px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >{exportingFormat === 'pdf' ? 'A exportar PDF...' : 'Exportar PDF'}</button>
        <button
          onClick={handleDesmarcarTodos}
          className="text-sm px-3 py-1.5 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
        >Cancelar todos</button>
        <button
          onClick={() => setShowAdvancedPanels(!showAdvancedPanels)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          {showAdvancedPanels ? 'Ocultar avançado' : 'Ver avançado'}
        </button>
      </div>
    </div>
  );
}

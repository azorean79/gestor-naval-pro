import React from 'react';
import NavioPremiumDossierClient from './NavioPremiumDossierClient';

export default async function NavioDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = isNaN(parseInt(id, 10)) ? id : parseInt(id, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-white dark:from-slate-900 dark:via-sky-950 dark:to-slate-900 py-8 print:py-0 print:bg-white print:min-h-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 print:max-w-none print:px-0">
        <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-6 shadow-md flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Dossier do Navio / Frota</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Relatório global de equipamentos de segurança
            </p>
          </div>
        </header>
        <NavioPremiumDossierClient navioId={parsedId} />
      </div>
    </div>
  );
}

import React from 'react';
import ColeteDetailPageClient from './ColeteDetailPageClient';
import { getAuthSession } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ColeteInspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/api/auth/signin');
  }

  // Se o ID não for um número válido, passamos o valor original (ex: 'example-lalizas')
  const parsedId = isNaN(parseInt(id, 10)) ? id : parseInt(id, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-white dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Dossier do Colete</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {parsedId === 'example-lalizas' ? 'Demonstração: Lalizas Sigma' : 
               parsedId === 'example-eval' ? 'Demonstração: EVAL SIMI' : 
               `ID: ${parsedId}`}
            </p>
          </div>
        </header>
        <ColeteDetailPageClient coleteId={parsedId} />
      </div>
    </div>
  );
}

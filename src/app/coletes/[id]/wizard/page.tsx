import React from "react";
import ColeteWizardLoader from "@/modules/ColeteWizard/ColeteWizardLoader";

export const metadata = {
  title: "Inspeção de Colete",
};

export default async function ColeteWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coleteId = parseInt(id, 10);

  if (isNaN(coleteId)) {
    return <div className="p-10 text-red-500">ID de Colete inválido.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-white dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-6 shadow-md flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Inspeção de Colete</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">ID: {coleteId}</p>
          </div>
        </header>
        <ColeteWizardLoader coleteId={coleteId} />
      </div>
    </div>
  );
}

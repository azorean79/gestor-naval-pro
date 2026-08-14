import React from "react";
import FatoImersaoWizardLoader from "@/modules/FatoImersaoWizard/FatoImersaoWizardLoader";

export const metadata = {
  title: "Inspeção Fato de Imersão",
};

export default async function FatoImersaoWizardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fatoId = parseInt(id, 10);
  if (Number.isNaN(fatoId)) {
    return <div className="p-10 text-red-500">ID inválido.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-white dark:from-slate-900 dark:via-cyan-950 dark:to-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg border border-slate-200/50 rounded-2xl p-6 shadow-md">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
            Inspeção · Fato de Imersão
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Checklist Crewsaver/Viking/Lalizas · MSC/Circ.1114 · ID {fatoId}
          </p>
        </header>
        <FatoImersaoWizardLoader fatoId={fatoId} />
      </div>
    </div>
  );
}

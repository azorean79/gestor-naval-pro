"use client";
import React, { useState } from 'react';
import { useColeteWizardStore } from './store/useColeteWizardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckSquare, Wrench, AlertCircle, Camera, CheckCircle, FileText, History, ChevronLeft, ChevronRight, FileCheck, Loader2 } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Dados Gerais', icon: ClipboardList },
  { id: 2, title: 'Checklist', icon: CheckSquare },
  { id: 3, title: 'Componentes', icon: Wrench },
  { id: 4, title: 'Testes', icon: AlertCircle },
  { id: 5, title: 'Evidências', icon: Camera },
  { id: 6, title: 'Resumo Final', icon: CheckCircle },
  { id: 7, title: 'Certificados', icon: FileText },
  { id: 8, title: 'Histórico', icon: History },
];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { currentStep, nextStep, prevStep, setStep, saveInspection, isSaving, inspectionData } = useColeteWizardStore();
  
  // Calcular idade do colete para alerta de 10 anos
  const [idadeExpirada, setIdadeExpirada] = useState(false);
  React.useEffect(() => {
    if (inspectionData?.dataFabrico) {
      const year = parseInt(inspectionData.dataFabrico.substring(0, 4), 10);
      const currentYear = new Date().getFullYear();
      if (!isNaN(year) && (currentYear - year) >= 10) {
        setIdadeExpirada(true);
      } else {
        setIdadeExpirada(false);
      }
    }
  }, [inspectionData?.dataFabrico]);

  const handleFinish = async () => {
    const success = await saveInspection();
    if (success) {
      nextStep(); // avança para o Step 7 (Certificados)
    } else {
      alert("Erro ao gravar a inspecção. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50 relative">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-10 relative">
        <div className="mb-6 hidden lg:block">
          <h2 className="text-xl font-bold text-slate-800">Inspeção</h2>
          <p className="text-sm text-slate-500">Fluxo de inspecção de coletes</p>
        </div>
        
        {idadeExpirada && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-800">Vida Útil Expirada</p>
                <p className="text-xs text-red-600">Este equipamento excedeu os 10 anos desde a data de fabrico.</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="flex-1 overflow-x-auto lg:overflow-visible">
          <ul className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 pb-2 lg:pb-0">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              
              return (
                <li key={step.id} className="relative">
                  {/* Desktop connecting line */}
                  {step.id !== STEPS.length && (
                    <div className={`hidden lg:block absolute left-6 top-10 bottom-[-8px] w-0.5 z-0 ${isPast ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  )}
                  
                  <button
                    onClick={() => setStep(step.id)}
                    className={`relative z-10 flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 text-left ${isActive ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-600 text-white shadow-md' : isPast ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <step.icon size={20} />
                    </div>
                    <div className="hidden lg:block">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>Passo {step.id}</p>
                      <p className={`text-sm font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{step.title}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative max-w-6xl w-full mx-auto">
        {/* Content Wrapper */}
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 min-h-full relative"
            >
              {isSaving && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-700 font-bold">A gravar inspecção...</p>
                  </div>
                </div>
              )}
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <footer className="bg-white border-t border-slate-200 p-4 lg:p-6 flex items-center justify-between shadow-lg z-10 sticky bottom-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">Passo {currentStep} de {STEPS.length}</span>
            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                Seguinte
                <ChevronRight size={20} />
              </button>
            ) : currentStep === 6 ? (
              <button
                onClick={handleFinish}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <FileCheck size={20} />}
                Finalizar Inspecção
              </button>
            ) : (
              <button
                onClick={nextStep}
                disabled={currentStep === STEPS.length || isSaving}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-900 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                Avançar
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

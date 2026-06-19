"use client";
import React from 'react';
import { useJangadaWizardStore } from './store/useJangadaWizardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckSquare, Wrench, Package, Cylinder, AlertCircle, FileCheck, ChevronLeft, ChevronRight, CheckCircle, FileText, History } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 1, title: 'Dados Gerais', icon: ClipboardList },
  { id: 2, title: 'Checklist', icon: CheckSquare },
  { id: 3, title: 'Componentes', icon: Wrench },
  { id: 4, title: 'Equipamento (Pack)', icon: Package },
  { id: 5, title: 'Cilindros', icon: Cylinder },
  { id: 6, title: 'Testes', icon: AlertCircle },
  { id: 7, title: 'Resumo Final', icon: CheckCircle },
  { id: 8, title: 'Certificados', icon: FileText },
  { id: 9, title: 'Histórico', icon: History },
];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { currentStep, nextStep, prevStep, setStep } = useJangadaWizardStore();
  const router = useRouter();

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-10 relative">
        <div className="mb-8 hidden lg:block">
          <h2 className="text-xl font-bold text-slate-800">Inspeção</h2>
          <p className="text-sm text-slate-500">Fluxo passo a passo</p>
        </div>
        
        <nav className="flex-1 overflow-x-auto lg:overflow-visible">
          <ul className="flex lg:flex-col gap-2 min-w-max lg:min-w-0 pb-2 lg:pb-0">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              
              return (
                <li key={step.id} className="relative">
                  {/* Desktop connecting line */}
                  {step.id !== 9 && (
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
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <footer className="bg-white border-t border-slate-200 p-4 lg:p-6 flex items-center justify-between shadow-lg z-10 sticky bottom-0">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
            Anterior
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500 hidden sm:inline-block">Passo {currentStep} de 9</span>
            {currentStep < 9 ? (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
              >
                Seguinte
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                onClick={() => router.push('/jangadas')}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
              >
                <FileCheck size={20} />
                Finalizar Inspeção
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

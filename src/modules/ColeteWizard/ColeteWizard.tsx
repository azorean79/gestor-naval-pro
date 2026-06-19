"use client";
import React, { useState } from "react";
import WizardRouter from "./WizardRouter";
import { CheckCircle, Info, Stethoscope, AlertTriangle, Flag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useColeteWizardStore } from "./store/useColeteWizardStore";

const WIZARD_STEPS = [
  { id: 1, title: "Identificação", icon: Info },
  { id: 2, title: "Inspeção Visual", icon: Stethoscope },
  { id: 3, title: "Componentes", icon: AlertTriangle },
  { id: 4, title: "Testes", icon: Flag },
  { id: 5, title: "Resumo e Emissão", icon: CheckCircle },
];

export default function ColeteWizard() {
  const [step, setStep] = useState(1);
  const { coleteId } = useColeteWizardStore();

  return (
    <div className="text-slate-800 dark:text-slate-200">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Progress */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-md border border-slate-200/50 sticky top-8">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 uppercase tracking-wider text-xs">Passos da Inspeção</h3>
            <div className="space-y-2">
              {WIZARD_STEPS.map((s, index) => {
                const Icon = s.icon;
                const isActive = s.id === step;
                const isPast = s.id < step;
                
                return (
                  <button
                    key={s.id}
                    disabled={s.id > step && !isPast}
                    onClick={() => setStep(s.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 text-left border ${
                      isActive 
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900 shadow-sm" 
                        : isPast
                          ? "hover:bg-slate-50/50 dark:hover:bg-slate-700/30 border-transparent"
                          : "opacity-40 cursor-not-allowed border-transparent"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      isActive 
                        ? "bg-indigo-650 border-indigo-600 text-white shadow-md" 
                        : isPast
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500"
                    }`}>
                      {isPast ? <CheckCircle size={18} /> : <Icon size={18} />}
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-indigo-600 dark:text-indigo-400" : isPast ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                        Passo {s.id}
                      </p>
                      <p className={`font-bold text-sm ${isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-600 dark:text-slate-400"}`}>
                        {s.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 lg:p-8 shadow-md border border-slate-200/50">
          <WizardRouter step={step} setStep={setStep} />
        </div>
      </div>
    </div>
  );
}

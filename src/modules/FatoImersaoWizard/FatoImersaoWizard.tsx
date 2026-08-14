"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Info, Stethoscope, Gauge, Flag, Package } from "lucide-react";
import WizardRouter from "./WizardRouter";
import { useFatoImersaoWizardStore } from "./store/useFatoImersaoWizardStore";

const STEPS = [
  { id: 1, title: "Identificação", icon: Info },
  { id: 2, title: "Checklist", icon: Stethoscope },
  { id: 3, title: "Componentes", icon: Package },
  { id: 4, title: "Leak test", icon: Gauge },
  { id: 5, title: "Resumo", icon: Flag },
];

export default function FatoImersaoWizard() {
  const [step, setStep] = useState(1);
  const [highest, setHighest] = useState(1);
  const { inspectionData, isDirty } = useFatoImersaoWizardStore();

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [isDirty]);

  const valid: Record<number, boolean> = {
    1: Boolean(inspectionData.serial),
    2: true,
    3: true,
    4: Boolean(inspectionData.leakResultado || inspectionData.codigoBER),
    5: true,
  };

  const go = (n: number) => {
    if (n > step && !valid[step]) return;
    if (n > highest) setHighest(n);
    setStep(n);
  };

  return (
    <div className="text-slate-800 dark:text-slate-200">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 shadow-md border border-slate-200/50 sticky top-8">
            <h3 className="font-bold text-xs uppercase tracking-wider mb-6 text-slate-500">Passos da inspeção</h3>
            <div className="space-y-2">
              {STEPS.map((s) => {
                const Icon = s.icon;
                const active = s.id === step;
                const past = s.id < step;
                const can = s.id <= highest;
                return (
                  <button
                    key={s.id}
                    disabled={!can}
                    onClick={() => go(s.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                      active
                        ? "bg-cyan-50 border-cyan-100 shadow-sm"
                        : past
                          ? "hover:bg-slate-50 border-transparent"
                          : "opacity-40 cursor-not-allowed border-transparent"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        active
                          ? "bg-cyan-700 border-cyan-700 text-white"
                          : past
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                      }`}
                    >
                      {past ? <CheckCircle size={18} /> : <Icon size={18} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Passo {s.id}</p>
                      <p className="font-bold text-sm">{s.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 lg:p-8 shadow-md border border-slate-200/50">
          <WizardRouter step={step} setStep={go} />
        </div>
      </div>
    </div>
  );
}

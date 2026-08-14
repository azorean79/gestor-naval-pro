"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, Clock } from "lucide-react";

type RaftOption = {
  id: number;
  serial: string;
  brand: string | null;
  model: string | null;
};

export default function PressureTestTimer() {
  const [rafts, setRafts] = useState<RaftOption[]>([]);
  const [selectedRaft, setSelectedRaft] = useState<string>("");
  const [customLabel, setCustomLabel] = useState<string>("");
  
  const [duration, setDuration] = useState<number>(60 * 60); // 60 minutos em segundos
  const [timeLeft, setTimeLeft] = useState<number>(60 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Função para tocar som
  const triggerChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Sequência de bips suaves
      const playBeep = (timeOffset: number, frequency: number, durationSec: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.3, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + durationSec - 0.05);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + durationSec);
      };

      playBeep(0, 523.25, 0.3); // C5
      playBeep(0.4, 659.25, 0.3); // E5
      playBeep(0.8, 783.99, 0.5); // G5
    } catch {
      console.error("Erro ao emitir alerta sonoro.");
    }
  }, [soundEnabled]);

  // Carregar lista de jangadas para seleção
  useEffect(() => {
    async function fetchRafts() {
      try {
        const res = await fetch("/api/jangadas?scope=all");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setRafts(data.map((r: RaftOption) => ({
              id: r.id,
              serial: r.serial,
              brand: r.brand,
              model: r.model
            })));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar jangadas para o cronómetro:", err);
      }
    }
    void fetchRafts();
  }, []);

  // Carregar estado salvo do temporizador
  useEffect(() => {
    const savedTime = localStorage.getItem("pressure_timer_time_left");
    const savedActive = localStorage.getItem("pressure_timer_active");
    const savedTimestamp = localStorage.getItem("pressure_timer_timestamp");
    const savedRaft = localStorage.getItem("pressure_timer_selected_raft");
    const savedCustom = localStorage.getItem("pressure_timer_custom_label");
    const savedDuration = localStorage.getItem("pressure_timer_duration");

    /* eslint-disable react-hooks/set-state-in-effect -- restauro do estado persistido em localStorage (sistema externo) no arranque */
    if (savedDuration) {
      setDuration(Number(savedDuration));
    }
    if (savedRaft) setSelectedRaft(savedRaft);
    if (savedCustom) setCustomLabel(savedCustom);

    if (savedTimestamp && savedActive === "true" && savedTime) {
      const elapsed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
      const remaining = Number(savedTime) - elapsed;
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsActive(true);
      } else {
        setTimeLeft(0);
        setIsActive(false);
        // Tocar som de conclusão imediatamente se terminou enquanto estava fora
        triggerChime();
      }
    } else if (savedTime) {
      setTimeLeft(Number(savedTime));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [triggerChime]);

  // Salvar estado quando muda
  useEffect(() => {
    localStorage.setItem("pressure_timer_time_left", timeLeft.toString());
    localStorage.setItem("pressure_timer_active", isActive.toString());
    localStorage.setItem("pressure_timer_selected_raft", selectedRaft);
    localStorage.setItem("pressure_timer_custom_label", customLabel);
    localStorage.setItem("pressure_timer_duration", duration.toString());
    if (isActive) {
      localStorage.setItem("pressure_timer_timestamp", Date.now().toString());
    } else {
      localStorage.removeItem("pressure_timer_timestamp");
    }
  }, [timeLeft, isActive, selectedRaft, customLabel, duration]);

  // Efeito do temporizador
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            triggerChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, triggerChime]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const changeDuration = (minutes: number) => {
    setIsActive(false);
    const secs = minutes * 60;
    setDuration(secs);
    setTimeLeft(secs);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ":" : ""}${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const percent = ((duration - timeLeft) / duration) * 100;
  const currentRaftText = selectedRaft
    ? rafts.find((r) => r.serial === selectedRaft)
      ? `Jangada: ${selectedRaft}`
      : selectedRaft
    : customLabel || "Sem Identificação";

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
          <span className="p-2 rounded-lg bg-indigo-150 text-indigo-700 border border-indigo-200">
            <Clock size={20} />
          </span>
          Controle de Teste de Pressão (Câmara)
        </h3>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-2 rounded-xl border transition-colors ${
            soundEnabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-400 border-slate-200"
          }`}
          title={soundEnabled ? "Som Ativo" : "Som Mutado"}
        >
          <Volume2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Lado Esquerdo: Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Selecione a Jangada em Teste
            </label>
            <select
              value={selectedRaft}
              onChange={(e) => {
                setSelectedRaft(e.target.value);
                setCustomLabel("");
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">-- Escolher Jangada do Sistema --</option>
              {rafts.map((r) => (
                <option key={r.id} value={r.serial}>
                  {r.serial} - {r.brand} {r.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Ou digite identificação personalizada
            </label>
            <input
              type="text"
              placeholder="Ex: Câmara Superior - Jangada 2026"
              value={customLabel}
              onChange={(e) => {
                setCustomLabel(e.target.value);
                setSelectedRaft("");
              }}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Duração Padrão do Teste
            </label>
            <div className="flex gap-2">
              {[60, 30, 15, 5, 1].map((mins) => (
                <button
                  key={mins}
                  onClick={() => changeDuration(mins)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                    duration === mins * 60
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {mins === 1 ? "1 min" : `${mins}m`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lado Direito: Cronómetro */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100 relative">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Círculo de Progresso */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#e2e8f0"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#4f46e5"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="276.46"
                strokeDashoffset={276.46 - (276.46 * percent) / 100}
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            
            {/* Texto do tempo */}
            <div className="text-center z-10">
              <span className="text-3xl font-black text-slate-800 tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="block text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">
                {timeLeft === 0 ? "Concluído!" : isActive ? "Em Teste" : "Pausado"}
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-4 w-full">
            <button
              onClick={handleStartPause}
              disabled={timeLeft === 0}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                timeLeft === 0
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed border-transparent"
                  : isActive
                  ? "bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/10 border-transparent"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/10 border-transparent"
              }`}
            >
              {isActive ? <Pause size={16} /> : <Play size={16} />}
              {isActive ? "Pausar" : "Iniciar"}
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-sm flex items-center justify-center"
              title="Reiniciar"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          <div className="mt-4 text-center">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              {currentRaftText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

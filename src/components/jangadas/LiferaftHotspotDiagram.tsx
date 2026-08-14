"use client";
import React from "react";
import { Maximize2, Lightbulb } from "lucide-react";
import type { ComponentKey, ComponentStatus, LightType } from "@/types/liferaft-diagram";
import { LIGHT_TYPE_OPTIONS } from "@/types/liferaft-diagram";
import { RaftSvgBody } from "./LiferaftSvgDiagram";
import type { ModelShape } from "./LiferaftSvgDiagram";
import type { JangadaFormData } from "@/app/jangadas/[id]/JangadaDetailPageClient";

type DotStyle = {
  base: string;
  dot: string;
  ping: string;
  label: string;
};

type Props = {
  components: Record<ComponentKey, ComponentStatus>;
  hoveredKey: ComponentKey | null;
  selectedKey: ComponentKey | null;
  onHover: (key: ComponentKey | null) => void;
  onSelect: (key: ComponentKey | null) => void;
  onOpenModal: () => void;
  lightType: LightType;
  lightSt: string;
  dotStyle: (key: ComponentKey) => DotStyle;
  wpSuperiorQueda: string;
  wpInferiorQueda: string;
  jangada: JangadaFormData;
  fmt: (v: unknown, suffix?: string) => string;
  parseApproval: (v?: string | null) => "OK" | "CRITICAL" | "NONE";
  enlarged?: boolean;
  modelShape?: ModelShape;
};

export default function LiferaftHotspotDiagram({
  components,
  hoveredKey,
  selectedKey,
  onHover,
  onSelect,
  onOpenModal,
  lightType,
  lightSt,
  dotStyle,
  wpSuperiorQueda,
  wpInferiorQueda,
  jangada,
  fmt,
  parseApproval,
  enlarged = false,
  modelShape = "generic",
}: Props) {
  const isCanopyActive = hoveredKey === "canopy" || selectedKey === "canopy";
  const isLightActive  = hoveredKey === "exteriorLight" || selectedKey === "exteriorLight";
  const isUpperActive  = hoveredKey === "upperChamber" || selectedKey === "upperChamber";
  const isLowerActive  = hoveredKey === "lowerChamber" || selectedKey === "lowerChamber";
  const isCylActive    = hoveredKey === "cylinder" || selectedKey === "cylinder";
  const isHruActive    = hoveredKey === "hru" || selectedKey === "hru";
  const isPackActive   = hoveredKey === "emergencyPack" || selectedKey === "emergencyPack";
  const isIntLightActive = hoveredKey === "interiorLight" || selectedKey === "interiorLight";
  const isBallastActive  = hoveredKey === "ballastPockets" || selectedKey === "ballastPockets";
  const isAnchorActive   = hoveredKey === "seaAnchor" || selectedKey === "seaAnchor";
  const isGIActive       = hoveredKey === "gasInflation" || selectedKey === "gasInflation";
  const isDLActive       = hoveredKey === "davitLoad" || selectedKey === "davitLoad";
  const isPainterActive  = hoveredKey === "painterLine" || selectedKey === "painterLine";
  const isRadarActive    = hoveredKey === "radarReflector" || selectedKey === "radarReflector";
  const isRampActive     = hoveredKey === "boardingRamp" || selectedKey === "boardingRamp";
  const isRightingActive = hoveredKey === "rightingSystem" || selectedKey === "rightingSystem";

  const getStrokeColor = (status: ComponentStatus["status"], active: boolean) => {
    if (active) {
      return { OK: "#10b981", WARNING: "#f59e0b", CRITICAL: "#f43f5e", NONE: "#94a3b8" }[status];
    }
    return { OK: "#059669", WARNING: "#d97706", CRITICAL: "#e11d48", NONE: "#64748b" }[status];
  };

  const getFillColor = (status: ComponentStatus["status"], active: boolean) => {
    const alpha = active ? "33" : "15";
    return { OK: "#10b981", WARNING: "#f59e0b", CRITICAL: "#ef4444", NONE: "#94a3b8" }[status] + alpha;
  };

  return (
    <div className="relative w-full select-none rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center border border-slate-800" style={{ aspectRatio: "700/560" }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 700 560"
        style={{ overflow: "visible" }}
      >
        <defs>
          <pattern id="techGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.1" />
          </pattern>
          <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff781f" />
            <stop offset="100%" stopColor="#d84b06" />
          </linearGradient>
          <linearGradient id="tubeUpperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#1f2937" />
          </linearGradient>
          <linearGradient id="tubeLowerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>
          <linearGradient id="cylinderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="30%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="rampaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <filter id="neonGlowOk" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neonGlowWarn" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="neonGlowCrit" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="gaugeFace" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="hoseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#1e3a8a" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#172554" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="waterSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="25%" stopColor="#60a5fa" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="75%" stopColor="#60a5fa" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
          <pattern id="wavePattern1" width="120" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-1)">
            <path d="M 0 6 Q 15 0 30 6 Q 45 12 60 6 Q 75 0 90 6 Q 105 12 120 6" fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.25" />
          </pattern>
          <pattern id="wavePattern2" width="180" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(0.5)">
            <path d="M 0 8 Q 20 2 40 8 Q 60 14 80 8 Q 100 2 120 8 Q 140 14 160 8 Q 180 2 180 8" fill="none" stroke="#93c5fd" strokeWidth="0.6" opacity="0.18" />
          </pattern>
          <pattern id="wavePattern3" width="200" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-0.3)">
            <path d="M 0 10 Q 25 4 50 10 Q 75 16 100 10 Q 125 4 150 10 Q 175 16 200 10" fill="none" stroke="#bfdbfe" strokeWidth="0.5" opacity="0.12" />
          </pattern>
          <radialGradient id="raftShadow" cx="50%" cy="0%" rx="50%" ry="100%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#000" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="chamberRibGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6b7280" stopOpacity="0" />
            <stop offset="30%" stopColor="#9ca3af" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#d1d5db" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#9ca3af" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6b7280" stopOpacity="0" />
          </linearGradient>
          <clipPath id="upperClip">
            <ellipse cx="350" cy="342" rx="220" ry="24" />
          </clipPath>
          <clipPath id="lowerClip">
            <ellipse cx="350" cy="382" rx="220" ry="24" />
          </clipPath>
        </defs>

        <rect width="100%" height="100%" fill="url(#techGrid)" />
        <circle cx="350" cy="360" r="260" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="3,6" opacity="0.4" />
        <circle cx="350" cy="360" r="160" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.3" />
        <ellipse cx="350" cy="422" rx="180" ry="12" fill="url(#raftShadow)" pointerEvents="none" />
        <rect x="0" y="418" width="700" height="142" fill="url(#waterGrad)" />
        <rect x="0" y="418" width="700" height="142" fill="url(#wavePattern1)" opacity="0.9">
          <animateTransform attributeName="transform" type="translate" values="0,0; 8,0; 0,0" dur="4s" repeatCount="indefinite" />
        </rect>
        <rect x="0" y="430" width="700" height="130" fill="url(#wavePattern2)" opacity="0.7">
          <animateTransform attributeName="transform" type="translate" values="0,0; -12,0; 0,0" dur="6s" repeatCount="indefinite" />
        </rect>
        <rect x="0" y="445" width="700" height="115" fill="url(#wavePattern3)" opacity="0.5">
          <animateTransform attributeName="transform" type="translate" values="0,0; 5,0; 0,0" dur="8s" repeatCount="indefinite" />
        </rect>
        <path d="M 0 420 Q 50 416 100 420 Q 150 424 200 420 Q 250 416 300 420 Q 350 424 400 420 Q 450 416 500 420 Q 550 424 600 420 Q 650 416 700 420" fill="none" stroke="#93c5fd" strokeWidth="1" opacity="0.3">
          <animateTransform attributeName="transform" type="translate" values="0,0; 6,0; 0,0" dur="3s" repeatCount="indefinite" />
        </path>
        <line x1="0" y1="418" x2="700" y2="418" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="8,4" opacity="0.4" />
        <text x="680" y="432" fill="#60a5fa" fontSize="9" fontWeight="bold" textAnchor="end" opacity="0.5">NÍVEL MAR</text>

        {/* ─── Model-Specific Raft Body (background layer) ─── */}
        <g opacity="0.15" pointerEvents="none" transform="translate(175, 240) scale(0.55)">
          <RaftSvgBody shape={modelShape} />
        </g>

        {/* ─── Inflation Hose ─── */}
        <g opacity="0.7" pointerEvents="none">
          <rect x="415" y="399" width="10" height="8" fill="#475569" transform="rotate(-8 425 398)" />
          <circle cx="413" cy="403" r="3.5" fill="#f43f5e" transform="rotate(-8 425 398)" />
          <path d="M 413 403 Q 380 395 350 390 Q 310 385 280 370" fill="none" stroke="url(#hoseGrad)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="280" cy="370" r="5" fill="#475569" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 280 370 Q 280 358 280 342" fill="none" stroke="url(#hoseGrad)" strokeWidth="3" strokeLinecap="round" />
          <path d="M 280 370 Q 280 376 280 382" fill="none" stroke="url(#hoseGrad)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="280" cy="342" r="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          <circle cx="280" cy="382" r="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
        </g>

        {/* ─── WP Pressure Gauges ─── */}
        <g opacity="0.85" pointerEvents="none">
          {/* Upper Chamber Gauge */}
          <g>
            <path d={`M 165 310 L 250 ${342}`} fill="none" stroke={components.upperChamber.status === "OK" ? "#10b981" : components.upperChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
            <circle cx="130" cy="280" r="28" fill="url(#gaugeFace)" stroke="#475569" strokeWidth="2" />
            <circle cx="130" cy="280" r="24" fill="none" stroke="#334155" strokeWidth="0.5" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = -120 + i * 48;
              const rad = (angle * Math.PI) / 180;
              return <line key={`ug${i}`} x1={130 + Math.cos(rad) * 18} y1={280 + Math.sin(rad) * 18} x2={130 + Math.cos(rad) * 22} y2={280 + Math.sin(rad) * 22} stroke="#64748b" strokeWidth="1" />;
            })}
            {(() => {
              const needleAngle = components.upperChamber.status === "OK" ? -30 : components.upperChamber.status === "CRITICAL" ? 60 : 0;
              const rad = (needleAngle * Math.PI) / 180;
              return (<><line x1="130" y1="280" x2={130 + Math.cos(rad) * 16} y2={280 + Math.sin(rad) * 16} stroke={components.upperChamber.status === "OK" ? "#10b981" : components.upperChamber.status === "CRITICAL" ? "#ef4444" : "#f59e0b"} strokeWidth="2" strokeLinecap="round" /><circle cx="130" cy="280" r="3" fill="#ef4444" /></>);
            })()}
            <text x="130" y="310" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">WP SUP.</text>
            <text x="130" y="320" fill={components.upperChamber.status === "OK" ? "#10b981" : components.upperChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} fontSize="7" fontWeight="bold" textAnchor="middle">{wpSuperiorQueda || "N/D"}</text>
          </g>
          {/* Lower Chamber Gauge */}
          <g>
            <path d={`M 165 310 L 250 ${382}`} fill="none" stroke={components.lowerChamber.status === "OK" ? "#10b981" : components.lowerChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
            <circle cx="130" cy="350" r="28" fill="url(#gaugeFace)" stroke="#475569" strokeWidth="2" />
            <circle cx="130" cy="350" r="24" fill="none" stroke="#334155" strokeWidth="0.5" />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = -120 + i * 48;
              const rad = (angle * Math.PI) / 180;
              return <line key={`lg${i}`} x1={130 + Math.cos(rad) * 18} y1={350 + Math.sin(rad) * 18} x2={130 + Math.cos(rad) * 22} y2={350 + Math.sin(rad) * 22} stroke="#64748b" strokeWidth="1" />;
            })}
            {(() => {
              const needleAngle = components.lowerChamber.status === "OK" ? -30 : components.lowerChamber.status === "CRITICAL" ? 60 : 0;
              const rad = (needleAngle * Math.PI) / 180;
              return (<><line x1="130" y1="350" x2={130 + Math.cos(rad) * 16} y2={350 + Math.sin(rad) * 16} stroke={components.lowerChamber.status === "OK" ? "#10b981" : components.lowerChamber.status === "CRITICAL" ? "#ef4444" : "#f59e0b"} strokeWidth="2" strokeLinecap="round" /><circle cx="130" cy="350" r="3" fill="#ef4444" /></>);
            })()}
            <text x="130" y="380" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">WP INF.</text>
            <text x="130" y="390" fill={components.lowerChamber.status === "OK" ? "#10b981" : components.lowerChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} fontSize="7" fontWeight="bold" textAnchor="middle">{wpInferiorQueda || "N/D"}</text>
          </g>
        </g>

        {/* ─── HRU ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("hru")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "hru" ? null : "hru"); }}>
          <line x1="9%" y1="18%" x2="35%" y2="28%" stroke={isHruActive ? "#3b82f6" : "#475569"} strokeWidth={isHruActive ? "2.5" : "1.5"} strokeDasharray="4,3" opacity={isHruActive ? "0.85" : "0.5"} className="transition-all" />
          <rect x="25" y="65" width="85" height="75" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <circle cx="67" cy="100" r="22" fill={getFillColor(components.hru.status, isHruActive)} stroke={getStrokeColor(components.hru.status, isHruActive)} strokeWidth={isHruActive ? 3.5 : 2} filter={isHruActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <circle cx="67" cy="100" r="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
          <path d="M 67 80 L 67 120 M 47 100 L 87 100" stroke="#334155" strokeWidth="1" opacity="0.4" />
        </g>

        {/* ─── emergencyPack ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("emergencyPack")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "emergencyPack" ? null : "emergencyPack"); }}>
          <rect x="250" y="370" width="65" height="40" rx="8" fill={getFillColor(components.emergencyPack.status, isPackActive)} stroke={getStrokeColor(components.emergencyPack.status, isPackActive)} strokeWidth={isPackActive ? 3.5 : 2} transform="rotate(6 250 370)" filter={isPackActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <path d="M 270 372 L 270 408 M 295 375 L 295 411" stroke="#475569" strokeWidth="2.5" opacity="0.6" transform="rotate(6 250 370)" />
          <circle cx="282" cy="390" r="4" fill="#334155" opacity="0.7" transform="rotate(6 250 370)" />
        </g>

        {/* ─── canopy ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("canopy")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "canopy" ? null : "canopy"); }}>
          <path d="M 140 330 C 140 170, 560 170, 560 330 Z" fill="url(#canopyGrad)" fillOpacity={isCanopyActive ? 0.95 : 0.85} stroke={getStrokeColor(components.canopy.status, isCanopyActive)} strokeWidth={isCanopyActive ? 3.5 : 1.8} filter={isCanopyActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <path d="M 350 172 Q 350 250 350 330" fill="none" stroke="#7c2d12" strokeWidth="2" opacity="0.35" />
          <path d="M 235 200 Q 280 260 310 330" fill="none" stroke="#7c2d12" strokeWidth="1.5" opacity="0.3" />
          <path d="M 465 200 Q 420 260 390 330" fill="none" stroke="#7c2d12" strokeWidth="1.5" opacity="0.3" />
          <path d="M 140 330 Q 350 310 560 330" fill="none" stroke="#7c2d12" strokeWidth="2" opacity="0.3" />
          <path d="M 310 330 C 310 260, 390 260, 390 330" fill="#334155" fillOpacity="0.4" stroke="#7c2d12" strokeWidth="1.5" opacity="0.5" />
        </g>

        {/* ─── exteriorLight ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("exteriorLight")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "exteriorLight" ? null : "exteriorLight"); }}>
          {lightType !== "none" && (<><circle cx="350" cy="172" r={isLightActive ? "38" : "28"} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="4,6" className="animate-spin" style={{ animationDuration: "12s" }} opacity={isLightActive ? "0.85" : "0.5"} /><circle cx="350" cy="172" r="15" fill="#fef08a" filter="url(#neonGlowOk)" className="animate-pulse" opacity="0.8" /></>)}
          <circle cx="350" cy="172" r="7" fill={getFillColor(components.exteriorLight.status, isLightActive)} stroke={getStrokeColor(components.exteriorLight.status, isLightActive)} strokeWidth={isLightActive ? 3.5 : 2} className="transition-all" />
          <rect x="345" y="177" width="10" height="6" fill="#1e293b" rx="1" />
        </g>

        {/* ─── interiorLight ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("interiorLight")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "interiorLight" ? null : "interiorLight"); }}>
          {isIntLightActive && <circle cx="265" cy="225" r="25" fill="#fef08a" opacity="0.25" filter="url(#neonGlowOk)" />}
          <circle cx="265" cy="225" r="6.5" fill={getFillColor(components.interiorLight.status, isIntLightActive)} stroke={getStrokeColor(components.interiorLight.status, isIntLightActive)} strokeWidth={isIntLightActive ? 3.5 : 2} className="transition-all" />
          <path d="M 263 223 L 267 227 M 267 223 L 263 227" stroke="#eab308" strokeWidth="1" />
        </g>

        {/* ─── upperChamber ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("upperChamber")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "upperChamber" ? null : "upperChamber"); }}>
          <ellipse cx="350" cy="342" rx="225" ry="26" fill="url(#tubeUpperGrad)" fillOpacity={isUpperActive ? 0.95 : 0.85} stroke={getStrokeColor(components.upperChamber.status, isUpperActive)} strokeWidth={isUpperActive ? 3.5 : 1.8} filter={isUpperActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <ellipse cx="350" cy="342" rx="215" ry="12" fill="none" stroke="#9ca3af" strokeWidth="0.5" opacity="0.15" />
          <g clipPath="url(#upperClip)" opacity="0.3">
            {[160, 200, 240, 280, 320, 360, 400, 440, 480, 520].map((x) => (<line key={`ur${x}`} x1={x} y1={318} x2={x} y2={366} stroke="url(#chamberRibGrad)" strokeWidth="1.5" />))}
          </g>
          <circle cx="350" cy="342" r="4" fill={components.upperChamber.status === "OK" ? "#10b981" : components.upperChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} opacity="0.8" />
          <text x="350" y="336" fill="#d1d5db" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.6">CÂMARA SUPERIOR</text>
        </g>

        {/* ─── lowerChamber ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("lowerChamber")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "lowerChamber" ? null : "lowerChamber"); }}>
          <ellipse cx="350" cy="382" rx="225" ry="26" fill="url(#tubeLowerGrad)" fillOpacity={isLowerActive ? 0.95 : 0.85} stroke={getStrokeColor(components.lowerChamber.status, isLowerActive)} strokeWidth={isLowerActive ? 3.5 : 1.8} filter={isLowerActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <ellipse cx="350" cy="382" rx="215" ry="12" fill="none" stroke="#6b7280" strokeWidth="0.5" opacity="0.15" />
          <g clipPath="url(#lowerClip)" opacity="0.3">
            {[160, 200, 240, 280, 320, 360, 400, 440, 480, 520].map((x) => (<line key={`lr${x}`} x1={x} y1={358} x2={x} y2={406} stroke="url(#chamberRibGrad)" strokeWidth="1.5" />))}
          </g>
          <circle cx="350" cy="382" r="4" fill={components.lowerChamber.status === "OK" ? "#10b981" : components.lowerChamber.status === "CRITICAL" ? "#ef4444" : "#64748b"} opacity="0.8" />
          <text x="350" y="376" fill="#9ca3af" fontSize="8" fontWeight="bold" textAnchor="middle" opacity="0.5">CÂMARA INFERIOR</text>
        </g>

        {/* ─── cylinder ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("cylinder")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "cylinder" ? null : "cylinder"); }}>
          <rect x="425" y="398" width="80" height="20" rx="10" fill={getFillColor(components.cylinder.status, isCylActive)} stroke={getStrokeColor(components.cylinder.status, isCylActive)} strokeWidth={isCylActive ? 3.5 : 2} transform="rotate(-8 425 398)" filter={isCylActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <rect x="440" y="395" width="50" height="4" rx="2" fill="#334155" opacity="0.4" transform="rotate(-8 425 398)" />
          <text x="465" y="410" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle" opacity="0.5" transform="rotate(-8 425 398)">CO₂</text>
        </g>

        {/* ─── ballastPockets ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("ballastPockets")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "ballastPockets" ? null : "ballastPockets"); }}>
          <path d="M 175 408 L 195 442 L 155 442 Z" fill={getFillColor(components.ballastPockets.status, isBallastActive)} stroke={getStrokeColor(components.ballastPockets.status, isBallastActive)} strokeWidth={isBallastActive ? 3.5 : 1.8} filter={isBallastActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <path d="M 525 408 L 545 442 L 505 442 Z" fill={getFillColor(components.ballastPockets.status, isBallastActive)} stroke={getStrokeColor(components.ballastPockets.status, isBallastActive)} strokeWidth={isBallastActive ? 3.5 : 1.8} filter={isBallastActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <line x1="160" y1="430" x2="190" y2="430" stroke="#1d4ed8" strokeWidth="1" opacity="0.3" />
          <line x1="510" y1="430" x2="540" y2="430" stroke="#1d4ed8" strokeWidth="1" opacity="0.3" />
        </g>

        {/* ─── seaAnchor ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("seaAnchor")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "seaAnchor" ? null : "seaAnchor"); }}>
          <line x1="55" y1="385" x2="160" y2="382" stroke={isAnchorActive ? "#b45309" : "#475569"} strokeWidth={isAnchorActive ? 2.5 : 1.2} strokeDasharray="4,2" opacity={isAnchorActive ? 0.95 : 0.45} className="transition-all" />
          <path d="M 20 365 L 55 385 L 20 405 Z" fill={getFillColor(components.seaAnchor.status, isAnchorActive)} stroke={getStrokeColor(components.seaAnchor.status, isAnchorActive)} strokeWidth={isAnchorActive ? 3.5 : 2} filter={isAnchorActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <line x1="20" y1="365" x2="8" y2="385" stroke="#78350f" strokeWidth="1.2" opacity="0.4" />
          <line x1="20" y1="405" x2="8" y2="385" stroke="#78350f" strokeWidth="1.2" opacity="0.4" />
        </g>

        {/* ─── gasInflation ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("gasInflation")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "gasInflation" ? null : "gasInflation"); }}>
          <circle cx="280" cy="370" r="12" fill={getFillColor(components.gasInflation.status, isGIActive)} stroke={getStrokeColor(components.gasInflation.status, isGIActive)} strokeWidth={isGIActive ? 3 : 1.5} filter={isGIActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <circle cx="276" cy="367" r="2" fill="#fbbf24" opacity="0.7" />
          <circle cx="283" cy="372" r="1.5" fill="#fbbf24" opacity="0.6" />
          <circle cx="279" cy="374" r="1.8" fill="#fbbf24" opacity="0.5" />
          <text x="280" y="395" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" opacity="0.6">GI</text>
        </g>

        {/* ─── davitLoad ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("davitLoad")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "davitLoad" ? null : "davitLoad"); }}>
          <path d="M 490 150 L 490 195 L 530 195" fill="none" stroke={getStrokeColor(components.davitLoad.status, isDLActive)} strokeWidth={isDLActive ? 3 : 2} strokeLinecap="round" className="transition-all" />
          <circle cx="490" cy="195" r="4" fill="#334155" stroke={getStrokeColor(components.davitLoad.status, isDLActive)} strokeWidth="1.5" />
          <path d="M 528 195 L 530 205 L 535 205" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          <line x1="530" y1="195" x2="480" y2="330" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
        </g>

        {/* ─── painterLine ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("painterLine")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "painterLine" ? null : "painterLine"); }}>
          <path d="M 90 115 Q 100 200 120 280 Q 130 310 140 330" fill="none" stroke={isPainterActive ? "#d97706" : "#a16207"} strokeWidth={isPainterActive ? 3 : 2} strokeDasharray="6,3" opacity={isPainterActive ? 0.9 : 0.6} className="transition-all" />
          <circle cx="95" cy="145" r="1.5" fill="#a16207" opacity="0.5" />
          <circle cx="105" cy="200" r="1.5" fill="#a16207" opacity="0.5" />
          <circle cx="118" cy="260" r="1.5" fill="#a16207" opacity="0.5" />
          <circle cx="140" cy="330" r="4" fill="none" stroke="#a16207" strokeWidth="1.5" opacity="0.7" />
        </g>

        {/* ─── radarReflector ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("radarReflector")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "radarReflector" ? null : "radarReflector"); }}>
          <path d="M 570 200 L 585 180 L 600 200 L 585 220 Z" fill={getFillColor(components.radarReflector.status, isRadarActive)} stroke={getStrokeColor(components.radarReflector.status, isRadarActive)} strokeWidth={isRadarActive ? 3 : 1.5} filter={isRadarActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <line x1="585" y1="180" x2="585" y2="220" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
          <line x1="570" y1="200" x2="600" y2="200" stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
          <line x1="570" y1="200" x2="530" y2="220" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
        </g>

        {/* ─── boardingRamp ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("boardingRamp")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "boardingRamp" ? null : "boardingRamp"); }}>
          <path d="M 285 382 C 300 405, 400 405, 415 382 L 445 460 C 420 482, 280 482, 255 460 Z" fill={getFillColor(components.boardingRamp.status, isRampActive)} fillOpacity={isRampActive ? 0.7 : 0.5} stroke={getStrokeColor(components.boardingRamp.status, isRampActive)} strokeWidth={isRampActive ? 3 : 1.5} filter={isRampActive ? "url(#neonGlowOk)" : undefined} className="transition-all" />
          <line x1="315" y1="382" x2="305" y2="470" stroke="#7c2d12" strokeWidth="2" opacity="0.4" />
          <line x1="350" y1="382" x2="350" y2="473" stroke="#7c2d12" strokeWidth="2.5" opacity="0.4" />
          <line x1="385" y1="382" x2="395" y2="470" stroke="#7c2d12" strokeWidth="2" opacity="0.4" />
          {[410, 425, 440, 455].map((y, i) => (<line key={`rr${i}`} x1={305 + i * 3} y1={y} x2={395 - i * 3} y2={y} stroke="#d1d5db" strokeWidth="2" opacity="0.6" strokeLinecap="round" />))}
          <path d="M 300 390 Q 295 420 290 455" fill="none" stroke="#a16207" strokeWidth="1.5" opacity="0.5" />
          <path d="M 400 390 Q 405 420 410 455" fill="none" stroke="#a16207" strokeWidth="1.5" opacity="0.5" />
          <circle cx="300" cy="390" r="2" fill="#a16207" opacity="0.5" />
          <circle cx="400" cy="390" r="2" fill="#a16207" opacity="0.5" />
        </g>

        {/* ─── Dynamic Relief Valves ─── */}
        {(() => {
          const valveSt = parseApproval(jangada.valvulasAlivio);
          const vColor = valveSt === "OK" ? "#10b981" : valveSt === "CRITICAL" ? "#ef4444" : "#f43f5e";
          return (<><circle cx="210" cy="382" r="6" fill={vColor} stroke={valveSt === "OK" ? "#059669" : "#991b1b"} strokeWidth="1.5" opacity="0.9" /><circle cx="490" cy="382" r="6" fill={vColor} stroke={valveSt === "OK" ? "#059669" : "#991b1b"} strokeWidth="1.5" opacity="0.9" />{valveSt === "OK" && (<><text x="210" y="385" fill="white" fontSize="5" fontWeight="bold" textAnchor="middle">✓</text><text x="490" y="385" fill="white" fontSize="5" fontWeight="bold" textAnchor="middle">✓</text></>)}</>);
        })()}

        {/* ─── rightingSystem ─── */}
        <g className="pointer-events-auto cursor-pointer" onMouseEnter={() => onHover("rightingSystem")} onMouseLeave={() => onHover(null)} onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === "rightingSystem" ? null : "rightingSystem"); }}>
          <path d="M 320 408 Q 335 430 350 440 Q 365 430 380 408" fill="none" stroke={isRightingActive ? "#3b82f6" : "#475569"} strokeWidth={isRightingActive ? 3 : 2} strokeDasharray="4,2" opacity={isRightingActive ? 0.9 : 0.5} className="transition-all" />
          <circle cx="320" cy="408" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
          <circle cx="380" cy="408" r="3" fill="#334155" stroke="#64748b" strokeWidth="1" />
          <circle cx="350" cy="440" r="4" fill="none" stroke={isRightingActive ? "#3b82f6" : "#64748b"} strokeWidth="1.5" />
        </g>

        {/* ─── ID Strip ─── */}
        <g opacity="0.7" pointerEvents="none">
          <rect x="200" y="393" width="300" height="12" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.5" />
          <text x="350" y="402" fill="#d1d5db" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{fmt(jangada.brand)} · {fmt(jangada.model)} · SN: {fmt(jangada.serial)}</text>
        </g>
        {jangada.fabricType && (
          <g opacity="0.6" pointerEvents="none">
            <rect x="540" y="388" width="30" height="10" rx="2" fill={jangada.fabricType === "PU" ? "#059669" : jangada.fabricType === "PVC" ? "#d97706" : "#475569"} />
            <text x="555" y="396" fill="white" fontSize="6" fontWeight="bold" textAnchor="middle">{jangada.fabricType}</text>
          </g>
        )}
      </svg>

      {/* Hotspots overlay */}
      {(Object.keys(components) as ComponentKey[]).map((key) => {
        const comp = components[key];
        const [left, top] = comp.pos;
        const styles = dotStyle(key);
        const isActive = hoveredKey === key || selectedKey === key;
        const ringSize = enlarged ? "w-10 h-10" : "w-8 h-8";
        const dotSize  = enlarged ? "w-4 h-4"   : "w-3 h-3";

        return (
          <button
            key={key}
            title={comp.label}
            style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)" }}
            className="absolute flex flex-col items-center group z-10 focus:outline-none"
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => { e.stopPropagation(); onSelect(selectedKey === key ? null : key); }}
          >
            {comp.external && (
              <span className="mb-0.5 text-[9px] font-black text-orange-600 bg-white/90 border border-orange-300 px-1 rounded shadow whitespace-nowrap">
                HRU — EXT.
              </span>
            )}
            <div className={`flex items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer shadow-md ${ringSize} ${styles.base} ${isActive ? "scale-125 shadow-lg" : ""}`}>
              {!isActive && (
                <span className={`absolute inline-flex rounded-full opacity-40 animate-ping ${ringSize} ${styles.ping}`} />
              )}
              <span className={`relative rounded-full ${dotSize} ${styles.dot} z-10`} />
            </div>
            <span className={`mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black whitespace-nowrap shadow pointer-events-none transition-all duration-150 ${styles.label} text-white ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"}`}>
              {comp.icon} {comp.label.split(" ")[0]}
            </span>
          </button>
        );
      })}

      {/* Zoom button */}
      {!enlarged && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenModal(); }}
          title="Ampliar diagrama"
          className="absolute top-2.5 right-2.5 z-20 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-xl p-2 shadow-md transition-all hover:scale-110 flex items-center justify-center"
        >
          <Maximize2 size={14} />
        </button>
      )}

      {/* Light type badge */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-1.5 shadow text-[10px] font-bold text-slate-200">
        <Lightbulb size={12} className={lightSt === "OK" ? "text-emerald-400" : lightSt === "WARNING" ? "text-amber-400" : "text-rose-400"} />
        <span>{LIGHT_TYPE_OPTIONS.find(o => o.value === lightType)?.label ?? "Luz"}</span>
      </div>
    </div>
  );
}

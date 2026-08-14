"use client";
import React from "react";
import { Maximize2 } from "lucide-react";
import type { ComponentKey, ComponentStatus } from "@/types/lifejacket-diagram";
import type { Colete } from "@prisma/client";
import { dotStyle, getStrokeColor, getFillColor } from "@/lib/lifejacket-diagram-helpers";

type LifejacketDiagramHotspotsProps = {
  components: Record<ComponentKey, ComponentStatus>;
  colete: Colete;
  hoveredKey: ComponentKey | null;
  selectedKey: ComponentKey | null;
  onHoveredKeyChange: (key: ComponentKey | null) => void;
  onSelectedKeyChange: (key: ComponentKey | null) => void;
  onZoomRequest: () => void;
  enlarged?: boolean;
};

export default function LifejacketDiagramHotspots({
  components,
  colete,
  hoveredKey,
  selectedKey,
  onHoveredKeyChange,
  onSelectedKeyChange,
  onZoomRequest,
  enlarged = false,
}: LifejacketDiagramHotspotsProps) {
  const isChamberActive = hoveredKey === "chamber" || selectedKey === "chamber";
  const isCylActive     = hoveredKey === "cylinder" || selectedKey === "cylinder";
  const isInfActive     = hoveredKey === "inflator" || selectedKey === "inflator";
  const isLightActive   = hoveredKey === "light" || selectedKey === "light";
  const isWhistleActive = hoveredKey === "whistle" || selectedKey === "whistle";

  return (
    <div className="relative w-full select-none rounded-2xl overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center border border-slate-800" style={{ aspectRatio: "1/1" }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 500 550"
        style={{ overflow: "visible" }}
      >
        <defs>
          <pattern id="lifeGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" opacity="0.08" />
          </pattern>
          <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="75%" stopColor="#dc5312" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="fabricGradL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="fabricGradR" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="50%" stopColor="#dc5312" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="cylMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="30%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#f3f4f6" />
            <stop offset="70%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
          <linearGradient id="cylCapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id="strapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="retroTape" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="30%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3" />
          </filter>
          <filter id="innerShadow">
            <feOffset dx="0" dy="2" />
            <feGaussianBlur stdDeviation="2" />
            <feComposite operator="out" in="SourceGraphic" />
            <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
            <feComposite operator="over" in2="SourceGraphic" />
          </filter>
          <pattern id="fabricTexture" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="transparent" />
            <circle cx="1" cy="1" r="0.3" fill="rgba(0,0,0,0.04)" />
            <circle cx="3" cy="3" r="0.3" fill="rgba(0,0,0,0.04)" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#lifeGrid)" />
        <circle cx="250" cy="260" r="220" fill="none" stroke="#334155" strokeWidth="0.4" strokeDasharray="3,8" opacity="0.25" />
        <circle cx="250" cy="260" r="150" fill="none" stroke="#334155" strokeWidth="0.4" strokeDasharray="2,6" opacity="0.18" />

        <path d="M 130 380 Q 140 395, 250 400 Q 360 395, 370 380" fill="none" stroke="url(#strapGrad)" strokeWidth="10" strokeLinecap="round" opacity="0.7" />
        <path d="M 130 380 Q 140 395, 250 400 Q 360 395, 370 380" fill="none" stroke="#475569" strokeWidth="8" strokeLinecap="round" opacity="0.15" />

        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("chamber")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "chamber" ? null : "chamber"); }}
        >
          <path
            d="M 200 115 C 185 85, 155 90, 145 115 L 125 230 C 110 310, 100 370, 125 430 C 145 475, 195 490, 225 470 C 235 465, 240 440, 235 410 L 215 240 Z"
            fill="rgba(0,0,0,0.15)"
            transform="translate(3, 4)"
          />
          <path
            d="M 200 115 C 185 85, 155 90, 145 115 L 125 230 C 110 310, 100 370, 125 430 C 145 475, 195 490, 225 470 C 235 465, 240 440, 235 410 L 215 240 Z"
            fill="url(#fabricGradL)"
            fillOpacity={isChamberActive ? 0.98 : 0.88}
            stroke={getStrokeColor(components.chamber.status, isChamberActive)}
            strokeWidth={isChamberActive ? 3 : 1.5}
            filter={isChamberActive ? "url(#neonGlow)" : "url(#softShadow)"}
            className="transition-all duration-300"
          />
          <path
            d="M 200 115 C 185 85, 155 90, 145 115 L 125 230 C 110 310, 100 370, 125 430 C 145 475, 195 490, 225 470 C 235 465, 240 440, 235 410 L 215 240 Z"
            fill="url(#fabricTexture)" opacity="0.6"
          />
          <path d="M 160 180 C 165 200, 155 260, 148 310" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,3" />
          <path d="M 180 160 C 178 200, 170 270, 160 340" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,3" />
        </g>

        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("chamber")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "chamber" ? null : "chamber"); }}
        >
          <path
            d="M 300 115 C 315 85, 345 90, 355 115 L 375 230 C 390 310, 400 370, 375 430 C 355 475, 305 490, 275 470 C 265 465, 260 440, 265 410 L 285 240 Z"
            fill="rgba(0,0,0,0.15)"
            transform="translate(3, 4)"
          />
          <path
            d="M 300 115 C 315 85, 345 90, 355 115 L 375 230 C 390 310, 400 370, 375 430 C 355 475, 305 490, 275 470 C 265 465, 260 440, 265 410 L 285 240 Z"
            fill="url(#fabricGradR)"
            fillOpacity={isChamberActive ? 0.98 : 0.88}
            stroke={getStrokeColor(components.chamber.status, isChamberActive)}
            strokeWidth={isChamberActive ? 3 : 1.5}
            filter={isChamberActive ? "url(#neonGlow)" : "url(#softShadow)"}
            className="transition-all duration-300"
          />
          <path
            d="M 300 115 C 315 85, 345 90, 355 115 L 375 230 C 390 310, 400 370, 375 430 C 355 475, 305 490, 275 470 C 265 465, 260 440, 265 410 L 285 240 Z"
            fill="url(#fabricTexture)" opacity="0.6"
          />
          <path d="M 340 180 C 335 200, 345 260, 352 310" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,3" />
          <path d="M 320 160 C 322 200, 330 270, 340 340" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" strokeDasharray="4,3" />
        </g>

        <ellipse cx="250" cy="108" rx="52" ry="18" fill="#1c1917" opacity="0.6" />
        <ellipse cx="250" cy="108" rx="48" ry="14" fill="#292524" opacity="0.3" />

        <path d="M 205 110 Q 250 85, 295 110" fill="none" stroke="url(#strapGrad)" strokeWidth="8" strokeLinecap="round" opacity="0.5" />

        <rect x="130" y="175" width="30" height="14" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" transform="rotate(-12 145 182)" opacity="0.9" />
        <rect x="115" y="290" width="32" height="14" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" opacity="0.9" />
        <rect x="125" y="380" width="28" height="12" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" opacity="0.9" />
        <rect x="340" y="175" width="30" height="14" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" transform="rotate(12 355 182)" opacity="0.9" />
        <rect x="353" y="290" width="32" height="14" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" opacity="0.9" />
        <rect x="347" y="380" width="28" height="12" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" opacity="0.9" />
        <rect x="175" y="120" width="25" height="10" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" transform="rotate(-20 187 125)" opacity="0.8" />
        <rect x="300" y="120" width="25" height="10" rx="2" fill="url(#retroTape)" stroke="#94a3b8" strokeWidth="0.5" transform="rotate(20 312 125)" opacity="0.8" />

        <rect x="235" y="96" width="30" height="14" rx="3" fill="#475569" stroke="#334155" strokeWidth="1" />
        <rect x="240" y="99" width="20" height="8" rx="2" fill="#64748b" />
        <circle cx="250" cy="103" r="2" fill="#94a3b8" />

        <path d="M 215 410 L 250 415 L 285 410" fill="none" stroke="url(#strapGrad)" strokeWidth="6" strokeLinecap="round" />
        <rect x="240" y="407" width="20" height="12" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
        <rect x="244" y="410" width="12" height="6" rx="1" fill="#64748b" />

        {colete.temLuz !== false && components.light && (
        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("light")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "light" ? null : "light"); }}
        >
          {colete.luzRef && (
            <>
              <circle
                cx="345" cy="155"
                r={isLightActive ? 22 : 14}
                fill="none" stroke="#fbbf24" strokeWidth="1.5"
                strokeDasharray="3,4" className="animate-spin"
                style={{ animationDuration: "20s" }} opacity="0.7"
              />
              <circle cx="345" cy="155" r={isLightActive ? 14 : 9} fill="#fef08a" opacity="0.4" filter="url(#neonGlow)" className="animate-pulse" />
            </>
          )}
          <rect x="339" y="142" width="12" height="24" rx="4" fill="#1e293b" stroke={getStrokeColor(components.light.status, isLightActive)} strokeWidth={isLightActive ? 3 : 1.5} className="transition-all" />
          <rect x="341" y="145" width="8" height="8" rx="4" fill={isLightActive ? "#fef08a" : "#94a3b8"} opacity="0.8" />
          <rect x="342" y="155" width="6" height="3" rx="1" fill="#475569" />
          <rect x="337" y="148" width="3" height="10" rx="1" fill="#334155" />
        </g>
        )}

        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("whistle")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "whistle" ? null : "whistle"); }}
        >
          <path d="M 152 195 Q 145 210, 148 230 Q 150 240, 145 250" fill="none" stroke="#94a3b8" strokeWidth="1.2" opacity="0.6" />
          <path
            d="M 140 250 L 138 262 Q 138 270, 144 272 L 160 272 Q 165 272, 166 266 L 168 254 Q 168 248, 162 248 Z"
            fill={getFillColor(components.whistle.status, isWhistleActive)}
            stroke={getStrokeColor(components.whistle.status, isWhistleActive)}
            strokeWidth={isWhistleActive ? 3 : 1.5}
            filter={isWhistleActive ? "url(#neonGlow)" : undefined}
            className="transition-all"
          />
          <rect x="136" y="254" width="6" height="4" rx="1" fill={isWhistleActive ? "#dc2626" : "#94a3b8"} />
          <circle cx="163" cy="260" r="2.5" fill="#1e293b" />
        </g>

        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("inflator")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "inflator" ? null : "inflator"); }}
        >
          <rect x="178" y="270" width="28" height="32" rx="6" fill="#374151" stroke={getStrokeColor(components.inflator.status, isInfActive)} strokeWidth={isInfActive ? 3 : 1.5} filter={isInfActive ? "url(#neonGlow)" : undefined} className="transition-all" />
          <rect x="182" y="274" width="20" height="10" rx="3" fill={getFillColor(components.inflator.status, isInfActive)} opacity="0.5" />
          <rect x="187" y="300" width="10" height="6" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
          <line x1="192" y1="306" x2="192" y2="314" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          <circle cx="192" cy="280" r="3" fill={components.inflator.status === "OK" ? "#10b981" : components.inflator.status === "CRITICAL" ? "#ef4444" : components.inflator.status === "WARNING" ? "#f59e0b" : "#6b7280"} />
        </g>

        <g className="pointer-events-auto cursor-pointer"
           onMouseEnter={() => onHoveredKeyChange("cylinder")}
           onMouseLeave={() => onHoveredKeyChange(null)}
           onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === "cylinder" ? null : "cylinder"); }}
        >
          <rect
            x="207" y="310" width="22" height="72"
            rx="11"
            fill="url(#cylMetalGrad)"
            stroke={getStrokeColor(components.cylinder.status, isCylActive)}
            strokeWidth={isCylActive ? 3 : 1.5}
            filter={isCylActive ? "url(#neonGlow)" : "url(#softShadow)"}
            className="transition-all"
          />
          <rect x="210" y="305" width="16" height="8" rx="3" fill="url(#cylCapGrad)" />
          <rect x="213" y="302" width="10" height="5" rx="2" fill="#4b5563" />
          <rect x="209" y="330" width="18" height="18" rx="2" fill="rgba(255,255,255,0.15)" />
          <text x="218" y="342" textAnchor="middle" fontSize="5" fill="#1e293b" fontWeight="bold">CO₂</text>
          <line x1="209" y1="355" x2="227" y2="355" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="1,2" />
        </g>

        <g opacity="0.12">
          <circle cx="250" cy="68" r="22" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M 230 88 L 225 200 L 275 200 L 270 88" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M 225 110 Q 190 180, 160 260" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <path d="M 275 110 Q 310 180, 340 260" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        </g>

      </svg>

      {(Object.keys(components) as ComponentKey[]).map((key) => {
        const comp = components[key];
        const [left, top] = comp.pos;
        const styles = dotStyle(components, hoveredKey, selectedKey, key);
        const isActive = hoveredKey === key || selectedKey === key;
        const ringSize = enlarged ? "w-10 h-10" : "w-8 h-8";
        const dotSize = enlarged ? "w-4 h-4" : "w-3 h-3";

        return (
          <button
            key={key}
            title={comp.label}
            style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%,-50%)" }}
            className="absolute flex flex-col items-center group z-10 focus:outline-none"
            onMouseEnter={() => onHoveredKeyChange(key)}
            onMouseLeave={() => onHoveredKeyChange(null)}
            onClick={(e) => { e.stopPropagation(); onSelectedKeyChange(selectedKey === key ? null : key); }}
          >
            <div className={`flex items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer shadow-md
              ${ringSize} ${styles.base} ${isActive ? "scale-125 shadow-lg" : ""}`}
            >
              {!isActive && (
                <span className={`absolute inline-flex rounded-full opacity-40 animate-ping ${ringSize} ${styles.ping}`} />
              )}
              <span className={`relative rounded-full ${dotSize} ${styles.dot} z-10`} />
            </div>

            <span className={`mt-1 px-2 py-0.5 rounded-lg text-[10px] font-black whitespace-nowrap shadow pointer-events-none transition-all duration-150
              ${styles.label} text-white
              ${isActive ? "opacity-100 scale-100" : "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"}`}
            >
              {comp.icon} {comp.label.split(" ")[0]}
            </span>
          </button>
        );
      })}

      {!enlarged && (
        <button
          onClick={(e) => { e.stopPropagation(); onZoomRequest(); }}
          title="Ampliar diagrama"
          className="absolute top-2.5 right-2.5 z-20 bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-slate-700 rounded-xl p-2 shadow-md transition-all hover:scale-110 flex items-center justify-center"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
}

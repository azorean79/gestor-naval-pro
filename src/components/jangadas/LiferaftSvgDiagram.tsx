"use client";
import React from "react";

export type ModelShape = "generic" | "rfd_surviva" | "dsb_lr" | "plastimo";

export function getModelShape(brand?: string, model?: string): ModelShape {
  const b = (brand || "").toUpperCase();
  const m = (model || "").toUpperCase();
  if (m.includes("SURVIVA") || m.includes("SEASAVA") || b === "RFD" || m.includes("LR0") || m.includes("LR97") || b === "DSB") return "rfd_surviva";
  if (b.includes("EUROVINIL")) return "dsb_lr";
  if (b === "PLASTIMO" || m.includes("PLASTIMO") || b.includes("PLASTIMO")) return "plastimo";
  return "generic";
}

export function getModelLabel(shape: ModelShape): string {
  const map: Record<ModelShape, string> = {
    generic: "Genérica (SOLAS)",
    rfd_surviva: "RFD SURVIVA / SEASAVA",
    dsb_lr: "DSB Eurovinil LR97",
    plastimo: "Plastimo",
  };
  return map[shape];
}

export function getModelColor(shape: ModelShape): { body: string; canopy: string; chamber: string; accent: string } {
  const map: Record<ModelShape, { body: string; canopy: string; chamber: string; accent: string }> = {
    generic:  { body: "#f1f5f9", canopy: "#e0e7ff", chamber: "#dbeafe", accent: "#6366f1" },
    rfd_surviva: { body: "#fef2f2", canopy: "#fecaca", chamber: "#fca5a5", accent: "#dc2626" },
    dsb_lr:   { body: "#f0fdf4", canopy: "#bbf7d0", chamber: "#86efac", accent: "#16a34a" },
    plastimo: { body: "#fff7ed", canopy: "#fed7aa", chamber: "#fdba74", accent: "#ea580c" },
  };
  return map[shape];
}

// SVG viewBox: 0 0 500 500
export function RaftSvgBody({ shape }: { shape: ModelShape }) {
  const colors = getModelColor(shape);

  switch (shape) {
    case "rfd_surviva":
      return (
        <>
          {/* Câmara superior (arredondada, típica RFD) */}
          <ellipse cx="250" cy="180" rx="170" ry="70" fill={colors.chamber} stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          {/* Câmara inferior (mais larga) */}
          <ellipse cx="250" cy="230" rx="190" ry="75" fill={colors.body} stroke={colors.accent} strokeWidth="2.5" />
          {/* Canopy (teto) */}
          <path d="M 100 160 Q 250 60 400 160 Q 250 130 100 160" fill={colors.canopy} stroke={colors.accent} strokeWidth="1.5" opacity="0.5" />
          {/* Piso / plataforma */}
          <ellipse cx="250" cy="290" rx="185" ry="50" fill={colors.body} stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
          {/* HRU externo */}
          <rect x="50" y="300" width="25" height="35" rx="4" fill="#fee7d4" stroke="#ea580c" strokeWidth="1.5" />
          {/* Cilindro de gás */}
          <rect x="85" y="270" width="20" height="55" rx="5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          {/* Bolsas de lastro */}
          <ellipse cx="100" cy="350" rx="25" ry="12" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          <ellipse cx="400" cy="350" rx="25" ry="12" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          {/* Rampa embarque */}
          <rect x="210" y="330" width="80" height="20" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          {/* Luz exterior */}
          <circle cx="250" cy="65" r="8" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
        </>
      );

    case "dsb_lr":
      return (
        <>
          {/* Câmara superior (oval, típica DSB Eurovinil) */}
          <ellipse cx="250" cy="170" rx="150" ry="80" fill={colors.chamber} stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          {/* Câmara inferior (tubular) */}
          <rect x="70" y="190" width="360" height="70" rx="35" fill={colors.body} stroke={colors.accent} strokeWidth="2.5" />
          {/* Canopy (teto baixo, característico LR) */}
          <path d="M 90 170 Q 250 50 410 170" fill={colors.canopy} stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
          {/* Piso */}
          <rect x="65" y="260" width="370" height="45" rx="10" fill={colors.body} stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
          {/* HRU */}
          <rect x="45" y="280" width="28" height="38" rx="4" fill="#fee7d4" stroke="#ea580c" strokeWidth="1.5" />
          {/* Cilindro gás */}
          <rect x="80" y="250" width="22" height="60" rx="5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          {/* Bolsas lastro */}
          <ellipse cx="90" cy="320" rx="30" ry="10" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          <ellipse cx="410" cy="320" rx="30" ry="10" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          {/* Rampa */}
          <rect x="215" y="300" width="70" height="18" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          {/* Luz */}
          <circle cx="250" cy="55" r="8" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
        </>
      );

    default:
      return (
        <>
          {/* Câmara superior genérica */}
          <ellipse cx="250" cy="180" rx="160" ry="65" fill={colors.chamber} stroke={colors.accent} strokeWidth="2" opacity="0.6" />
          {/* Câmara inferior */}
          <ellipse cx="250" cy="220" rx="180" ry="70" fill={colors.body} stroke={colors.accent} strokeWidth="2.5" />
          {/* Canopy */}
          <path d="M 90 155 Q 250 80 410 155" fill={colors.canopy} stroke={colors.accent} strokeWidth="1.5" opacity="0.5" />
          {/* Piso */}
          <ellipse cx="250" cy="280" rx="175" ry="45" fill={colors.body} stroke={colors.accent} strokeWidth="1.5" opacity="0.4" />
          {/* HRU */}
          <rect x="50" y="290" width="25" height="35" rx="4" fill="#fee7d4" stroke="#ea580c" strokeWidth="1.5" />
          {/* Cilindro gás */}
          <rect x="85" y="260" width="20" height="55" rx="5" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
          {/* Bolsas lastro */}
          <ellipse cx="100" cy="340" rx="25" ry="12" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          <ellipse cx="400" cy="340" rx="25" ry="12" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" opacity="0.7" />
          {/* Rampa embarque */}
          <rect x="210" y="320" width="80" height="20" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          {/* Luz exterior */}
          <circle cx="250" cy="60" r="8" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
        </>
      );
  }
}

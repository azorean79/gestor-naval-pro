import React, { useEffect, useState } from "react";
import { Navio } from "../types";
import { getShipIsland } from "../utils";
import { normalizeNavioTipoCategoria } from "@/lib/navio-legal-types";
import Link from "next/link";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// Dynamic import for Leaflet because it does not support SSR out of the box
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface VistaLiveMapProps {
  navios: Navio[];
}

export default function VistaLiveMap({ navios }: VistaLiveMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Load Leaflet dynamically to avoid window undefined errors in SSR
    import("leaflet").then((leaflet) => {
      setL(leaflet.default || leaflet);
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="h-[600px] rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shadow-sm">
        <p className="text-sm text-slate-500 font-medium animate-pulse">
          A carregar mapa ao vivo...
        </p>
      </div>
    );
  }

  const getVesselCategoryColor = (navio: Navio) => {
    const categoria = normalizeNavioTipoCategoria(navio.tipoPesca, navio.matricula, navio.tipoNavio);
    if (categoria.includes("Pesca")) return "#f97316"; // orange
    if (categoria.includes("Tráfego") || categoria.includes("Marítimo")) return "#0369a1"; // sky-700
    if (categoria.includes("Recreio")) return "#a855f7"; // purple
    if (categoria.includes("Auxiliar")) return "#64748b"; // slate
    return "#334155"; // default slate-700
  };

  const getVesselIcon = (navio: Navio) => {
    const color = getVesselCategoryColor(navio);
    const rotation = navio.heading ?? navio.course ?? 0;
    const isMoving = (navio.speedKnots ?? 0) > 0.5;

    // Se estiver parado, usamos um círculo com borda. Se estiver navegando, usamos um ícone de seta/navio.
    const svg = isMoving 
      ? `<svg width="32" height="32" viewBox="0 0 32 32" style="transform: rotate(${rotation}deg); transition: transform 0.5s ease-in-out;">
          <path d="M16 4 L26 26 L16 22 L6 26 Z" fill="${color}" stroke="white" stroke-width="2" />
         </svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2" />
          <circle cx="12" cy="12" r="3" fill="white" />
         </svg>`;

    return new L.divIcon({
      className: "custom-vessel-icon",
      html: svg,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const trackableNavios = navios.filter((n: any) => n.lat != null && n.lng != null);
  
  const centerPosition: [number, number] = trackableNavios.length > 0 
    ? [trackableNavios[0].lat!, trackableNavios[0].lng!] 
    : [38.5, -28.0];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Ship Tracking</h2>
          <p className="text-sm text-slate-500">
            {trackableNavios.length} navio(s) detetados com coordenadas reais via AISStream.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-orange-500"></span>
            <span className="text-xs font-medium text-slate-600 uppercase">Pesca</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-sky-700"></span>
            <span className="text-xs font-medium text-slate-600 uppercase">Traf./Turismo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-purple-500"></span>
            <span className="text-xs font-medium text-slate-600 uppercase">Recreio</span>
          </div>
        </div>
      </div>

      <div className="h-[600px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200">
        <MapContainer center={centerPosition} zoom={targetZoom(trackableNavios)} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {trackableNavios.map((n: any) => (
            <Marker
              key={`map-marker-${n.id}`}
              position={[n.lat, n.lng]}
              icon={getVesselIcon(n)}
            >
              <Popup>
                <div className="min-w-[200px] font-sans p-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <strong className="text-lg font-bold text-slate-900">{n.nome}</strong>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ (n.speedKnots ?? 0) > 0.5 ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-slate-100 text-slate-600" }`}>
                      {(n.speedKnots ?? 0) > 0.5 ? "Em Navegação" : "Parado"}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-slate-500 uppercase font-semibold text-[9px]">Velocidade</p>
                      <p className="text-slate-900 font-bold">{n.speedKnots?.toFixed(1) ?? "0.0"} KN</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                      <p className="text-slate-500 uppercase font-semibold text-[9px]">Direção</p>
                      <p className="text-slate-900 font-bold">{n.heading ?? n.course ?? "0"} °</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p><b>MMSI/IMO:</b> {n.mmsi || "—"}{n.imo ? ` / ${n.imo}` : ""}</p>
                    <p><b>Porto:</b> {n.portoRegisto || "Sem porto"} | {n.matricula || "S/M"}</p>
                    <p><b>Tipo:</b> {normalizeNavioTipoCategoria(n.tipoPesca, n.matricula, n.tipoNavio)}</p>
                    {n.eta && <p className="text-emerald-700 font-semibold"><b>ETA:</b> {n.eta}</p>}
                    {n.etd && <p className="text-rose-700 font-semibold"><b>ETD:</b> {n.etd}</p>}
                    <p><b>Ilha:</b> {getShipIsland(n)}</p>
                  </div>

                  <Link href={`/navios/${n.id}`} className="mt-4 block w-full text-center bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                    Ver detalhes completos
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

function targetZoom(navios: Navio[]) {
  if (navios.length === 0) return 7;
  if (navios.length === 1) return 12;
  return 8;
}

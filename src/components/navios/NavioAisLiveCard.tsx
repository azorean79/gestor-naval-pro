"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, Polyline } from "react-leaflet";
import { parseCoordinate } from "@/lib/coordinates";
import { APP_CONFIG } from "@/lib/app-config";

type Props = {
  navioId?: number | string | null;
  nomeNavio: string;
  mmsi?: string | null;
  imo?: string | null;
  callSignal?: string | null;
  portoRegisto?: string | null;
  ilha?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

type Coordinates = [number, number];

type AisLivePayload = {
  ok: boolean;
  fetchedAt: string;
  noData?: boolean;
  configMissing?: boolean;
  error?: string;
  source?: string;
  lookup?: {
    strategy?: string | null;
    shipName?: string | null;
    mmsi?: string | null;
    imo?: string | null;
  } | null;
  vessel?: {
    mmsi?: string | null;
    imo?: string | null;
    name?: string | null;
    callSign?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    speedKnots?: number | null;
    course?: number | null;
    heading?: number | null;
    timestamp?: string | null;
    navStatus?: string | null;
  } | null;
};
const APP_REGION_CENTER: Coordinates = [APP_CONFIG.geoCenter.lat, APP_CONFIG.geoCenter.lng];

const PORT_COORDS: Record<string, Coordinates> = {
  "horta": [38.5346, -28.6269],
  "ponta delgada": [37.7412, -25.6756],
  "vila franca do campo": [37.7167, -25.4333],
  "santa cruz das flores": [39.4584, -31.1301],
  "angra do heroismo": [38.6568, -27.2237],
  "madalena": [38.5364, -28.5267],
  "lajes do pico": [38.3981, -28.2582],
  "sao roque do pico": [38.5166, -28.3071],
  "velas": [38.6812, -28.2094],
  "vila do porto": [36.9476, -25.1408],
  "corvo": [39.6717, -31.1136],
  "santa cruz da graciosa": [39.0845, -28.0059],
  "praia da vitoria": [38.731, -27.0667],
};

const ILHA_COORDS: Record<string, Coordinates> = {
  "sao miguel": [37.78, -25.5],
  "terceira": [38.72, -27.22],
  "faial": [38.58, -28.7],
  "pico": [38.47, -28.4],
  "sao jorge": [38.65, -28.08],
  "graciosa": [39.05, -28.02],
  "flores": [39.45, -31.15],
  "corvo": [39.7, -31.11],
  "santa maria": [36.97, -25.1],
};

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function resolveFallbackPosition(portoRegisto?: string | null, ilha?: string | null) {
  const portoKey = normalizeText(portoRegisto);
  if (portoKey && PORT_COORDS[portoKey]) {
    return {
      position: PORT_COORDS[portoKey],
      label: portoRegisto || "Porto de registo",
      source: "porto" as const,
      zoom: 10,
    };
  }

  const ilhaKey = normalizeText(ilha);
  if (ilhaKey && ILHA_COORDS[ilhaKey]) {
    return {
      position: ILHA_COORDS[ilhaKey],
      label: ilha || "Ilha",
      source: "ilha" as const,
      zoom: 9,
    };
  }

  return {
    position: APP_REGION_CENTER,
    label: APP_CONFIG.geoLabel,
    source: "region" as const,
    zoom: 7,
  };
}

function LiveMapRecenter({ center, zoom }: { center: Coordinates; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

export default function NavioAisLiveCard({
  navioId,
  nomeNavio,
  mmsi,
  imo,
  callSignal,
  portoRegisto,
  ilha,
  lat,
  lng,
}: Props) {
  const [activeTab, setActiveTab] = useState<"map" | "aisstream">("map");
  const [liveData, setLiveData] = useState<AisLivePayload | null>(null);
  const [track, setTrack] = useState<Coordinates[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const isLoadingRealtimeRef = useRef(false);

  const canLookupRealtime = Boolean(navioId);
  const canStreamRealtime = Boolean(navioId && String(mmsi || "").trim());

  useEffect(() => {
    if (typeof document === "undefined") return;

    const updateVisibility = () => {
      setIsPageVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const storedPosition = useMemo(() => {
    const parsedLat = parseCoordinate(lat, "lat");
    const parsedLng = parseCoordinate(lng, "lng");
    if (parsedLat !== null && parsedLng !== null) {
      return {
        position: [parsedLat, parsedLng] as Coordinates,
        label: "Posição AIS disponível",
        source: "ais" as const,
        zoom: 11,
      };
    }

    return resolveFallbackPosition(portoRegisto, ilha);
  }, [ilha, lat, lng, portoRegisto]);

  const realtimeMapPosition = useMemo(() => {
    const vesselLat = liveData?.vessel?.latitude;
    const vesselLng = liveData?.vessel?.longitude;

    if (typeof vesselLat === "number" && Number.isFinite(vesselLat) && typeof vesselLng === "number" && Number.isFinite(vesselLng)) {
      return {
        position: [vesselLat, vesselLng] as Coordinates,
        label: "Posição AISStream em tempo real",
        source: "aisstream" as const,
        zoom: 11,
      };
    }

    return storedPosition;
  }, [liveData?.vessel?.latitude, liveData?.vessel?.longitude, storedPosition]);

  const loadRealtimeData = useCallback(async (force = false) => {
    if (!navioId || !canLookupRealtime || (isLoadingRealtimeRef.current && !force)) return;

    isLoadingRealtimeRef.current = true;
    setLiveLoading(true);
    setLiveError(null);

    try {
      const response = await fetch(`/api/navios/${encodeURIComponent(String(navioId))}/ais-live`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "Não foi possível obter dados AIS em tempo real.");
      }

      setLiveData(payload);
      if (
        typeof payload?.vessel?.latitude === "number" &&
        Number.isFinite(payload.vessel.latitude) &&
        typeof payload?.vessel?.longitude === "number" &&
        Number.isFinite(payload.vessel.longitude)
      ) {
        setTrack(prev => {
          const last = prev[prev.length - 1];
          if (last && last[0] === payload.vessel!.latitude && last[1] === payload.vessel!.longitude) return prev;
          return [...prev, [payload.vessel!.latitude!, payload.vessel!.longitude!]];
        });
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Erro a obter dados AIS em tempo real.");
    } finally {
      isLoadingRealtimeRef.current = false;
      setLiveLoading(false);
    }
  }, [canLookupRealtime, navioId]);

  useEffect(() => {
    if (!canLookupRealtime || !isPageVisible) return;
    void loadRealtimeData(true);
  }, [canLookupRealtime, isPageVisible, loadRealtimeData, navioId]);

  useEffect(() => {
    if (!canStreamRealtime || !autoRefresh || !navioId || !isPageVisible) {
      setStreamConnected(false);
      return;
    }

    const streamUrl = `/api/navios/${encodeURIComponent(String(navioId))}/ais-live/stream`;
    const source = new EventSource(streamUrl);

    source.onopen = () => {
      setStreamConnected(true);
      setLiveError(null);
    };

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          type?: "snapshot" | "error";
          status?: number;
          payload?: AisLivePayload;
        };

        if (message.type === "error") {
          setLiveError(message.payload?.error || "Erro no stream AIS em tempo real.");
          setStreamConnected(false);
          if (message.payload) {
            setLiveData(message.payload);
          }
          return;
        }

        if (message.payload) {
          setLiveData(message.payload);
          setLiveError(null);

          const vessel = message.payload.vessel;
          if (
            vessel &&
            typeof vessel.latitude === "number" &&
            Number.isFinite(vessel.latitude) &&
            typeof vessel.longitude === "number" &&
            Number.isFinite(vessel.longitude)
          ) {
            const lat: number = vessel.latitude;
            const lng: number = vessel.longitude;
            setTrack(prev => {
              const last = prev[prev.length - 1];
              if (last && last[0] === lat && last[1] === lng) return prev;
              return [...prev, [lat, lng]];
            });
          }
        }
      } catch {
        setLiveError("Erro ao processar atualização do stream AIS.");
      }
    };

    source.onerror = () => {
      setStreamConnected(false);
    };

    return () => {
      setStreamConnected(false);
      source.close();
    };
  }, [autoRefresh, canStreamRealtime, isPageVisible, navioId]);

  const hasLiveAisCoords = realtimeMapPosition.source === "ais" || realtimeMapPosition.source === "aisstream";
  const hasRealtimeMapCoords = realtimeMapPosition.source === "aisstream";
  const currentLat = Number(realtimeMapPosition.position[0]).toFixed(6);
  const currentLng = Number(realtimeMapPosition.position[1]).toFixed(6);
  const mapsHref = `https://www.google.com/maps?q=${encodeURIComponent(`${currentLat},${currentLng}`)}`;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl shadow-lg p-8 border border-blue-100 flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-2xl font-bold mb-2 text-blue-800 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          Mapa AIS do navio
        </h2>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${hasLiveAisCoords ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
          {hasRealtimeMapCoords ? `Tempo Real (${liveData?.source || "AISStream"})` : hasLiveAisCoords ? `AIS (${liveData?.source || "Registo"})` : "Fallback por porto/região"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "map" ? "bg-blue-600 text-white shadow" : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"}`}
        >
          Mapa AIS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("aisstream")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === "aisstream" ? "bg-blue-600 text-white shadow" : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"}`}
        >
          Sinal Tempo Real
        </button>
      </div>

      {activeTab === "aisstream" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 space-y-4">
           {liveLoading && !liveData && (
             <div className="text-sm text-blue-700 font-medium animate-pulse flex items-center gap-2">
               <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
               A localizar o navio pelos sistemas AIS...
             </div>
           )}
           {liveError && (
             <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
               {liveError}
             </div>
           )}
           {liveData?.noData && !liveError && (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg text-sm">
               A API não devolveu posição recente para este MMSI/IMO nas diversas fontes. O navio pode estar fora de cobertura temporariamente.
             </div>
           )}
           {liveData?.vessel && (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
               <div className="bg-white p-3 rounded-lg border border-slate-200">
                 <div className="text-slate-500 font-medium mb-1">Rumo (Course)</div>
                 <div className="text-slate-900 font-bold">{(liveData.vessel.course ?? liveData.vessel.heading) != null ? `${liveData.vessel.course ?? liveData.vessel.heading}°` : "N/D"}</div>
               </div>
               <div className="bg-white p-3 rounded-lg border border-slate-200">
                 <div className="text-slate-500 font-medium mb-1">Velocidade</div>
                 <div className="text-slate-900 font-bold">{liveData.vessel.speedKnots != null ? `${liveData.vessel.speedKnots} kn` : "N/D"}</div>
               </div>
               <div className="bg-white p-3 rounded-lg border border-slate-200">
                 <div className="text-slate-500 font-medium mb-1">Status Nav.</div>
                 <div className="text-slate-900 font-bold">{liveData.vessel.navStatus || "N/D"}</div>
               </div>
               <div className="bg-white p-3 rounded-lg border border-slate-200">
                 <div className="text-slate-500 font-medium mb-1">Último Registo</div>
                 <div className="text-slate-900 font-bold max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={liveData.vessel.timestamp || ""}>
                   {liveData.vessel.timestamp ? new Date(liveData.vessel.timestamp).toLocaleString() : "N/D"}
                 </div>
               </div>
             </div>
           )}
           <div className="pt-2 flex items-center justify-between text-xs text-slate-500 space-x-2">
             <div className="flex items-center gap-2">
               Auto-Refresh (Live Stream)
               <button
                 type="button"
                 role="switch"
                 aria-checked={autoRefresh}
                 onClick={() => setAutoRefresh(!autoRefresh)}
                  disabled={!canStreamRealtime}
                 className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full ${autoRefresh ? "bg-emerald-500" : "bg-slate-300"}`}
               >
                 <span className="sr-only">Ligar Atualização Stream</span>
                 <span aria-hidden="true" className={`pointer-events-none absolute left-0 inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoRefresh ? "translate-x-5" : "translate-x-0"}`} />
               </button>
             </div>
             {!canStreamRealtime ? (
               <span className="text-slate-400">Sem MMSI para stream em tempo real</span>
             ) : streamConnected && autoRefresh ? (
                <span className="flex items-center gap-1.5 text-emerald-600 font-medium whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  A escutar rede AIS... {track.length > 0 ? `(${track.length} pings)` : ""}
                </span>
             ) : activeTab === "aisstream" && !autoRefresh ? (
                <span className="text-slate-400">Stream desativado</span>
             ) : (
                <span className="text-amber-600">A ligar...</span>
             )}
           </div>
        </div>
      )}

      {activeTab === "map" && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 space-y-2">
            <p>
              {hasLiveAisCoords
                ? "A posição mostrada abaixo usa coordenadas AIS reais do sistema ou do stream em tempo real para este navio."
                : `Quando ainda não existem coordenadas AIS utilizáveis, a ficha mostra uma referência geográfica estável em ${APP_CONFIG.geoLabel} para manter contexto operacional no mapa.`}
            </p>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span><strong>Localização atual:</strong> {currentLat}, {currentLng}</span>
              <a href={mapsHref} target="_blank" rel="noreferrer" className="font-semibold underline decoration-blue-300 underline-offset-2 hover:text-blue-700">
                Abrir no mapa
              </a>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
              <span><strong>Nome:</strong> {nomeNavio || "—"}</span>
              <span><strong>MMSI:</strong> {mmsi || "—"}</span>
              <span><strong>IMO:</strong> {imo || "—"}</span>
              <span><strong>Call Sign:</strong> {callSignal || "—"}</span>
              <span><strong>Referência:</strong> {realtimeMapPosition.label}</span>
              <span><strong>Fonte de localização:</strong> {liveData?.source || "Sistemas AIS Múltiplos"}</span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-blue-100 shadow">
            <MapContainer
              center={realtimeMapPosition.position}
              zoom={realtimeMapPosition.zoom}
              style={{ height: "360px", width: "100%" }}
              scrollWheelZoom={false}
            >
              <LiveMapRecenter center={realtimeMapPosition.position} zoom={realtimeMapPosition.zoom} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {track.length > 1 && (
                <Polyline positions={track} color="#f59e0b" weight={3} dashArray="5, 8" />
              )}
              <CircleMarker
                center={realtimeMapPosition.position}
                radius={10}
                pathOptions={{ color: hasLiveAisCoords ? "#059669" : "#2563eb", fillColor: hasLiveAisCoords ? "#10b981" : "#3b82f6", fillOpacity: 0.85 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">{nomeNavio || "Navio"}</div>
                    <div className="text-slate-600">{hasRealtimeMapCoords ? `Posição Tempo Real (${liveData?.source || "AIS"})` : hasLiveAisCoords ? "Posição AIS registada" : `Referência geográfica: ${realtimeMapPosition.label}`}</div>
                    {mmsi ? <div className="text-slate-600">MMSI: {mmsi}</div> : null}
                    {liveData?.vessel?.speedKnots != null ? <div className="text-slate-600">Velocidade: {liveData.vessel.speedKnots} kn</div> : null}
                    {liveData?.vessel?.course != null ? <div className="text-slate-600">Rumo: {liveData.vessel.course}°</div> : null}
                  </div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          <p className="text-xs text-slate-500">
            {hasRealtimeMapCoords
              ? `O mapa está a acompanhar automaticamente a posição a partir da fonte mais atual (${liveData?.source || "AIS"}) e recentra quando chegam novas coordenadas.`
              : hasLiveAisCoords
              ? "Se o navio mudar de posição no sistema, o mapa desta ficha acompanha as novas coordenadas após atualização dos dados."
              : `Enquanto as fontes AIS não devolvem coordenadas utilizáveis, o mapa mantém uma referência geográfica estável em ${APP_CONFIG.geoLabel}.`}
          </p>
        </>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./VoyageReplay.css";
import { AZORES_VOYAGE_ROUTES, getVoyageRouteById } from "../data/azoresVoyageRoutes";

const shipIcon = L.divIcon({
  className: "replay-ship-icon",
  html: `<div style="background-color: #1f3c88; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const startIcon = L.divIcon({
  className: "start-icon",
  html: `<div style="background: #2e7d32; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: "end-icon",
  html: `<div style="background: #d32f2f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapUpdater({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
}

export default function VoyageReplay() {
  const [selectedVoyageId, setSelectedVoyageId] = useState(AZORES_VOYAGE_ROUTES[0]?.id || "");
  const [tracks, setTracks] = useState(AZORES_VOYAGE_ROUTES[0]?.tracks || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const timerRef = useRef(null);

  const selectedVoyage = getVoyageRouteById(selectedVoyageId);

  useEffect(() => {
    if (!selectedVoyageId) {
      return;
    }

    setPlaying(false);
    setLoading(true);
    setError("");

    const route = getVoyageRouteById(selectedVoyageId);
    if (route?.tracks?.length) {
      const sorted = [...route.tracks].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setTracks(sorted);
      setIndex(0);
    } else {
      setTracks([]);
      setError("Sem histórico disponível para esta rota interilhas.");
    }

    setLoading(false);
  }, [selectedVoyageId]);

  useEffect(() => {
    if (playing && tracks.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((prev) => {
          if (prev < tracks.length - 1) {
            return prev + 1;
          }
          setPlaying(false);
          return prev;
        });
      }, speed);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, speed, tracks]);

  const hasData = tracks.length > 0;
  const currentPoint = hasData ? tracks[index] : null;
  const position = currentPoint ? [currentPoint.latitude, currentPoint.longitude] : [37.7412, -25.6756];
  const fullPath = tracks.map((track) => [track.latitude, track.longitude]);
  const traveledPath = fullPath.slice(0, index + 1);
  const remainingPath = fullPath.slice(index);
  const progress = hasData ? Math.round(((index + 1) / tracks.length) * 100) : 0;
  const stepsRemaining = tracks.length - 1 - index;
  const timeRemainingSeconds = Math.ceil((stepsRemaining * speed) / 1000);
  const etaDisplay = timeRemainingSeconds > 60
    ? `${Math.floor(timeRemainingSeconds / 60)}m ${timeRemainingSeconds % 60}s`
    : `${timeRemainingSeconds}s`;

  return (
    <main className="page">
      <header className="page__header">
        <h1>Reprodução de Rotas</h1>
        <p>Análise histórica das ligações entre Ponta Delgada e os restantes portos dos Açores.</p>
      </header>

      <section className="card" style={{ marginBottom: "20px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: "bold", color: "#555" }}>SELECIONAR ROTA:</label>
          <select
            value={selectedVoyageId}
            onChange={(e) => setSelectedVoyageId(e.target.value)}
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "360px", cursor: "pointer" }}
          >
            {AZORES_VOYAGE_ROUTES.map((voyage) => (
              <option key={voyage.id} value={voyage.id}>
                {voyage.vessel_name} ({voyage.origin} ➝ {voyage.destination})
              </option>
            ))}
          </select>
        </div>
      </section>

      {!loading && error && (
        <div className="card" style={{ padding: "40px", textAlign: "center", color: "#d32f2f", background: "#ffebee" }}>
          <h3>⚠️ {error}</h3>
          <p>Escolhe uma rota interilhas açoriana com origem em Ponta Delgada para reproduzir o percurso.</p>
        </div>
      )}

      {!loading && hasData && currentPoint && (
        <>
          <section className="card" style={{ marginBottom: "20px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "flex-end", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ margin: "0 0 5px 0", color: "#1f3c88" }}>{new Date(currentPoint.timestamp).toLocaleString("pt-PT")}</h3>
                <div style={{ fontSize: "0.9rem", color: "#666" }}>
                  Velocidade: <strong>{currentPoint.speed} kn</strong> | Lat: {currentPoint.latitude.toFixed(4)}, Lon: {currentPoint.longitude.toFixed(4)}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "6px" }}>
                  <strong>{selectedVoyage?.origin}</strong> ➝ <strong>{selectedVoyage?.destination}</strong> · {selectedVoyage?.island}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2e7d32" }}>{progress}%</div>
                {playing && <div style={{ fontSize: "0.8rem", color: "#888" }}>Tempo estimado restante: {etaDisplay}</div>}
              </div>
            </div>

            <input
              type="range"
              min="0"
              max={tracks.length - 1}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              style={{ width: "100%", marginBottom: "20px", cursor: "pointer", accentColor: "#1f3c88" }}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                {!playing ? (
                  <button
                    className="ghost-btn"
                    onClick={() => setPlaying(true)}
                    style={{ background: "#e3f2fd", color: "#1565c0", fontWeight: "bold", minWidth: "100px" }}
                  >
                    ▶ Reproduzir
                  </button>
                ) : (
                  <button
                    className="ghost-btn"
                    onClick={() => setPlaying(false)}
                    style={{ background: "#fff3e0", color: "#e65100", fontWeight: "bold", minWidth: "100px" }}
                  >
                    ⏸ Pausar
                  </button>
                )}

                <button
                  className="ghost-btn"
                  onClick={() => {
                    setIndex(0);
                    setPlaying(false);
                  }}
                  style={{ border: "1px solid #ccc", color: "#555" }}
                >
                  🔁 Reiniciar
                </button>
              </div>

              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#666", marginRight: "5px" }}>VELOCIDADE:</span>
                {[1000, 500, 250, 125].map((currentSpeed, i) => {
                  const label = `${Math.pow(2, i)}x`;
                  const isActive = speed === currentSpeed;
                  return (
                    <button
                      key={currentSpeed}
                      onClick={() => setSpeed(currentSpeed)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "4px",
                        border: isActive ? "none" : "1px solid #ccc",
                        background: isActive ? "#1f3c88" : "white",
                        color: isActive ? "white" : "#333",
                        fontWeight: isActive ? "bold" : "normal",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        transition: "all 0.2s",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="map-wrapper" style={{ height: "550px", borderRadius: "16px", overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <MapContainer center={position} zoom={8} style={{ height: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />

              <Polyline positions={remainingPath} pathOptions={{ color: "#94a3b8", weight: 3, dashArray: "5, 10", opacity: 0.6 }} />
              <Polyline positions={traveledPath} pathOptions={{ color: "#1f3c88", weight: 4 }} />

              <Marker position={fullPath[0]} icon={startIcon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>Início</Tooltip>
              </Marker>

              <Marker position={fullPath[fullPath.length - 1]} icon={endIcon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>Destino</Tooltip>
              </Marker>

              <Marker position={position} icon={shipIcon}>
                <Popup>
                  <div style={{ textAlign: "center", minWidth: "150px" }}>
                    <strong style={{ color: "#1f3c88" }}>Posição atual</strong>
                    <hr style={{ margin: "5px 0", borderTop: "1px solid #eee" }} />
                    <div style={{ fontSize: "0.9rem" }}>{currentPoint.speed} nós</div>
                    <div style={{ fontSize: "0.8rem", color: "#666" }}>{new Date(currentPoint.timestamp).toLocaleTimeString("pt-PT")}</div>
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>{selectedVoyage?.origin} ➝ {selectedVoyage?.destination}</div>
                  </div>
                </Popup>
                <MapUpdater center={position} />
              </Marker>
            </MapContainer>
          </section>
        </>
      )}
    </main>
  );
}
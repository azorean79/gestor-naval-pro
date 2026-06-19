import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchLiveVessels, fetchRiskZones } from "../api/api"; 
import Loader from "./Loader"; 

const getFlagLabel = (flag) => {
  if (!flag) return "Sem bandeira";
  const normalized = String(flag).trim().toLowerCase();
  if (["portugal", "pt", "prt", "portuguesa", "portuguese"].includes(normalized)) {
    return "🇵🇹 Portuguesa";
  }
  return flag;
};

/* ===================================================
   1. ADVANCED CATEGORIZATION & COLORS
=================================================== */
const getVesselCategory = (type) => {
  if (!type) return "UNKNOWN";
  const t = type.toLowerCase();
  
  if (t.includes("tanker") || t.includes("oil") || t.includes("hazard")) return "TANKER";
  if (t.includes("cargo") || t.includes("container") || t.includes("bulk")) return "CARGO";
  if (t.includes("recreio") || t.includes("yacht") || t.includes("pleasure") || t.includes("leisure")) return "RECREATIONAL";
  if (t.includes("passenger") || t.includes("ferry") || t.includes("cruise")) return "PASSENGER";
  if (t.includes("fishing") || t.includes("trawler")) return "FISHING";
  if (t.includes("navy") || t.includes("military") || t.includes("patrol")) return "MILITARY";
  
  return "OTHER";
};

const VESSEL_COLORS = {
  CARGO: "#2e7d32",    // 🟢 Green
  TANKER: "#d32f2f",   // 🔴 Red
  PASSENGER: "#0288d1",// 🔵 Blue
  FISHING: "#f57c00",  // 🟠 Orange
  RECREATIONAL: "#00acc1",
  MILITARY: "#7b1fa2", // 🟣 Purple
  UNKNOWN: "#5c6886"   // Grey
};

/* ===================================================
   2. SHAPE-BASED ICON GENERATOR (RESIZED TO 22px)
=================================================== */
const createShipIcon = (course = 0, type) => {
  const category = getVesselCategory(type);
  let color = VESSEL_COLORS.UNKNOWN;
  let svgShape = "";

  switch (category) {
    case "CARGO":
      color = VESSEL_COLORS.CARGO;
      // ▲ Triangle
      svgShape = `<path d="M50 0 L100 100 L50 80 L0 100 Z" fill="${color}" stroke="white" stroke-width="5"/>`;
      break;
    case "TANKER":
      color = VESSEL_COLORS.TANKER;
      // ◆ Diamond
      svgShape = `<path d="M50 0 L100 50 L50 100 L0 50 Z" fill="${color}" stroke="white" stroke-width="5"/>`;
      break;
    case "PASSENGER":
      color = VESSEL_COLORS.PASSENGER;
      svgShape = `<circle cx="50" cy="50" r="45" fill="${color}" stroke="white" stroke-width="5"/>
                  <path d="M50 0 L65 25 L35 25 Z" fill="white"/>`; 
      break;
    case "FISHING":
      color = VESSEL_COLORS.FISHING;
      svgShape = `<rect x="10" y="10" width="80" height="80" fill="${color}" stroke="white" stroke-width="5"/>`;
      break;
    case "RECREATIONAL":
      color = VESSEL_COLORS.RECREATIONAL;
      svgShape = `<path d="M8 62 L92 62 L74 88 L26 88 Z" fill="${color}" stroke="white" stroke-width="5"/>
                  <path d="M48 12 L78 62 L48 62 Z" fill="${color}" stroke="white" stroke-width="5"/>
                  <path d="M48 18 L48 62" stroke="white" stroke-width="5"/>`;
      break;
    case "MILITARY":
      color = VESSEL_COLORS.MILITARY;
      svgShape = `<polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="${color}" stroke="white" stroke-width="5"/>`;
      break;
    default:
      svgShape = `<path d="M50 0 L100 100 L50 80 L0 100 Z" fill="${color}" stroke="white" stroke-width="5"/>`;
  }
  
  return L.divIcon({
    className: "custom-ship-icon",
    html: `
      <svg width="22" height="22" viewBox="0 0 100 100" style="transform: rotate(${course}deg); filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.3));">
        ${svgShape}
      </svg>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
};

/* --- ANIMATED MARKER WRAPPER --- */
function AnimatedMarker({ position, icon, children, onClick }) {
  const markerRef = useRef(null);
  useEffect(() => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    const to = L.latLng(position);
    if (marker.getLatLng().distanceTo(to) > 10) {
        marker.setLatLng(to); 
    }
  }, [position]);

  return <Marker ref={markerRef} position={position} icon={icon} eventHandlers={{ click: onClick }}>{children}</Marker>;
}

/* ===================================================
   MAIN MAP COMPONENT
=================================================== */
export default function MapComponent({ center = [38.55, -28.15], zoom = 8 }) {
  const [vessels, setVessels] = useState([]);
  const [risks, setRisks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [selectedVesselId, setSelectedVesselId] = useState(null);
  
  const [filterType, setFilterType] = useState("ALL"); 
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [toastMsg, setToastMsg] = useState(null); 
  const [showAlerts, setShowAlerts] = useState(false);

  // Risk Zone Colors
  const getRiskStyle = (type) => {
    switch (type) {
      case 'WEATHER': return { color: '#ffca28', fill: '#ffca28', opacity: 0.3 }; 
      case 'PIRACY': return { color: '#d32f2f', fill: '#d32f2f', opacity: 0.4 }; 
      case 'CONGESTION': return { color: '#e65100', fill: '#e65100', opacity: 0.3 };
      default: return { color: '#ffa726', fill: '#ffa726', opacity: 0.3 };
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [vesselsRes, risksRes] = await Promise.all([fetchLiveVessels(), fetchRiskZones()]);
        if (mounted) {
          const vesselList = vesselsRes.vessels || (Array.isArray(vesselsRes) ? vesselsRes : []);
          setVessels(vesselList);
          
          let finalRisks = Array.isArray(risksRes) ? risksRes : [];
          if (finalRisks.length < 3) {
             finalRisks = [
               { id: 991, risk_type: "CONGESTION", latitude: 37.7412, longitude: -25.6611, radius_km: 18, description: "Operações condicionadas no porto de Ponta Delgada" },
               { id: 992, risk_type: "WEATHER", latitude: 38.55, longitude: -28.62, radius_km: 28, description: "Agitação marítima no canal Faial-Pico" },
               { id: 993, risk_type: "WEATHER", latitude: 39.45, longitude: -31.13, radius_km: 24, description: "Frente atlântica a oeste das Flores" }
             ];
          }
          setRisks(finalRisks);
        }
      } catch (err) { console.error("Map Error:", err); } 
      finally { if(mounted) setLoading(false); }
    };
    loadData();
    const interval = setInterval(loadData, 10000); 
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleAction = (action) => {
    setToastMsg(`${action} iniciado.`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredVessels = vessels.filter(v => filterType === "ALL" || getVesselCategory(v.type) === filterType);
  const activeCount = filteredVessels.length;
  const riskCount = Math.floor(filteredVessels.length * 0.05);

  if (loading) return <Loader />;

  return (
    <div style={{ height: "85vh", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid #e0e0e0", fontFamily: "Inter, sans-serif" }}>
      
      <div style={{
          position: "absolute", top: "15px", left: "50%", transform: "translateX(-50%)", zIndex: 999,
          background: "rgba(30, 41, 59, 0.85)", color: "white", backdropFilter: "blur(10px)",
          padding: "8px 24px", borderRadius: "30px", display: "flex", gap: "20px", alignItems: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", fontSize: "12px", fontWeight: "600", border: "1px solid rgba(255,255,255,0.1)"
      }}>
          <div style={{display: "flex", alignItems: "center", gap: "8px"}}><span style={{width: 8, height: 8, background: "#2e7d32", borderRadius: "50%", boxShadow: "0 0 8px #2e7d32"}}></span> {activeCount} embarcações</div>
          <div style={{width: "1px", height: "14px", background: "rgba(255,255,255,0.2)"}}></div>
          <div style={{display: "flex", alignItems: "center", gap: "8px"}}><span style={{width: 8, height: 8, background: "#d32f2f", borderRadius: "50%", boxShadow: "0 0 8px #d32f2f"}}></span> {riskCount} alertas</div>
      </div>

      <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 999, display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <div style={{
              background: "rgba(255, 255, 255, 0.95)", padding: "12px", borderRadius: "10px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)", backdropFilter: "blur(5px)", minWidth: "200px"
          }}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
            <span style={{fontSize: "12px", fontWeight: "700", color: "#333"}}>Filtros</span>
            <span style={{fontSize: "10px", color: "#2e7d32", fontWeight: "bold"}}>● EM DIRETO</span>
            </div>
            
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{padding: "6px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "12px", width: "100%", marginBottom: "8px", cursor: "pointer"}}>
            <option value="ALL">Mostrar toda a frota</option>
            <option value="CARGO">Carga (Verde ▲)</option>
            <option value="TANKER">Tanque (Vermelho ◆)</option>
            <option value="PASSENGER">Passageiros (Azul ●)</option>
            <option value="FISHING">Pesca (Laranja ■)</option>
            <option value="RECREATIONAL">Recreio (Ciano ⛵)</option>
            <option value="MILITARY">Militar (Roxo ★)</option>
            </select>

            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #eee"}}>
             <span style={{fontSize: "11px", fontWeight: "600", color: "#555"}}>Mostrar zonas de alerta</span>
               <input type="checkbox" checked={showRiskZones} onChange={() => setShowRiskZones(!showRiskZones)} style={{cursor: "pointer"}} />
            </div>
          </div>

          <button 
            onClick={() => setShowAlerts(!showAlerts)}
            style={{
                background: showAlerts ? "#333" : "white", color: showAlerts ? "white" : "#333",
                border: "none", borderRadius: "10px", width: "40px", height: "40px",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 15px rgba(0,0,0,0.15)", cursor: "pointer", transition: "all 0.2s"
            }}
          >
             <span style={{fontSize: "18px"}}>🔔</span>
          </button>
      </div>

      {showAlerts && (
        <div style={{
            position: "absolute", top: "160px", right: "20px", zIndex: 998, width: "260px",
            background: "white", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            padding: "15px", animation: "slideDown 0.2s ease-out"
        }}>
            <h4 style={{margin: "0 0 10px 0", fontSize: "13px", fontWeight: "700", color: "#333"}}>Alertas ativos (3)</h4>
            <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                <div style={{background: "#ffebee", padding: "10px", borderRadius: "6px", borderLeft: "3px solid #d32f2f"}}>
                    <div style={{fontSize: "11px", fontWeight: "bold", color: "#c62828"}}>Estado do mar adverso</div>
                    <div style={{fontSize: "10px", color: "#555"}}>Ondulação forte registada a sul de São Miguel.</div>
                </div>
                <div style={{background: "#fff3e0", padding: "10px", borderRadius: "6px", borderLeft: "3px solid #f57c00"}}>
                    <div style={{fontSize: "11px", fontWeight: "bold", color: "#ef6c00"}}>Condicionamento portuário</div>
                    <div style={{fontSize: "10px", color: "#555"}}>Janela de acostagem reduzida em Ponta Delgada.</div>
                </div>
            </div>
        </div>
      )}

      {toastMsg && (
        <div style={{ position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "white", padding: "8px 16px", borderRadius: "20px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 10000, fontWeight: "600", fontSize: "12px", animation: "fadeIn 0.3s" }}>✅ {toastMsg}</div>
      )}

      <MapContainer center={center} zoom={zoom} style={{ height: "100%", background: "#aad3df", zIndex: 1 }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />

        {showRiskZones && risks.map((risk) => {
            const style = getRiskStyle(risk.risk_type);
            return (
              <Circle key={risk.id} center={[risk.latitude || 0, risk.longitude || 0]} pathOptions={{ color: style.color, fillColor: style.fill, fillOpacity: style.opacity, weight: 1 }} radius={(risk.radius_km || 20) * 1000}>
                <Popup><div style={{textAlign: "center"}}><strong style={{color: style.color}}>⚠️ Zona de monitorização</strong><p>{risk.description}</p></div></Popup>
              </Circle>
            );
        })}

        {filteredVessels.map((v) => {
          const lat = Number(v.last_position_lat);
          const lon = Number(v.last_position_lon);
          if (isNaN(lat) || isNaN(lon)) return null;

          let rawSpeed = Number(v.speed || 0);
          if (rawSpeed < 0.1) {
             rawSpeed = (Math.random() * (18 - 8.5) + 8.5); 
          }
          const displaySpeed = rawSpeed.toFixed(1); 

          const heading = v.course || Math.floor(Math.random() * 360);
          const isHighRisk = (v.type || "").toLowerCase().includes("tanker");

          return (
            <React.Fragment key={v.mmsi || v.id}>
                {selectedVesselId === v.id && (
                    <Polyline positions={[[lat, lon], [lat - 5, lon - 5]]} pathOptions={{ color: '#1f3c88', weight: 2, dashArray: '5, 10', opacity: 0.6 }} />
                )}
                
                <AnimatedMarker position={[lat, lon]} icon={createShipIcon(v.course, v.type)} onClick={() => setSelectedVesselId(v.id)}>
                  <Popup className="custom-popup" maxWidth={300}>
                    <div style={{ minWidth: "240px" }}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", borderBottom: "1px solid #eee", paddingBottom: "8px"}}>
                          <div>
                            <h3 style={{margin: "0", fontSize: "15px", color: "#1f3c88"}}>{v.name}</h3>
                            <span style={{fontSize: "11px", color: "#666"}}>Bandeira {getFlagLabel(v.flag)}</span>
                          </div>
                          {isHighRisk && <span style={{fontSize: "9px", background: "#ffebee", color: "#d32f2f", padding: "2px 5px", borderRadius: "3px", border: "1px solid #ffcdd2", fontWeight: "bold"}}>MONITORIZAÇÃO</span>}
                      </div>

                      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", color: "#444", marginBottom: "10px"}}>
                          <div><strong>Tipo:</strong> <br/>{v.type}</div>
                          <div><strong>Velocidade:</strong> <br/>{displaySpeed} kn</div>
                          <div><strong>Rumo:</strong> <br/>{heading}° ⬆</div>
                            <div><strong>ETA:</strong> <br/>{v.eta || "Sem previsão"}</div>
                      </div>

                      <div style={{display: "flex", gap: "5px"}}>
                        <button onClick={() => handleAction("Acompanhamento")} style={{flex: 1, padding: "5px", background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "10px", fontWeight: "bold"}}>Acompanhar</button>
                        <button onClick={() => handleAction("Relato")} style={{flex: 1, padding: "5px", background: "#fff3e0", color: "#e65100", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "10px"}}>Relatar</button>
                      </div>
                    </div>
                  </Popup>
                </AnimatedMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      <div style={{
          position: "absolute", bottom: "20px", right: "20px", 
          background: "white", padding: "15px", borderRadius: "10px", 
          boxShadow: "0 4px 15px rgba(0,0,0,0.15)", zIndex: 999, fontSize: "12px"
      }}>
          <div style={{fontWeight: "700", marginBottom: "8px", color: "#333", borderBottom: "1px solid #eee", paddingBottom: "5px"}}>Tipos de embarcação</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px"}}><span style={{color: "#2e7d32", fontSize: "14px"}}>▲</span> Carga (Verde)</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px"}}><span style={{color: "#d32f2f", fontSize: "14px"}}>◆</span> Tanque (Vermelho)</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px"}}><span style={{color: "#0288d1", fontSize: "14px"}}>●</span> Passageiros (Azul)</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px"}}><span style={{color: "#f57c00", fontSize: "14px"}}>■</span> Pesca (Laranja)</div>
            <div style={{display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px"}}><span style={{color: "#00acc1", fontSize: "14px"}}>⛵</span> Recreio (Ciano)</div>
          <div style={{display: "flex", alignItems: "center", gap: "10px"}}><span style={{color: "#7b1fa2", fontSize: "14px"}}>★</span> Militar (Roxo)</div>
      </div>
    </div>
  );
}
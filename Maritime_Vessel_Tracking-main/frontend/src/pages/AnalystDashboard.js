import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from "chart.js";
import Loader from "../components/Loader";
import "./AnalystDashboard.css"; 

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, ArcElement, Filler
);

// ✅ THEME CONSTANTS
const THEME = {
  NAVY: "#0B2F4A",
  AQUA: "#2EB2FF",
  GREEN: "#28A745",
  WARNING: "#FFC107",
  RISK: "#DC3545",
  BG: "#F5F7FA"
};

const CARGO_COLOR_MAP = {
  "Oil Tanker": "#1E3A8A",      
  "Tanker": "#1E3A8A",
  "Container Ship": "#0284C7",  
  "Container": "#0284C7",
  "LNG Carrier": "#22C55E",     
  "LPG Carrier": "#22C55E",
  "Bulk Carrier": "#F59E0B",    
  "General Cargo": "#F43F5E",   
  "Fishing Vessel": "#8B5CF6",  
  "Fishing": "#8B5CF6",
    "Recreational": "#00ACC1",
    "Yacht": "#00ACC1",
    "Pleasure Craft": "#00ACC1",
  "Passenger Ship": "#FB923C",  
  "Passenger": "#FB923C",
  "Unknown": "#CBD5E1"          
};

export default function AnalystDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); 

  const [selectedDays, setSelectedDays] = useState("Last 7 Days");
  const [selectedType, setSelectedType] = useState("All Vessel Types");
    const [selectedRegion, setSelectedRegion] = useState("All Regions");

  const riskZones = [
        { zone: "Canal Faial-Pico", riskType: "Agitação marítima", count: 8, level: 85, color: THEME.RISK },
        { zone: "Ponta Delgada", riskType: "Pressão portuária", count: 6, level: 60, color: THEME.WARNING },
        { zone: "Canal São Jorge-Pico", riskType: "Condições operacionais", count: 5, level: 45, color: THEME.NAVY },
  ];

  const incidentLog = [
      { id: 1, time: "08:30", ship: "Sem embarcação atribuída", type: "Desvio de rota", loc: "Canal do Pico", severity: "medium" },
      { id: 2, time: "06:15", ship: "Sem embarcação atribuída", type: "Alerta meteorológico", loc: "Costa sul de São Miguel", severity: "high" },
      { id: 3, time: "02:45", ship: "Sem embarcação atribuída", type: "Atraso operacional", loc: "Porto da Horta", severity: "low" },
  ];

  const alertSummary = {
    critical: incidentLog.filter(i => i.severity === 'high').length,
    warning: incidentLog.filter(i => i.severity === 'medium').length,
    info: incidentLog.filter(i => i.severity === 'low').length,
  };

  const fetchAnalytics = () => {
    setLoading(true);
    const BASE_URL = "https://maritime-backend-0521.onrender.com"; 
    const url = `${BASE_URL}/api/analytics/?days=${selectedDays}&type=${selectedType}&region=${selectedRegion}`;
    
    const token = localStorage.getItem("access_token");

    fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
        }
    })
      .then(res => {
          if (!res.ok) throw new Error("Server error");
          return res.json();
      })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  if (loading) return <Loader />;

  // --- CHART CONFIGURATION ---
  const trafficData = {
    labels: data?.daily_traffic?.map(d => d.date) || [],
    datasets: [{
        label: 'Ship Movements',
        data: data?.daily_traffic?.map(d => d.count) || [],
        borderColor: THEME.AQUA,
        backgroundColor: 'rgba(46, 178, 255, 0.2)',
        tension: 0.4,
        fill: true,
    }]
  };

  const cargoLabels = data?.cargo_distribution?.map(c => c.cargo_type || "Unknown") || [];
  const cargoColors = cargoLabels.map(type => CARGO_COLOR_MAP[type] || CARGO_COLOR_MAP["Unknown"]);

  const cargoData = {
    labels: cargoLabels,
    datasets: [{
        data: data?.cargo_distribution?.map(c => c.count) || [],
        backgroundColor: cargoColors, 
        borderWidth: 0
    }]
  };

  const congestionData = {
    labels: data?.congested_ports?.map(p => p.name) || [],
    datasets: [{
        label: 'Congestion Score (0-100)',
        data: data?.congested_ports?.map(p => p.congestion_score) || [],
        backgroundColor: data?.congested_ports?.map(p => p.congestion_score > 80 ? THEME.RISK : THEME.WARNING),
    }]
  };

  return (
    <div className="analyst-container">
      
      <header className="analyst-header-bar" style={{ background: THEME.NAVY }}>
        <div>
            <h1>Painel Analítico dos Açores</h1>
            <p>Indicadores estratégicos e inteligência operacional marítima</p>
        </div>
        <div className="sync-badge">Última sincronização: agora mesmo</div>
      </header>

      <div className="filters-row">
        <select className="filter-select" value={selectedDays} onChange={(e) => setSelectedDays(e.target.value)}>
            <option value="Last 7 Days">Últimos 7 dias</option>
            <option value="Last 30 Days">Últimos 30 dias</option>
            <option value="Last 90 Days">Últimos 90 dias</option>
        </select>
        <select className="filter-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
            <option value="All Vessel Types">Todos os tipos</option>
            <option value="Container Ship">Navio porta-contentores</option>
            <option value="Oil Tanker">Navio petroleiro</option>
            <option value="Fishing Vessel">Navio de pesca</option>
            <option value="Recreational">Embarcação de recreio</option>
            <option value="Bulk Carrier">Graneleiro</option>
        </select>
        <select className="filter-select" value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="All Regions">Todas as ilhas</option>
            <option value="East Group">Grupo Oriental</option>
            <option value="Central Group">Grupo Central</option>
            <option value="West Group">Grupo Ocidental</option>
        </select>
        <button className="apply-btn" style={{ background: THEME.AQUA }} onClick={fetchAnalytics}>Aplicar filtros</button>
      </div>

      <div className="dashboard-content">
        
        <div className="kpi-grid">
            <KPICard 
                title="Embarcações monitorizadas" 
                value={data?.kpis?.total_ships || 0} 
                icon="🚢" color={THEME.AQUA} trend="+12%" 
                updated="2 sec ago"
                tooltip="Número total de embarcações atualmente ativas na plataforma."
                link="/search" navigate={navigate} 
            />
            <KPICard 
                title="Travessias ativas" 
                value={data?.kpis?.active_voyages || 0} 
                icon="🌍" color={THEME.GREEN} trend="+5%" 
                updated="1 min ago"
                tooltip="Embarcações atualmente em trânsito entre portos do arquipélago."
                link="/map" navigate={navigate} 
            />
            <KPICard 
                title="Espera média em porto" 
                value={`${data?.kpis?.avg_wait_time || 0}h`} 
                icon="⚓" color={THEME.WARNING} trend="+2h" isWarning 
                updated="5 min ago"
                tooltip="Tempo médio de espera antes de acostagem."
                link="/analyst" navigate={navigate} 
            />
            <KPICard 
                title="Embarcações em zonas de alerta" 
                value={data?.kpis?.ships_at_risk || 0} 
                icon="⚠️" color={THEME.RISK} trend="-1" isRisk 
                updated="Just now"
                tooltip="Embarcações dentro de áreas de risco meteorológico ou operacional."
                link="/map" navigate={navigate} 
            />
        </div>

        <div className="charts-row">
            <ChartCard title="Tendência do tráfego marítimo">
                <div style={{ height: "300px" }}>
                    <Line data={trafficData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </ChartCard>
            <ChartCard title="Distribuição por tipo de carga">
                <div style={{ height: "300px", display: "flex", justifyContent: "center" }}>
                    <Doughnut data={cargoData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </ChartCard>
        </div>

        <div className="charts-row">
            <ChartCard title="⚠️ Zonas de risco e exposição">
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "10px" }}>
                    {riskZones.map((risk, i) => (
                        <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "6px" }}>
                                <strong>{risk.zone}</strong>
                                <span style={{ color: "#666" }}>{risk.riskType} ({risk.count})</span>
                            </div>
                            <div style={{ width: "100%", background: "#eee", height: "10px", borderRadius: "5px" }}>
                                <div style={{ width: `${risk.level}%`, background: risk.color, height: "100%", borderRadius: "5px" }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </ChartCard>

            <ChartCard title="💥 Histórico de incidentes">
                <div className="alert-summary-bar">
                    <span className="alert-badge" style={{background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2"}}>🔴 {alertSummary.critical} Crítico</span>
                    <span className="alert-badge" style={{background: "#fff3e0", color: "#ef6c00", border: "1px solid #ffe0b2"}}>🟠 {alertSummary.warning} Aviso</span>
                    <span className="alert-badge" style={{background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9"}}>🟢 {alertSummary.info} Informação</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "15px" }}>
                    {incidentLog.map((log) => (
                        <div 
                            key={log.id} 
                            style={{ display: "flex", gap: "15px", alignItems: "center", padding: "8px", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s" }}
                            onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                            onClick={() => alert(`A abrir detalhes do incidente de ${log.ship}...\n\nTipo: ${log.type}\nLocalização: ${log.loc}`)}
                        >
                            <div style={{ fontSize: "0.8rem", color: "#888", minWidth: "65px" }}>{log.time}</div>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: log.severity === 'high' ? THEME.RISK : log.severity === 'medium' ? THEME.WARNING : THEME.GREEN, border: "2px solid #fff", boxShadow: "0 0 0 1px #eee" }}></div>
                            <div>
                                <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "#333" }}>{log.type}</div>
                                <div style={{ fontSize: "0.8rem", color: "#555" }}>{log.ship} — {log.loc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </ChartCard>
        </div>

        <div className="charts-row">
            <ChartCard title="Portos com maior pressão operacional">
                <table className="data-table">
                    <thead>
                        <tr><th>Porto</th><th>Espera (h)</th><th>Atraso médio</th><th>Índice</th></tr>
                    </thead>
                    <tbody>
                        {data?.congested_ports?.map((p, i) => (
                            <tr 
                                key={i} 
                                style={{ cursor: "pointer" }} 
                                onClick={() => navigate('/map')} 
                                title="Clicar para ver o porto no mapa"
                                onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                                onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                            >
                                <td>{p.name}</td>
                                <td>{p.avg_wait_time}</td>
                                <td style={{ color: THEME.RISK }}>+{Math.floor(p.avg_wait_time * 0.2)}h</td>
                                <td>
                                    <span style={{ 
                                        background: p.congestion_score > 80 ? "#ffebee" : "#fff3e0", 
                                        color: p.congestion_score > 80 ? "#c62828" : "#ef6c00", 
                                        padding: "4px 8px", borderRadius: "4px", fontWeight: "bold", fontSize: "0.85rem" 
                                    }}>
                                        {p.congestion_score}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ChartCard>

            <ChartCard title="Análise de congestionamento portuário">
                 <div style={{ height: "300px" }}>
                    <Bar data={congestionData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
            </ChartCard>
        </div>

      </div>
    </div>
  );
}

// --- KPI CARD WITH TOOLTIP ---
const KPICard = ({ title, value, icon, color, trend, isRisk, isWarning, updated, tooltip, link, navigate }) => {
    const isPositive = trend.includes('+');
    const arrow = isPositive ? '▲' : '▼';
    let trendColor = THEME.GREEN;
    if (isRisk) trendColor = isPositive ? THEME.RISK : THEME.GREEN;
    else if (isWarning) trendColor = isPositive ? THEME.WARNING : THEME.GREEN;
    else trendColor = isPositive ? THEME.GREEN : THEME.RISK;

    return (
        <div 
            className="metric-card clickable-card" 
            style={{ borderLeft: `5px solid ${color}` }}
            onClick={() => link && navigate(link)}
            title={tooltip} 
        >
            <div className="card-top">
                <div>
                    <p className="card-title" style={{borderBottom: "1px dashed #ccc", display: "inline-block", paddingBottom: "2px", cursor: "help"}}>{title}</p>
                    <h2 className="card-value">{value}</h2>
                </div>
                <div className="card-icon" style={{ background: `${color}20`, color: color }}>{icon}</div>
            </div>
            
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px"}}>
                <div className="card-trend" style={{ color: trendColor, fontWeight: "800", fontSize: "0.9rem" }}>
                    <span style={{ fontSize: "1.1rem", marginRight: "4px" }}>{arrow}</span> 
                    {trend} <span style={{ color: "#999", fontWeight: "400", fontSize: "0.8rem" }}>face à última semana</span>
                </div>
                {updated && <div style={{ fontSize: "0.7rem", color: "#aaa", fontStyle: "italic" }}>Atualizado: {updated}</div>}
            </div>
        </div>
    );
};

const ChartCard = ({ title, children }) => (
    <div className="chart-card">
        <h3>{title}</h3>
        {children}
    </div>
);
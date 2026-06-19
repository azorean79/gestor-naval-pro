import React, { useEffect, useState } from "react";
import { fetchDashboardStats, fetchLiveVessels, fetchPortActivity, fetchPortMovements } from "../api/api";
import Loader from "../components/Loader";
import { Link, useNavigate } from "react-router-dom"; 
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [portMovements, setPortMovements] = useState(null);
  const [portActivity, setPortActivity] = useState(null);
  const [regionalFleetCount, setRegionalFleetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // ✅ State for Toast Notification
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchLiveVessels(),
      fetchPortMovements(6, "PTPDL", { live: true, archive: true }),
      fetchPortActivity(7, "PTPDL", { live: true, archive: true }),
    ])
      .then(([statsRes, vesselsRes, portRes, activityRes]) => {
        setStats(statsRes);
        setRegionalFleetCount(vesselsRes?.count || vesselsRes?.vessels?.length || 0);
        setPortMovements(portRes);
        setPortActivity(activityRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "—";

    const parsed = new Date(value.replace(" ", "T"));
    if (Number.isNaN(parsed.getTime())) return value;

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsed);
  };

  const portSummary = portMovements?.summary || {};
  const expectedArrivals = portMovements?.movements?.expected_arrivals || [];
  const inPort = portMovements?.movements?.in_port || [];
  const expectedDepartures = portMovements?.movements?.expected_departures || [];
  const topVesselTypes = portSummary.top_vessel_types || [];
  const activityLabels = portActivity?.labels?.length ? portActivity.labels : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const activitySeries = portActivity?.series?.activity?.length ? portActivity.series.activity : [0, 0, 0, 0, 0, 0, 0];
  const arrivalsSeries = portActivity?.series?.arrivals?.length ? portActivity.series.arrivals : [0, 0, 0, 0, 0, 0, 0];
  const inPortSeries = portActivity?.series?.in_port?.length ? portActivity.series.in_port : [0, 0, 0, 0, 0, 0, 0];
  const departuresSeries = portActivity?.series?.departures?.length ? portActivity.series.departures : [0, 0, 0, 0, 0, 0, 0];

  // --- HELPER: SHOW TOAST ---
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // --- CHART CONFIGURATION ---
  const fleetActivityData = {
    labels: activityLabels,
    datasets: [
      {
        label: "Movimentos portuários",
        data: activitySeries,
        borderColor: "#2e7d32", 
        backgroundColor: "rgba(46, 125, 50, 0.1)", 
        tension: 0.4, 
        fill: true,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#2e7d32",
        pointRadius: 4,
        pointHoverRadius: 6, // ✅ Expands on hover
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false }, 
      tooltip: { 
        backgroundColor: "#1f3c88",
        titleColor: "#fff",
        bodyColor: "#fff",
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            return [
              `Total: ${activitySeries[index] || 0}`,
              `Chegadas: ${arrivalsSeries[index] || 0}`,
              `Em porto: ${inPortSeries[index] || 0}`,
              `Partidas: ${departuresSeries[index] || 0}`,
            ];
          },
        },
      }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: "#f0f0f0" }, beginAtZero: true }
    }
  };

  const cards = [
    { title: "Embarcações monitorizadas", value: regionalFleetCount || 0, icon: "🚢", color: "#1f3c88", trend: `${regionalFleetCount || 0} no contexto Açores`, trendColor: "#2e7d32", desc: "frota regional filtrada", link: "/search" },
    { title: "Navios em Ponta Delgada", value: portSummary.in_port_count || 0, icon: "⚓", color: "#2e7d32", trend: `${portSummary.total_crew_expected || 0} tripulantes`, trendColor: "#2e7d32", desc: "presença operacional atual", link: "/map" },
    { title: "Chegadas previstas (PDL)", value: portSummary.expected_arrivals_count || 0, icon: "📥", color: "#d32f2f", trend: `${portSummary.total_passengers_expected || 0} pax`, trendColor: "#d32f2f", desc: "janela operacional ativa", link: "/dashboard" },
    { title: "Partidas previstas (PDL)", value: portSummary.expected_departures_count || 0, icon: "📤", color: "#f57c00", trend: stats?.active_risks > 0 ? `${stats.active_risks} alertas costeiros` : "Sem alertas críticos", trendColor: "#f57c00", desc: "prioridade porto de Ponta Delgada", link: "/map" },
  ];

  if (loading) return <Loader />;

  return (
    <main className="page" style={{ padding: "20px", background: "#f4f7fa", minHeight: "100vh", position: "relative" }}>
      
      {toast && (
        <div style={{
          position: "fixed",
          top: "80px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "#333",
          color: "white",
          padding: "10px 20px",
          borderRadius: "8px",
          zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "0.9rem",
          animation: "fadeIn 0.3s ease-out"
        }}>
          <span>✅</span> {toast}
        </div>
      )}

      <header className="page__header" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px"}}>
        <div>
            <h1 style={{margin: "0 0 5px 0", color: "#1f3c88", fontSize: "24px"}}>Centro Operacional Marítimo dos Açores</h1>
            <p style={{margin: 0, color: "#666", fontSize: "14px"}}>Monitorização costeira, tráfego interilhas e pressão portuária em tempo real</p>
        </div>
        <div style={{textAlign: "right", display: "flex", alignItems: "center", gap: "15px"}}>
            <span style={{fontSize: "0.85rem", color: "#888"}}>🕒 Última sincronização: agora mesmo</span>
            <span style={{fontSize: "0.85rem", color: "#2e7d32", background: "#e8f5e9", padding: "6px 12px", borderRadius: "20px", fontWeight: "600", border: "1px solid #c8e6c9"}}>● Sistema operacional</span>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "25px" }}>
        {cards.map((card) => (
          <div key={card.title} onClick={() => navigate(card.link)} style={{ background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", borderLeft: `4px solid ${card.color}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", textTransform: "uppercase", fontWeight: "700", color: "#888" }}>{card.title}</p>
              <p style={{ fontSize: "2rem", fontWeight: "700", margin: "0 0 5px 0", color: "#333" }}>{card.value}</p>
              <div style={{ fontSize: "0.85rem", fontWeight: "500", color: "#555" }}><span style={{ color: card.trendColor, fontWeight: "700" }}>{card.trend}</span> <span style={{ color: "#999", marginLeft: "4px", fontWeight: "400" }}>{card.desc}</span></div>
            </div>
            <div style={{ fontSize: "2rem", opacity: 0.2 }}>{card.icon}</div>
          </div>
        ))}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            <section style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", padding: "20px" }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", color: "#333" }}>📈 Atividade Marítima (Últimos 7 dias)</h3>
              <p style={{ margin: "0 0 15px 0", color: "#666", fontSize: "0.85rem" }}>
                Série diária do Porto de Ponta Delgada com chegadas, permanências e partidas observadas em cada snapshot diário.
              </p>
                <div style={{ height: "200px" }}>
                    <Line data={fleetActivityData} options={chartOptions} />
                </div>
            </section>

            <section style={{ background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)", color: "white", borderRadius: "16px", boxShadow: "0 10px 25px rgba(13,71,161,0.18)", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: "0 0 8px 0", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.8 }}>Foco operacional</p>
                  <h3 style={{ margin: 0, fontSize: "1.4rem" }}>Porto de Ponta Delgada</h3>
                  <p style={{ margin: "10px 0 0", maxWidth: "700px", color: "rgba(255,255,255,0.88)", lineHeight: 1.5 }}>
                    Integração direta dos movimentos publicados pelos Portos dos Açores, com prioridade às escalas, permanências e partidas previstas em Ponta Delgada.
                  </p>
                </div>
                <div style={{ minWidth: "220px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: "14px", padding: "16px" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", opacity: 0.8, marginBottom: "6px" }}>Próxima chegada</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700 }}>{portSummary.next_arrival?.vessel_name || "Sem escalas previstas"}</div>
                  <div style={{ fontSize: "0.88rem", marginTop: "4px", color: "rgba(255,255,255,0.88)" }}>{formatDateTime(portSummary.next_arrival?.eta)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "20px" }}>
                <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", opacity: 0.8 }}>Navios em porto</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "6px" }}>{portSummary.in_port_count || 0}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", opacity: 0.8 }}>Chegadas previstas</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "6px" }}>{portSummary.expected_arrivals_count || 0}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", opacity: 0.8 }}>Partidas previstas</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 700, marginTop: "6px" }}>{portSummary.expected_departures_count || 0}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.10)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", opacity: 0.8 }}>Tipologia dominante</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginTop: "8px" }}>{topVesselTypes[0]?.type || "Sem dados"}</div>
                </div>
              </div>
            </section>

            <section style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", padding: "20px" }}>
                <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#333" }}>Próximas chegadas em Ponta Delgada</h3>
              <Link to="/map" style={{ textDecoration: "none", color: "#1f3c88", fontSize: "0.85rem", fontWeight: "600" }}>Ver mapa operacional →</Link>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#888", borderBottom: "1px solid #eee" }}>
                  <th style={{ padding: "12px 12px 12px 0", fontWeight: "600" }}>Embarcação</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Origem</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>ETA</th>
                  <th style={{ padding: "12px", fontWeight: "600" }}>Tipo</th>
                  <th style={{ padding: "12px 0 12px 12px", textAlign: "right", fontWeight: "600" }}>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                      {expectedArrivals.length > 0 ? expectedArrivals.map((movement) => (
                        <tr key={movement.scale} style={{ borderBottom: "1px solid #f9f9f9" }}>
                          <td style={{ padding: "15px 12px 15px 0", fontWeight: "600", color: "#333" }}>{movement.vessel_name}</td>
                          <td style={{ padding: "15px 12px", color: "#666" }}>{movement.origin}</td>
                          <td style={{ padding: "15px 12px", color: "#1f3c88", fontWeight: 600 }}>{formatDateTime(movement.eta)}</td>
                          <td style={{ padding: "15px 12px", color: "#555" }}>{movement.vessel_type}</td>
                          <td style={{ padding: "15px 0 15px 12px", textAlign: "right" }}>
                            <Link to="/map"
                              style={{ background: "white", border: "1px solid #1f3c88", color: "#1f3c88", padding: "6px 12px", borderRadius: "4px", textDecoration: "none", fontSize: "0.8rem", fontWeight: "600", transition: "all 0.2s" }}
                              onMouseOver={(e) => { e.target.style.background = "#1f3c88"; e.target.style.color = "white"; }}
                              onMouseOut={(e) => { e.target.style.background = "white"; e.target.style.color = "#1f3c88"; }}
                            >
                              ⚓ Priorizar porto
                            </Link>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" style={{ padding: "18px 0", color: "#888" }}>Sem chegadas previstas para mostrar neste momento.</td>
                        </tr>
                      )}
                      </tbody>
                  </table>
                </div>
            </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
            
            <section style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", padding: "20px" }}>
            <h3 style={{ margin: "0 0 15px 0", fontSize: "1.1rem", color: "#333" }}>⚡ Ações rápidas</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                    <button 
                        onClick={() => navigate('/map')} 
                        style={{ padding: "12px", border: "1px solid #eee", background: "#f8f9fa", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#555", textAlign: "left", transition: "all 0.2s" }}
                        onMouseOver={(e) => { e.target.style.background = "#e3f2fd"; e.target.style.color = "#1565c0"; }}
                        onMouseOut={(e) => { e.target.style.background = "#f8f9fa"; e.target.style.color = "#555"; }}
                    >
                🗺️ Ver mapa operacional
                    </button>

                    <button 
                        onClick={() => navigate('/search')} 
                        style={{ padding: "12px", border: "1px solid #eee", background: "#f8f9fa", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#555", textAlign: "left", transition: "all 0.2s" }}
                        onMouseOver={(e) => { e.target.style.background = "#e3f2fd"; e.target.style.color = "#1565c0"; }}
                        onMouseOut={(e) => { e.target.style.background = "#f8f9fa"; e.target.style.color = "#555"; }}
                    >
                🔍 Pesquisar embarcações
                    </button>
                    
                    <button 
                onClick={() => showToast("Relatório diário dos Açores gerado com sucesso!")} 
                        style={{ padding: "12px", border: "1px solid #eee", background: "#f8f9fa", borderRadius: "8px", cursor: "pointer", fontWeight: "600", color: "#555", textAlign: "left", transition: "all 0.2s" }}
                        onMouseOver={(e) => { e.target.style.background = "#e3f2fd"; e.target.style.color = "#1565c0"; }}
                        onMouseOut={(e) => { e.target.style.background = "#f8f9fa"; e.target.style.color = "#555"; }}
                    >
                📊 Gerar relatório diário
                    </button>

                </div>
            </section>

            <section style={{ background: "white", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.1rem", color: "#333" }}>⚓ Porto de Ponta Delgada em detalhe</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "400px", overflowY: "auto" }}>
                    <div style={{ background: "#e3f2fd", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #1e88e5" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1565c0", marginBottom: "4px" }}>Navios atualmente em porto</div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#0d47a1" }}>{inPort.length > 0 ? inPort.map((movement) => movement.vessel_name).join(", ") : "Sem navios atualmente registados em porto."}</p>
                      <small style={{ color: "#64b5f6", fontSize: "0.75rem", marginTop: "5px", display: "block" }}>Fonte: Portos dos Açores</small>
                    </div>

                    <div style={{ background: "#fff3e0", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #ffa726" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#ef6c00", marginBottom: "4px" }}>Próxima partida prevista</div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#e65100" }}>
                        {portSummary.next_departure?.vessel_name ? `${portSummary.next_departure.vessel_name} com ETD ${formatDateTime(portSummary.next_departure.etd)}` : "Sem partidas previstas no horizonte imediato."}
                      </p>
                      <small style={{ color: "#ffb74d", fontSize: "0.75rem", marginTop: "5px", display: "block" }}>Planeamento do cais em Ponta Delgada</small>
                    </div>

                    <div style={{ background: "#e8f5e9", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #66bb6a" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#2e7d32", marginBottom: "4px" }}>Tipologias em destaque</div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#1b5e20" }}>
                        {topVesselTypes.length > 0
                          ? topVesselTypes.map((item) => `${item.type} (${item.count})`).join(" · ")
                          : "Sem dados suficientes para destacar tipologias."}
                      </p>
                      <small style={{ color: "#81c784", fontSize: "0.75rem", marginTop: "5px", display: "block" }}>Leitura operacional por categoria de navio</small>
                    </div>

                    <div style={{ background: "#f3e5f5", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #ab47bc" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#7b1fa2", marginBottom: "4px" }}>Próximas partidas do porto</div>
                      <div style={{ display: "grid", gap: "8px" }}>
                        {expectedDepartures.slice(0, 3).length > 0 ? expectedDepartures.slice(0, 3).map((movement) => (
                          <div key={movement.scale} style={{ fontSize: "0.82rem", color: "#6a1b9a" }}>
                            <strong>{movement.vessel_name}</strong> → {movement.destination} <span style={{ opacity: 0.75 }}>({formatDateTime(movement.etd)})</span>
                          </div>
                        )) : <div style={{ fontSize: "0.82rem", color: "#6a1b9a" }}>Sem partidas programadas para mostrar.</div>}
                      </div>
                    </div>
                </div>
            </section>
        </div>
      </div>
    </main>
  );
}
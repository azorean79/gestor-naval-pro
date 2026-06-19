import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AlertsPage.css"; 

// ✅ CHANGED: Point to Render Backend
const API_BASE = "https://maritime-backend-0521.onrender.com/api"; 

// --- HELPER: Parse Data cleanly ---
const parseMessage = (msg) => {
    const portMatch = msg.match(/Port of (.*?) congestion/i);
    const congMatch = msg.match(/at (\d+%)/);
    const waitMatch = msg.match(/Wait time (\d+\.?\d*h)/);
    
    return {
        port: portMatch ? portMatch[1] : "Porto desconhecido",
        congestionVal: congMatch ? parseInt(congMatch[1]) : 0,
        waitString: waitMatch ? waitMatch[1] : "--",
        waitVal: waitMatch ? parseFloat(waitMatch[1]) : 0
    };
};

// ... (Rest of the file remains exactly the same) ...
// Just keep the rest of your logic below the API_BASE line.

const formatTime = (isoString) => new Date(isoString).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const isRecent = (dateString) => {
    const alertDate = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - alertDate) / (1000 * 60 * 60);
    return diffInHours <= 24;
};

const AlertsPage = () => {
  const navigate = useNavigate();

  // --- 1. STATE MANAGEMENT ---
  const [userRole, setUserRole] = useState("OPERATOR"); 
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // View Controls
  const [consolidateView, setConsolidateView] = useState(true); 
  const [filterSeverity, setFilterSeverity] = useState("all"); 
  const [selectedAlert, setSelectedAlert] = useState(null); 

  // --- 2. WORKFLOW ENGINE ---
  const [workflowData, setWorkflowData] = useState(() => JSON.parse(localStorage.getItem("alertWorkflow") || "{}"));

  // --- 3. ACTIONS & LOGIC ---
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const STATUS_LABELS = {
        NEW: "Novo",
        ACK: "Assinalado",
        RESOLVED: "Resolvido",
    };

  const updateStatus = (id, newStatus) => {
    if (userRole === 'ANALYST' && newStatus !== 'NEW') return; 

    const timestamp = new Date().toISOString();
    const prevData = workflowData[id] || { history: [] };
    
    const newData = {
        status: newStatus,
        assignee: userRole === 'OPERATOR' ? 'Me' : prevData.assignee,
        history: [
            { action: `Estado alterado para ${STATUS_LABELS[newStatus]}`, user: userRole, time: timestamp },
            ...prevData.history
        ]
    };

    const updatedWorkflow = { ...workflowData, [id]: newData };
    setWorkflowData(updatedWorkflow);
    localStorage.setItem("alertWorkflow", JSON.stringify(updatedWorkflow));
        showToast(`🔄 Alerta movido para ${STATUS_LABELS[newStatus]}`);
  };

  const kpis = useMemo(() => {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const waitTimes = alerts.map(a => parseMessage(a.message).waitVal).filter(v => v > 0);
    const avgWait = waitTimes.length ? (waitTimes.reduce((a,b)=>a+b,0) / waitTimes.length).toFixed(1) : "0";

    const portCounts = {};
    alerts.forEach(a => {
        const p = parseMessage(a.message).port;
        if(p !== "Porto desconhecido") portCounts[p] = (portCounts[p] || 0) + 1;
    });
    const worstPort = Object.keys(portCounts).reduce((a, b) => portCounts[a] > portCounts[b] ? a : b, "-");

    return { criticalCount, avgWait, worstPort };
  }, [alerts]);

  // Load Data
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/alerts/?page_size=100`);
      const data = await res.json();
      setAlerts(data.results);
    } catch (err) { console.error("Load failed", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // --- 4. SMART FILTERING ---
  const processedAlerts = useMemo(() => {
    let result = alerts;

    if (filterSeverity !== 'all') {
        result = result.filter(a => a.severity === filterSeverity);
    }

    if (consolidateView) {
        const portMap = new Map();
        result.forEach(alert => {
            const { port } = parseMessage(alert.message);
            const current = portMap.get(port);
            if (!current || (alert.severity === 'critical' && current.severity !== 'critical')) {
                portMap.set(port, alert);
            }
        });
        result = Array.from(portMap.values());
    }

    return result;
  }, [alerts, filterSeverity, consolidateView]);

  return (
    <div className="operator-layout">
      {toast && <div className="toast-notification">{toast}</div>}

      <div className="kpi-deck">
        <div className={`kpi-card critical ${filterSeverity === 'critical' ? 'active' : ''}`} 
             onClick={() => setFilterSeverity(filterSeverity === 'critical' ? 'all' : 'critical')}>
            <div className="kpi-icon">🚨</div>
            <div className="kpi-data">
                <span className="kpi-val">{kpis.criticalCount}</span>
                <span className="kpi-label">Críticos ativos</span>
            </div>
            <div className="kpi-hint">Clicar para filtrar</div>
        </div>

        <div className="kpi-card info">
            <div className="kpi-icon">⏱️</div>
            <div className="kpi-data">
                <span className="kpi-val">{kpis.avgWait}h</span>
                <span className="kpi-label">Espera média da frota</span>
            </div>
        </div>

        <div className="kpi-card warning">
            <div className="kpi-icon">⚓</div>
            <div className="kpi-data">
                <span className="kpi-val small">{kpis.worstPort}</span>
                <span className="kpi-label">Maior pressão portuária</span>
            </div>
        </div>
      </div>

      <div className="control-bar">
        <div className="view-toggles">
            <button className={`view-btn ${!consolidateView ? 'active' : ''}`} onClick={() => setConsolidateView(false)}>
                Fluxo bruto
            </button>
            <button className={`view-btn ${consolidateView ? 'active' : ''}`} onClick={() => setConsolidateView(true)}>
                ✨ Agrupamento inteligente
            </button>
        </div>
        
        <div className="refresh-control">
            <span>Última atualização: {new Date().toLocaleTimeString()}</span>
            <button onClick={loadAlerts}>↻ Atualizar</button>
        </div>
      </div>

      <div className={`workspace ${selectedAlert ? 'split' : ''}`}>
        <div className="alert-list-container">
            {loading ? <div className="loading-state">A ligar ao fluxo costeiro dos Açores...</div> : (
                <table className="alert-table">
                    <thead>
                        <tr>
                            <th width="40px"></th>
                            <th>Porto / Embarcação</th>
                            <th>Resumo</th>
                            <th>Estado</th>
                            <th>Detetado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedAlerts.map(alert => {
                            const { port, congestionVal, waitString } = parseMessage(alert.message);
                            const wf = workflowData[alert.id] || { status: 'NEW' };
                            const recent = isRecent(alert.timestamp);
                            
                            return (
                                <tr 
                                    key={alert.id} 
                                    className={`alert-row ${alert.severity} ${selectedAlert?.id === alert.id ? 'focused' : ''}`}
                                    onClick={() => setSelectedAlert(alert)}
                                >
                                    <td><div className={`sev-dot ${alert.severity}`}></div></td>
                                    <td className="fw-bold">
                                        {port}
                                        {recent && <span className="badge-new">✨ NOVO</span>}
                                    </td>
                                    <td>
                                        <div className="issue-main">Congestionamento a {congestionVal}%</div>
                                        <div className="issue-sub">Espera estimada: {waitString}</div>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${wf.status.toLowerCase()}`}>
                                            {STATUS_LABELS[wf.status] || wf.status}
                                        </span>
                                    </td>
                                    <td className="time-col">{formatTime(alert.timestamp)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>

        {selectedAlert && (
            <div className="action-drawer">
                <div className="drawer-header">
                    <h3>Centro de Ocorrências</h3>
                    <button className="close-btn" onClick={() => setSelectedAlert(null)}>×</button>
                </div>

                <div className="drawer-content">
                    <div className="alert-full-text">
                        {selectedAlert.message}
                    </div>

                    <div className="workflow-controls">
                        <label>Estado atual</label>
                        <div className="status-stepper">
                            {['NEW', 'ACK', 'RESOLVED'].map(step => {
                                const current = workflowData[selectedAlert.id]?.status || 'NEW';
                                return (
                                    <button 
                                        key={step}
                                        className={`step-btn ${current === step ? 'active' : ''}`}
                                        onClick={() => updateStatus(selectedAlert.id, step)}
                                        disabled={userRole === 'ANALYST'}
                                    >
                                        {STATUS_LABELS[step]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="action-buttons">
                        {userRole === 'OPERATOR' && (
                            <>
                                <button className="btn-primary" onClick={() => updateStatus(selectedAlert.id, 'ACK')}>
                                    ✅ Assinalar e atribuir-me
                                </button>
                                <button className="btn-warning" onClick={() => showToast("⚠️ Escalado para a autoridade portuária")}>
                                    📢 Escalar
                                </button>
                            </>
                        )}
                        <button className="btn-secondary" onClick={() => navigate('/map')}>
                            📍 Ver no mapa
                        </button>
                    </div>

                    <div className="audit-section">
                        <h4>Histórico de auditoria</h4>
                        <div className="audit-list">
                            {(workflowData[selectedAlert.id]?.history || []).map((log, i) => (
                                <div key={i} className="audit-item">
                                    <span className="audit-user">{log.user}</span>
                                    <span className="audit-action">{log.action}</span>
                                    <span className="audit-time">{formatTime(log.time)}</span>
                                </div>
                            ))}
                            <div className="audit-item start">Alerta gerado automaticamente pelo sistema</div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      <div className="dev-footer">
        <span>🔧 <strong>Modo de demonstração:</strong> Simulação de perfil</span>
        <select value={userRole} onChange={(e) => setUserRole(e.target.value)}>
            <option value="OPERATOR">Operador (acesso total)</option>
            <option value="ANALYST">Analista (consulta)</option>
            <option value="ADMIN">Administrador</option>
        </select>
      </div>

    </div>
  );
};

export default AlertsPage;
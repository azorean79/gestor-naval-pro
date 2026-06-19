import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { fetchVesselById } from "../api/api";

const getFlagLabel = (flag) => {
  if (!flag) return "Sem bandeira";
  const normalized = String(flag).trim().toLowerCase();
  if (["portugal", "pt", "prt", "portuguesa", "portuguese"].includes(normalized)) {
    return "🇵🇹 Portuguesa";
  }
  return flag;
};

export default function ShipDetails() {
  const { id } = useParams();
  const [vessel, setVessel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVesselById(id)
      .then(data => setVessel(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!vessel) return <div className="page"><h3>Embarcação não encontrada</h3></div>;

  return (
    <main className="page">
      <header className="page__header">
        <h1>{vessel.name}</h1>
        <p>IMO: {vessel.imo_number || "N/D"} | MMSI: {vessel.mmsi || "N/D"}</p>
      </header>

      <section className="card detail-grid">
        <div>
          <h3>Estado</h3>
          <span className={`status-chip ${vessel.speed > 0.5 ? '' : 'docked'}`}>
             {vessel.speed > 0.5 ? "Em movimento" : "Fundeado"}
          </span>
        </div>
        <div>
          <h3>Velocidade atual</h3>
          <p style={{fontSize: "1.5rem", fontWeight: "bold"}}>{vessel.speed || 0} kn</p>
        </div>
        <div>
          <h3>Coordenadas</h3>
          <p>{vessel.last_position_lat?.toFixed(4)}, {vessel.last_position_lon?.toFixed(4)}</p>
        </div>
        <div>
          <h3>Operador</h3>
          <p>{vessel.operator}</p>
        </div>
      </section>

      <section className="card" style={{marginTop: "20px"}}>
         <h3>Dados da embarcação</h3>
         <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px"}}>
          <div><strong>MMSI:</strong> {vessel.mmsi || "N/D"}</div>
            <div><strong>Bandeira:</strong> {getFlagLabel(vessel.flag)}</div>
            <div><strong>Tipo:</strong> {vessel.type}</div>
          <div><strong>Indicativo de chamada:</strong> {vessel.call_sign || "N/D"}</div>
            <div><strong>Carga:</strong> {vessel.cargo_type || "N/D"}</div>
            <div><strong>Última atualização:</strong> {new Date(vessel.last_update).toLocaleString()}</div>
         </div>
      </section>

      <div style={{marginTop: "20px", display: "flex", gap: "10px"}}>
        <Link to="/search" className="ghost-btn">← Voltar à pesquisa</Link>
        <Link to="/map" className="ghost-btn">Ver mapa operacional</Link>
      </div>
    </main>
  );
}
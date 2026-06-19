import React from "react";

const getFlagLabel = (flag) => {
  if (!flag) return "—";
  const normalized = String(flag).trim().toLowerCase();
  if (["portugal", "pt", "prt", "portuguesa", "portuguese"].includes(normalized)) {
    return "🇵🇹 Portuguesa";
  }
  return flag;
};

export default function ShipCard({ vessel }) {
  if (!vessel) return <div className="loader">Loading...</div>;

  return (
    <div className="ship-card">
      <div className="ship-card__header">
        <h3>{vessel.name || "Embarcação sem nome"}</h3>
        <span className="status">{vessel.type || "N/D"}</span>
      </div>
      
      <div className="ship-card__row">
        <span>IMO:</span>
        <span>{vessel.imo_number || "—"}</span>
      </div>
      
      <div className="ship-card__row">
        <span>Bandeira:</span>
        <span>{getFlagLabel(vessel.flag)}</span>
      </div>
      
      <div className="ship-card__row">
        <span>Operador:</span>
        <span>{vessel.operator || "—"}</span>
      </div>

      <div className="ship-card__row">
        <span>Cargo:</span>
        <span>{vessel.cargo_type || "—"}</span>
      </div>
    </div>
  );
}
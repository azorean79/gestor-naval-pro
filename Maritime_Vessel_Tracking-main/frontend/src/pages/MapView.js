import React from "react";
import MapComponent from "../components/MapComponent"; // Check your file path

export default function MapView() {
  return (
    <main className="page">
      <header className="page__header">
        <h1>Mapa Marítimo dos Açores</h1>
        <p style={{ margin: "8px 0 0", color: "#666" }}>Acompanhamento operacional das embarcações, portos e alertas do arquipélago, com prioridade ao Porto de Ponta Delgada.</p>
      </header>
      <section className="map-wrapper">
        <MapComponent center={[38.55, -28.15]} zoom={8} />
      </section>
    </main>
  );
}
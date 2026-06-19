import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import { refreshPortMovementsOnAppOpen } from "./api/api";

// --- Import Pages ---
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import VesselSearch from "./pages/VesselSearch";
import ShipDetails from "./pages/ShipDetails";
import VoyageReplay from "./pages/VoyageReplay";
import AnalystDashboard from "./pages/AnalystDashboard"; 
import AdminPanel from "./pages/AdminPanel"; 
import AlertsPage from "./pages/AlertsPage"; // ✅ 1. IMPORT THIS

export default function App() {
  useEffect(() => {
    refreshPortMovementsOnAppOpen().catch((error) => {
      console.error("Não foi possível atualizar os movimentos portuários ao abrir a aplicação:", error);
    });
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />

          {/* Core App */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/search" element={<VesselSearch />} />
          <Route path="/ship/:id" element={<ShipDetails />} />
          <Route path="/playback" element={<VoyageReplay />} />
          
          {/* ✅ 2. ADD THIS ROUTE */}
          <Route path="/alerts" element={<AlertsPage />} />

          {/* Role-Based Dashboards */}
          <Route path="/analyst" element={<AnalystDashboard />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}
import React from "react";
import { NavLink } from "react-router-dom"; 
import "./Navbar.css";

export default function Navbar() {
  const rawRole = localStorage.getItem("userRole");
  const userRole = rawRole ? rawRole.toLowerCase() : "";

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span role="img" aria-label="ship" className="navbar__logo">🚢</span>
        Observatório Marítimo dos Açores
      </div>

      <div className="navbar__links">
        <NavLink to="/dashboard">Painel</NavLink>
        <NavLink to="/map">Mapa</NavLink>
        <NavLink to="/search">Embarcações</NavLink>
        
        <NavLink to="/playback">Reprodução de Rotas</NavLink>
        <NavLink to="/alerts">Alertas</NavLink>

        {userRole === "analyst" && (
          <NavLink to="/analyst" className="special-link">Centro Analítico</NavLink>
        )}

        {userRole === "admin" && (
           <NavLink to="/admin-panel" className="nav-link-admin">Administração</NavLink>
        )}
      </div>
    </nav>
  );
}
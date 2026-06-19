import React, { useEffect, useState } from "react";
import { createLocalVessel, deleteLocalVessels, editLocalVessel, fetchLiveVessels, isCustomVessel } from "../api/api"; 
import ShipCard from "../components/ShipCard";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";

const getFlagLabel = (flag) => {
  if (!flag) return "Sem bandeira";
  const normalized = String(flag).trim().toLowerCase();
  if (["portugal", "pt", "prt", "portuguesa", "portuguese"].includes(normalized)) {
    return "🇵🇹 Portuguesa";
  }
  return flag;
};

export default function VesselSearch() {
  const emptyForm = {
    name: "",
    type: "Fishing Vessel",
    flag: "Portugal",
    imo_number: "",
    mmsi: "",
    call_sign: "",
    cargo_type: "",
    operator: "",
    destination: "",
    eta: "Por definir",
    last_position_lat: "",
    last_position_lon: "",
    speed: "0",
    course: "0",
  };

  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos os tipos");
  const [selectedFlag, setSelectedFlag] = useState("Todas as bandeiras");
  const [sortOrder, setSortOrder] = useState("Nome (A-Z)");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; 

  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShipId, setEditingShipId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadVessels = () => {
    setLoading(true);
    fetchLiveVessels()
      .then((data) => {
        if (data.vessels) {
          setVessels(data.vessels);
        } else if (Array.isArray(data)) {
          setVessels(data);
        }
      })
      .catch(err => console.error("Search fetch error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVessels();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedShip(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const uniqueFlags = ["Todas as bandeiras", ...new Set(vessels.map(v => v.flag).filter(Boolean))].sort();
  const uniqueTypes = ["Todos os tipos", ...new Set(vessels.map(v => v.type).filter(Boolean))].sort();

  const filtered = vessels.filter(ship => {
    const matchesSearch = (ship.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ship.imo_number?.includes(searchTerm));
    const matchesType = selectedType === "Todos os tipos" || ship.type === selectedType;
    const matchesFlag = selectedFlag === "Todas as bandeiras" || ship.flag === selectedFlag;
    return matchesSearch && matchesType && matchesFlag;
  });

  const sortedVessels = [...filtered].sort((a, b) => {
    if (sortOrder === "Nome (A-Z)") return a.name.localeCompare(b.name);
    if (sortOrder === "Nome (Z-A)") return b.name.localeCompare(a.name);
    if (sortOrder === "Tipo") return a.type.localeCompare(b.type);
    if (sortOrder === "Bandeira") return a.flag.localeCompare(b.flag);
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedVessels.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedVessels.length / itemsPerPage);
  const selectableVisibleIds = sortedVessels.filter((ship) => isCustomVessel(ship)).map((ship) => String(ship.id));
  const selectedVisibleCount = selectedIds.filter((id) => selectableVisibleIds.includes(id)).length;
  const allVisibleSelected = selectableVisibleIds.length > 0 && selectedVisibleCount === selectableVisibleIds.length;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedFlag]);


  const handleSearchEnter = (e) => {
    if (e.key === "Enter" && sortedVessels.length > 0) {
        setSelectedShip(sortedVessels[0]);
        e.target.blur();
    }
  };

  const handleTrack = () => {
    navigate("/map"); 
  };

  const toggleShipSelection = (shipId) => {
    const id = String(shipId);
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !selectableVisibleIds.includes(id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...selectableVisibleIds])]);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    deleteLocalVessels(selectedIds);
    setSelectedIds([]);
    if (selectedShip && selectedIds.includes(String(selectedShip.id))) {
      setSelectedShip(null);
    }
    loadVessels();
  };

  const openCreateForm = () => {
    setEditingShipId(null);
    setFormData(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (ship) => {
    setEditingShipId(ship.id);
    setFormData({
      name: ship.name || "",
      type: ship.type || "Fishing Vessel",
      flag: ship.flag || "Portugal",
      imo_number: ship.imo_number || "",
      mmsi: ship.mmsi || "",
      call_sign: ship.call_sign || "",
      cargo_type: ship.cargo_type || "",
      operator: ship.operator || "",
      destination: ship.destination || "",
      eta: ship.eta || "Por definir",
      last_position_lat: ship.last_position_lat ?? "",
      last_position_lon: ship.last_position_lon ?? "",
      speed: ship.speed ?? "0",
      course: ship.course ?? "0",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingShipId(null);
    setFormData(emptyForm);
  };

  const handleFormChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSaveVessel = () => {
    if (!formData.name.trim()) return;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      type: formData.type.trim() || "Fishing Vessel",
      flag: formData.flag.trim() || "Portugal",
      imo_number: formData.imo_number.trim(),
      mmsi: formData.mmsi.trim(),
      call_sign: formData.call_sign.trim(),
      cargo_type: formData.cargo_type.trim(),
      operator: formData.operator.trim() || "Operador local",
      destination: formData.destination.trim() || "Por definir",
      eta: formData.eta.trim() || "Por definir",
      last_position_lat: formData.last_position_lat === "" ? null : Number(formData.last_position_lat),
      last_position_lon: formData.last_position_lon === "" ? null : Number(formData.last_position_lon),
      speed: formData.speed === "" ? null : Number(formData.speed),
      course: formData.course === "" ? null : Number(formData.course),
    };

    if (editingShipId) {
      editLocalVessel(editingShipId, payload);
      if (selectedShip && String(selectedShip.id) === String(editingShipId)) {
        setSelectedShip({ ...selectedShip, ...payload });
      }
    } else {
      createLocalVessel(payload);
    }

    closeForm();
    loadVessels();
  };

  const getShipDetails = (ship) => {
    if (!ship) return {};
    
    let displaySpeed = Number(ship.speed || 0);
    if (displaySpeed < 0.1) displaySpeed = (Math.random() * (18 - 8.5) + 8.5);
    
    const heading = ship.course || Math.floor(Math.random() * 360);
    const shipType = (ship.type || "").toLowerCase();
    const isHighRisk = shipType.includes("tanker") || shipType.includes("hazard");
    const isMoving = displaySpeed > 0.5;

    return {
        speed: displaySpeed.toFixed(1),
        heading: heading,
        risk: isHighRisk,
        status: isMoving ? "Em movimento" : "Fundeado",
        dest: ship.destination || "Por definir",
        eta: ship.eta || "Hoje, 18:00"
    };
  };

  if (loading) return <Loader />;

  return (
    <main className="page" style={{ position: "relative", paddingBottom: "80px" }}>
      
      <header className="page__header" style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
        <div>
            <h1>Pesquisa de Embarcações</h1>
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
                A acompanhar <strong style={{color: "#1f3c88"}}>{sortedVessels.length}</strong> de {vessels.length} embarcações na plataforma regional
            </p>
        </div>
      </header>
      
      <section className="card" style={{ marginBottom: "20px", padding: "20px" }}>
        <div className="filters" style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          
          <div style={{ flex: 2, minWidth: "250px" }}>
             <label style={{display:"block", marginBottom:"5px", fontSize:"0.8rem", fontWeight:"700", color: "#555"}}>PESQUISAR EMBARCAÇÃO</label>
             <input 
               type="text" 
               placeholder="Pesquisar por nome ou IMO..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               onKeyDown={handleSearchEnter}
               style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem" }}
             />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{display:"block", marginBottom:"5px", fontSize:"0.8rem", fontWeight:"700", color: "#555"}}>TIPO DE EMBARCAÇÃO</label>
            <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{display:"block", marginBottom:"5px", fontSize:"0.8rem", fontWeight:"700", color: "#555"}}>BANDEIRA</label>
            <select value={selectedFlag} onChange={(e) => setSelectedFlag(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>
              {uniqueFlags.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{display:"block", marginBottom:"5px", fontSize:"0.8rem", fontWeight:"700", color: "#555"}}>ORDENAR POR</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "#f8f9fa", cursor: "pointer", fontWeight: "600" }}>
              <option>Nome (A-Z)</option>
              <option>Nome (Z-A)</option>
              <option>Tipo</option>
              <option>Bandeira</option>
            </select>
          </div>

        </div>
      </section>

      <section className="card" style={{ marginBottom: "20px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
        <div style={{ color: "#555", fontSize: "0.9rem" }}>
          <strong>{selectedIds.length}</strong> embarcação(ões) local(is) selecionada(s)
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="ghost-btn"
            onClick={openCreateForm}
          >
            + Adicionar embarcação
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleSelectAll}
            disabled={selectableVisibleIds.length === 0}
          >
            {allVisibleSelected ? "Limpar seleção" : "Selecionar todas"}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            style={{ borderColor: selectedIds.length ? "#d32f2f" : undefined, color: selectedIds.length ? "#d32f2f" : undefined }}
          >
            Apagar selecionadas
          </button>
        </div>
      </section>

      <section className="grid grid--cards">
        {currentItems.length > 0 ? (
          currentItems.map((ship) => {
            const details = getShipDetails(ship);
            const isRisk = details.risk;
            const isLocalShip = isCustomVessel(ship);
            const isSelected = selectedIds.includes(String(ship.id));

            return (
                <div 
                    key={ship.id} 
                    style={{ 
                        position: "relative",
                        cursor: "pointer", 
                        transition: "all 0.2s",
                        border: isRisk ? "1px solid #ffcdd2" : "1px solid transparent", 
                        borderRadius: "12px",
                        boxShadow: isSelected ? "0 0 0 3px rgba(31, 60, 136, 0.18)" : (isRisk ? "0 0 10px rgba(220, 53, 69, 0.15)" : "none")
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-4px)"}
                    onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
                >
                    {isLocalShip && (
                      <label style={{ position: "absolute", top: "10px", left: "10px", zIndex: 3, display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.95)", padding: "4px 8px", borderRadius: "999px", border: "1px solid #dbe4ff", fontSize: "0.75rem", color: "#1f3c88", fontWeight: 600 }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleShipSelection(ship.id)}
                        />
                        Local
                      </label>
                    )}

                    {isRisk && (
                      <div style={{position: "absolute", top: "10px", right: "10px", fontSize: "1.2rem", zIndex: 2}} title="Embarcação em monitorização reforçada">
                            ⚠️
                        </div>
                    )}

                    <div onClick={() => setSelectedShip(ship)}>
                        <ShipCard vessel={ship} />
                    </div>

                    <div style={{ padding: "0 20px 15px 20px", marginTop: "-10px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "5px" }}>
                            {isLocalShip && (
                              <button onClick={(e) => { e.stopPropagation(); openEditForm(ship); }} className="ghost-btn" style={{padding: "4px 8px", fontSize: "0.7rem"}}>Editar</button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); navigate("/map"); }} className="ghost-btn" style={{padding: "4px 8px", fontSize: "0.7rem"}}>Acompanhar</button>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedShip(ship); }} className="ghost-btn" style={{padding: "4px 8px", fontSize: "0.7rem"}}>Detalhes</button>
                        </div>
                    </div>
                </div>
            );
          })
        ) : (
          <div style={{gridColumn: "1/-1", textAlign:"center", padding:"60px", color:"#888", background: "white", borderRadius: "12px"}}>
            <h3>Nenhuma embarcação encontrada</h3>
            <p>Tenta ajustar os filtros de pesquisa.</p>
          </div>
        )}
      </section>

      {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "30px" }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                className="ghost-btn"
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                  ← Anterior
              </button>
              
              <span style={{ display: "flex", alignItems: "center", fontWeight: "bold", color: "#555" }}>
                  Página {currentPage} de {totalPages}
              </span>

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="ghost-btn"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                  Seguinte →
              </button>
          </div>
      )}

      {selectedShip && (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center",
            backdropFilter: "blur(4px)"
        }} onClick={() => setSelectedShip(null)}>
            
            <div style={{
                background: "white", width: "500px", borderRadius: "16px", padding: "30px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.3)", position: "relative",
                animation: "popIn 0.2s ease-out"
            }} onClick={(e) => e.stopPropagation()}>
                
                <button 
                    onClick={() => setSelectedShip(null)}
                    style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#aaa" }}
                >
                    &times;
                </button>

                <div style={{borderBottom: "1px solid #eee", paddingBottom: "15px", marginBottom: "20px"}}>
                    <h2 style={{ margin: "0 0 8px 0", color: "#1f3c88", fontSize: "24px" }}>{selectedShip.name}</h2>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.85rem", background: "#e3f2fd", color: "#1565c0", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold" }}>
                            {selectedShip.type}
                        </span>
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>Bandeira {getFlagLabel(selectedShip.flag)}</span>
                        {getShipDetails(selectedShip).risk && (
                            <span style={{ fontSize: "0.85rem", background: "#ffebee", color: "#d32f2f", padding: "4px 10px", borderRadius: "6px", border: "1px solid #ffcdd2", fontWeight: "bold" }}>
                          ⚠ MONITORIZAÇÃO
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>NÚMERO IMO</div>
                        <div style={{ fontSize: "1rem", color: "#333", fontWeight: "600" }}>{selectedShip.imo_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>MMSI</div>
                        <div style={{ fontSize: "1rem", color: "#333", fontWeight: "600" }}>{selectedShip.mmsi || "N/D"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>CALL SIGN</div>
                        <div style={{ fontSize: "1rem", color: "#333", fontWeight: "600" }}>{selectedShip.call_sign || "N/D"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>VELOCIDADE ATUAL</div>
                        <div style={{ fontSize: "1rem", color: "#333", fontWeight: "600" }}>{getShipDetails(selectedShip).speed} knots</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>RUMO</div>
                        <div style={{ fontSize: "1rem", color: "#333", fontWeight: "600" }}>{getShipDetails(selectedShip).heading}° ⬆</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>ESTADO</div>
                        <div style={{ color: Number(getShipDetails(selectedShip).speed) > 0.5 ? "#2e7d32" : "#e65100", fontWeight: "bold", fontSize: "1rem" }}>
                        {Number(getShipDetails(selectedShip).speed) > 0.5 ? "Em movimento" : "Fundeado"}
                        </div>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={{ fontSize: "0.75rem", color: "#888", fontWeight: "700", marginBottom: "4px" }}>DESTINO E ETA</div>
                        <div style={{ fontSize: "1rem", color: "#333" }}>
                            {getShipDetails(selectedShip).dest} <span style={{color:"#ccc", margin:"0 5px"}}>—</span> {getShipDetails(selectedShip).eta}
                        </div>
                    </div>
                </div>

                <div style={{fontSize: "0.8rem", color: "#999", marginBottom: "20px", fontStyle: "italic"}}>
                    Última posição recebida: {new Date().toLocaleTimeString()}
                </div>

                <button 
                    onClick={handleTrack}
                    style={{ width: "100%", padding: "14px", background: "#1f3c88", color: "white", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", gap: "10px", transition: "background 0.2s" }}
                    onMouseOver={(e) => e.target.style.background = "#152b69"}
                    onMouseOut={(e) => e.target.style.background = "#1f3c88"}
                >
                    📍 Ver embarcação no mapa
                </button>

            </div>
        </div>
      )}

      {isFormOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
          }}
          onClick={closeForm}
        >
          <div
            style={{ background: "white", width: "min(860px, 100%)", borderRadius: "16px", padding: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ margin: 0, color: "#1f3c88" }}>{editingShipId ? "Editar embarcação local" : "Adicionar embarcação local"}</h2>
                <p style={{ margin: "6px 0 0", color: "#666", fontSize: "0.9rem" }}>Os dados ficam guardados localmente neste navegador.</p>
              </div>
              <button onClick={closeForm} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#888" }}>&times;</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px 18px" }}>
              {[
                ["Nome", "name", "text"],
                ["Tipo", "type", "text"],
                ["Bandeira", "flag", "text"],
                ["IMO", "imo_number", "text"],
                ["MMSI", "mmsi", "text"],
                ["Call sign", "call_sign", "text"],
                ["Carga", "cargo_type", "text"],
                ["Operador", "operator", "text"],
                ["Destino", "destination", "text"],
                ["ETA", "eta", "text"],
                ["Latitude", "last_position_lat", "number"],
                ["Longitude", "last_position_lon", "number"],
                ["Velocidade", "speed", "number"],
                ["Rumo", "course", "number"],
              ].map(([label, field, type]) => (
                <label key={field} style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.85rem", fontWeight: 600, color: "#444" }}>
                  {label}
                  <input
                    type={type}
                    value={formData[field]}
                    onChange={(e) => handleFormChange(field, e.target.value)}
                    style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid #d8d8d8", fontSize: "0.95rem" }}
                  />
                </label>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <button type="button" className="ghost-btn" onClick={closeForm}>Cancelar</button>
              <button type="button" className="ghost-btn" onClick={handleSaveVessel} style={{ background: "#1f3c88", color: "white", borderColor: "#1f3c88" }}>
                {editingShipId ? "Guardar alterações" : "Criar embarcação"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
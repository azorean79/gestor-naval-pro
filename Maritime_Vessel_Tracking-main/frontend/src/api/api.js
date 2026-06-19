// src/api/api.js

import {
  addCustomVessel,
  deleteCustomVesselsByIds,
  getCustomVesselById,
  getCustomVessels,
  isCustomVesselId,
  updateCustomVessel,
} from "../data/customVessels";
import { filterAzoresVessels, isAzoresVessel } from "../data/azoresRegion";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "https://maritime-backend-0521.onrender.com/api";

// ✅ FIXED: Add the Authorization Token to headers
const getHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    "Authorization": token ? `Bearer ${token}` : "" 
  };
};

// --- DATA FETCHING ---

export async function fetchLiveVessels() {
  const customVessels = getCustomVessels();
  try {
    const res = await fetch(`${API_BASE}/vessels/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch vessels");
    const data = await res.json();
    const apiVessels = Array.isArray(data) ? data : (data.vessels || []);
    const regionalApiVessels = filterAzoresVessels(apiVessels);

    return {
      ...(Array.isArray(data) ? {} : data),
      count: regionalApiVessels.length + customVessels.length,
      vessels: [...customVessels, ...regionalApiVessels],
    };
  } catch (err) {
    console.error("API Error (Vessels):", err);
    return {
      count: customVessels.length,
      vessels: [...customVessels],
    };
  }
}

export async function fetchVesselById(vesselId) {
  const localVessel = getCustomVesselById(vesselId);
  if (localVessel) {
    return localVessel;
  }

  const res = await fetch(`${API_BASE}/vessels/${vesselId}/`, { headers: getHeaders() });
  if (!res.ok) throw new Error("Failed to fetch vessel details");
  const vessel = await res.json();
  if (!isAzoresVessel(vessel)) {
    throw new Error("A embarcação selecionada não pertence ao contexto operacional dos Açores");
  }
  return vessel;
}

export function isCustomVessel(vessel) {
  return Boolean(vessel?.id) && isCustomVesselId(vessel.id);
}

export function deleteLocalVessels(ids) {
  return deleteCustomVesselsByIds(ids);
}

export function createLocalVessel(vesselData) {
  return addCustomVessel(vesselData);
}

export function editLocalVessel(vesselId, vesselData) {
  return updateCustomVessel(vesselId, vesselData);
}

export async function fetchRiskZones() {
  try {
    const res = await fetch(`${API_BASE}/risks/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch risks");
    return await res.json();
  } catch (err) {
    console.error("API Error (Risks):", err);
    return [];
  }
}

export async function fetchDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/dashboard/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (err) {
    console.error("API Error (Stats):", err);
    return {}; 
  }
}

export async function fetchPortMovements(limit = 6, port = "PTPDL", options = {}) {
  const {
    date = null,
    live = true,
    archive = true,
  } = options;

  const params = new URLSearchParams({
    port,
    limit: String(limit),
  });

  if (date) {
    params.set("date", date);
  }

  if (live) {
    params.set("live", "true");
  }

  if (archive) {
    params.set("archive", "true");
  }

  try {
    const res = await fetch(`${API_BASE}/port-movements/?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch port movements");
    return await res.json();
  } catch (err) {
    console.error("API Error (Port Movements):", err);
    return {
      port: { code: port, name: "Ponta Delgada - São Miguel" },
      summary: {
        expected_arrivals_count: 0,
        in_port_count: 0,
        expected_departures_count: 0,
        history_count: 0,
        total_passengers_expected: 0,
        total_crew_expected: 0,
        top_vessel_types: [],
        next_arrival: null,
        next_departure: null,
      },
      movements: {
        expected_arrivals: [],
        in_port: [],
        expected_departures: [],
        history: [],
      },
    };
  }
}

export async function refreshPortMovementsOnAppOpen(port = "PTPDL") {
  return fetchPortMovements(6, port, { live: true, archive: true });
}

export async function fetchPortActivity(days = 7, port = "PTPDL", options = {}) {
  const {
    live = true,
    archive = true,
  } = options;

  const params = new URLSearchParams({
    port,
    days: String(days),
  });

  if (live) {
    params.set("live", "true");
  }

  if (archive) {
    params.set("archive", "true");
  }

  try {
    const res = await fetch(`${API_BASE}/port-movements/activity/?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch port activity");
    return await res.json();
  } catch (err) {
    console.error("API Error (Port Activity):", err);
    return {
      port: { code: port, name: "Ponta Delgada - São Miguel" },
      days,
      labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].slice(-days),
      dates: [],
      series: {
        activity: new Array(days).fill(0),
        arrivals: new Array(days).fill(0),
        in_port: new Array(days).fill(0),
        departures: new Array(days).fill(0),
      },
    };
  }
}

export async function fetchUsers() {
  try {
    const res = await fetch(`${API_BASE}/users/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  } catch (err) {
    console.error("API Error (Users):", err);
    return [];
  }
}

export async function fetchAuditLogs() {
  try {
    const res = await fetch(`${API_BASE}/audit-logs/`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch logs");
    return await res.json();
  } catch (err) {
    console.error("API Error (Logs):", err);
    return [];
  }
}

// --- AUTH & ACTIONS ---

export async function loginUser(credentials) {
    // Login does NOT need the token header, so we can use a simple header here
    const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
    });
    return res.json();
}

export async function deleteUser(userId) {
    await fetch(`${API_BASE}/users/${userId}/delete/`, {
        method: "DELETE",
        headers: getHeaders()
    });
}

export async function toggleUserStatus(userId) {
    await fetch(`${API_BASE}/users/${userId}/status/`, {
        method: "POST",
        headers: getHeaders()
    });
}

export async function updateUserRole(userId, newRole) {
    await fetch(`${API_BASE}/users/${userId}/role/`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ role: newRole })
    });
}

// --- ALERTS SYSTEM ---

export async function broadcastAlert(alertData) {
    try {
        const res = await fetch(`${API_BASE}/alerts/create/`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(alertData)
        });
        if (!res.ok) throw new Error("Failed to broadcast alert");
        return await res.json();
    } catch (err) {
        console.error("API Error (Broadcast):", err);
        return null;
    }
}
const STORAGE_KEY = "custom_vessels_registry";

export const DEFAULT_CUSTOM_VESSELS = [
  {
    id: "custom-iris-do-mar",
    mmsi: "204814000",
    imo_number: "8906432",
    call_sign: "CUXU",
    name: "IRIS DO MAR",
    type: "Fishing Vessel",
    flag: "Portugal",
    cargo_type: "Pesca costeira",
    operator: "Operador local",
    destination: "Madalena do Pico",
    eta: "Por definir",
    last_position_lat: 38.5362,
    last_position_lon: -28.5287,
    speed: 9.4,
    course: 118,
    last_update: new Date().toISOString(),
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getCustomVessels() {
  if (!canUseStorage()) {
    return [...DEFAULT_CUSTOM_VESSELS];
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOM_VESSELS));
    return [...DEFAULT_CUSTOM_VESSELS];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_CUSTOM_VESSELS];
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CUSTOM_VESSELS));
    return [...DEFAULT_CUSTOM_VESSELS];
  }
}

export function saveCustomVessels(vessels) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(vessels));
}

export function getCustomVesselById(id) {
  return getCustomVessels().find((vessel) => String(vessel.id) === String(id)) || null;
}

export function isCustomVesselId(id) {
  return String(id).startsWith("custom-");
}

export function deleteCustomVesselsByIds(ids) {
  const idSet = new Set(ids.map((id) => String(id)));
  const remaining = getCustomVessels().filter((vessel) => !idSet.has(String(vessel.id)));
  saveCustomVessels(remaining);
  return remaining;
}

export function addCustomVessel(vesselData) {
  const vessels = getCustomVessels();
  const slugBase = String(vesselData.name || "embarcacao")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "embarcacao";

  const newVessel = {
    ...vesselData,
    id: `custom-${slugBase}-${Date.now()}`,
    last_update: new Date().toISOString(),
  };

  const updated = [newVessel, ...vessels];
  saveCustomVessels(updated);
  return newVessel;
}

export function updateCustomVessel(vesselId, vesselData) {
  const updated = getCustomVessels().map((vessel) => (
    String(vessel.id) === String(vesselId)
      ? { ...vessel, ...vesselData, id: vessel.id, last_update: new Date().toISOString() }
      : vessel
  ));
  saveCustomVessels(updated);
  return updated.find((vessel) => String(vessel.id) === String(vesselId)) || null;
}

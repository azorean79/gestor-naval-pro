const AZORES_PORT_TERMS = [
  "ponta delgada",
  "vila do porto",
  "praia da vitoria",
  "praia da vitória",
  "angra do heroismo",
  "angra do heroísmo",
  "praia da graciosa",
  "calheta",
  "velas",
  "lajes do pico",
  "sao roque do pico",
  "são roque do pico",
  "madalena",
  "horta",
  "lajes das flores",
  "vila nova do corvo",
  "corvo",
  "acores",
  "açores",
  "azores",
  "sao miguel",
  "são miguel",
  "santa maria",
  "terceira",
  "graciosa",
  "sao jorge",
  "são jorge",
  "pico",
  "faial",
  "flores",
];

const AZORES_BOUNDS = {
  minLat: 36.7,
  maxLat: 39.9,
  minLon: -31.8,
  maxLon: -24.5,
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsAzoresTerm(value) {
  const normalized = normalizeText(value);
  return AZORES_PORT_TERMS.some((term) => normalized.includes(normalizeText(term)));
}

function isInsideAzoresBounds(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  return lat >= AZORES_BOUNDS.minLat && lat <= AZORES_BOUNDS.maxLat && lon >= AZORES_BOUNDS.minLon && lon <= AZORES_BOUNDS.maxLon;
}

export function isAzoresVessel(vessel) {
  if (!vessel) return false;
  if (String(vessel.id || "").startsWith("custom-")) return true;

  const lat = Number(vessel.last_position_lat);
  const lon = Number(vessel.last_position_lon);

  if (isInsideAzoresBounds(lat, lon)) return true;

  return [
    vessel.destination,
    vessel.origin,
    vessel.location,
    vessel.operator,
    vessel.route,
    vessel.last_port,
    vessel.next_port,
    vessel.region,
    vessel.home_port,
    vessel.cargo_type,
  ].some(containsAzoresTerm);
}

export function filterAzoresVessels(vessels) {
  return (Array.isArray(vessels) ? vessels : []).filter(isAzoresVessel);
}
const AZORES_PORTS = {
  pontaDelgada: { name: "Ponta Delgada", island: "São Miguel", latitude: 37.7412, longitude: -25.6756 },
  vilaDoPorto: { name: "Vila do Porto", island: "Santa Maria", latitude: 36.9476, longitude: -25.1413 },
  praiaDaVitoria: { name: "Praia da Vitória", island: "Terceira", latitude: 38.7317, longitude: -27.0608 },
  angraDoHeroismo: { name: "Angra do Heroísmo", island: "Terceira", latitude: 38.6548, longitude: -27.2219 },
  praiaDaGraciosa: { name: "Praia", island: "Graciosa", latitude: 39.0523, longitude: -28.0069 },
  calheta: { name: "Calheta", island: "São Jorge", latitude: 38.5974, longitude: -28.0179 },
  velas: { name: "Velas", island: "São Jorge", latitude: 38.6831, longitude: -28.2168 },
  lajesDoPico: { name: "Lajes do Pico", island: "Pico", latitude: 38.3981, longitude: -28.2699 },
  saoRoqueDoPico: { name: "São Roque do Pico", island: "Pico", latitude: 38.5165, longitude: -28.3074 },
  madalena: { name: "Madalena", island: "Pico", latitude: 38.5362, longitude: -28.5287 },
  horta: { name: "Horta", island: "Faial", latitude: 38.5333, longitude: -28.6333 },
  lajesDasFlores: { name: "Lajes das Flores", island: "Flores", latitude: 39.3771, longitude: -31.1761 },
  corvo: { name: "Vila Nova do Corvo", island: "Corvo", latitude: 39.6713, longitude: -31.1136 },
};

function buildInterpolatedTrack(origin, destination, {
  startTimestamp,
  hours = 18,
  steps = 10,
  baseSpeed = 13.8,
}) {
  const start = new Date(startTimestamp);
  const stepDurationMs = (hours * 60 * 60 * 1000) / Math.max(steps - 1, 1);

  return Array.from({ length: steps }, (_, index) => {
    const progress = steps === 1 ? 1 : index / (steps - 1);
    const latitude = origin.latitude + (destination.latitude - origin.latitude) * progress;
    const longitude = origin.longitude + (destination.longitude - origin.longitude) * progress;
    const waveOffset = Math.sin(progress * Math.PI) * 0.08;
    const course = Math.round(35 + progress * 110);

    return {
      id: `${origin.name}-${destination.name}-${index}`,
      latitude: Number((latitude + waveOffset / 2).toFixed(4)),
      longitude: Number((longitude - waveOffset / 3).toFixed(4)),
      speed: Number((baseSpeed + Math.cos(progress * Math.PI) * 1.1).toFixed(1)),
      course,
      timestamp: new Date(start.getTime() + stepDurationMs * index).toISOString(),
    };
  });
}

function buildVoyage(id, vesselName, destinationKey, options = {}) {
  const origin = AZORES_PORTS.pontaDelgada;
  const destination = AZORES_PORTS[destinationKey];

  return {
    id,
    vessel_name: vesselName,
    origin: origin.name,
    destination: destination.name,
    island: destination.island,
    status: "Em trânsito",
    tracks: buildInterpolatedTrack(origin, destination, options),
  };
}

export const AZORES_VOYAGE_ROUTES = [
  buildVoyage("pdl-vp-01", "Linha Santa Maria", "vilaDoPorto", { startTimestamp: "2026-03-21T06:00:00Z", hours: 15, steps: 9, baseSpeed: 16.2 }),
  buildVoyage("pdl-pv-01", "Expresso Terceira", "praiaDaVitoria", { startTimestamp: "2026-03-21T07:00:00Z", hours: 14, steps: 9, baseSpeed: 17.0 }),
  buildVoyage("pdl-adh-01", "Canal Central", "angraDoHeroismo", { startTimestamp: "2026-03-21T08:00:00Z", hours: 15, steps: 9, baseSpeed: 16.4 }),
  buildVoyage("pdl-grc-01", "Graciosa Atlântica", "praiaDaGraciosa", { startTimestamp: "2026-03-21T09:00:00Z", hours: 13, steps: 8, baseSpeed: 15.8 }),
  buildVoyage("pdl-cal-01", "São Jorge Sul", "calheta", { startTimestamp: "2026-03-21T10:00:00Z", hours: 18, steps: 10, baseSpeed: 14.9 }),
  buildVoyage("pdl-vel-01", "São Jorge Norte", "velas", { startTimestamp: "2026-03-21T11:00:00Z", hours: 17, steps: 10, baseSpeed: 14.7 }),
  buildVoyage("pdl-ldp-01", "Pico Lajes", "lajesDoPico", { startTimestamp: "2026-03-21T12:00:00Z", hours: 18, steps: 10, baseSpeed: 14.5 }),
  buildVoyage("pdl-srp-01", "Pico Norte", "saoRoqueDoPico", { startTimestamp: "2026-03-21T13:00:00Z", hours: 17, steps: 10, baseSpeed: 14.6 }),
  buildVoyage("pdl-mad-01", "Madalena Express", "madalena", { startTimestamp: "2026-03-21T14:00:00Z", hours: 16, steps: 9, baseSpeed: 15.1 }),
  buildVoyage("pdl-hor-01", "Faial Azul", "horta", { startTimestamp: "2026-03-21T15:00:00Z", hours: 16, steps: 9, baseSpeed: 15.0 }),
  buildVoyage("pdl-lfj-01", "Flores Ocidental", "lajesDasFlores", { startTimestamp: "2026-03-21T16:00:00Z", hours: 24, steps: 12, baseSpeed: 13.3 }),
  buildVoyage("pdl-crv-01", "Corvo Atlântico", "corvo", { startTimestamp: "2026-03-21T17:00:00Z", hours: 25, steps: 12, baseSpeed: 13.0 }),
];

export function getVoyageRouteById(voyageId) {
  return AZORES_VOYAGE_ROUTES.find((voyage) => voyage.id === voyageId) || null;
}

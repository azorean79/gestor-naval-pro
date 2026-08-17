"use client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import { parseCoordinate } from "@/lib/coordinates";

type ShipMapPosition = {
  lat?: number | string | null;
  lng?: number | string | null;
  speed?: number | string | null;
  course?: number | string | null;
  navStatus?: string | null;
  updatedAt?: string | null;
  source?: string;
  live?: boolean;
};

type ShipMapNavio = {
  nome?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

export default function ShipMap({
  navio,
  position,
}: {
  navio: ShipMapNavio;
  position?: ShipMapPosition | null;
}) {
  const staticLat = parseCoordinate(navio?.lat, "lat");
  const staticLng = parseCoordinate(navio?.lng, "lng");

  const liveLat = parseCoordinate(position?.lat, "lat");
  const liveLng = parseCoordinate(position?.lng, "lng");

  const hasLive = Number.isFinite(liveLat) && Number.isFinite(liveLng) && liveLat !== null && liveLng !== null;
  const hasStatic = Number.isFinite(staticLat) && Number.isFinite(staticLng) && staticLat !== null && staticLng !== null;

  const positionArr: [number, number] = hasLive
    ? [liveLat as number, liveLng as number]
    : hasStatic
      ? [staticLat as number, staticLng as number]
      : [37.7412, -25.6756];

  const speed = Number(position?.speed);
  const hasSpeed = Number.isFinite(speed) && speed >= 0;
  const course = Number(position?.course);
  const hasCourse = Number.isFinite(course);

  return (
    <MapContainer center={positionArr} zoom={8} style={{ height: "300px", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {hasLive || hasStatic ? (
        <CircleMarker center={positionArr} radius={hasLive ? 10 : 8} pathOptions={{ color: hasLive ? "#16a34a" : "#2563eb", fillColor: hasLive ? "#22c55e" : "#3b82f6", fillOpacity: 0.5, weight: 2 }}>
          <Popup>
            <div className="text-sm space-y-1">
              <div className="font-bold">{navio?.nome || "Navio"}</div>
              {hasLive ? (
                <>
                  <div><span className="font-semibold">Posição AIS ao vivo</span> ({position?.source})</div>
                  {hasSpeed ? <div>Velocidade: {speed.toFixed(1)} kn</div> : null}
                  {hasCourse ? <div>Rumo: {course.toFixed(1)}°</div> : null}
                  {position?.navStatus ? <div>Estado: {position.navStatus}</div> : null}
                  {position?.updatedAt ? <div>Atualizado: {position.updatedAt}</div> : null}
                </>
              ) : (
                <div>Posição guardada</div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ) : null}
      {!hasLive && hasStatic ? (
        <Marker position={positionArr}>
          <Popup>{navio?.nome || "Navio"}</Popup>
        </Marker>
      ) : null}
    </MapContainer>
  );
}

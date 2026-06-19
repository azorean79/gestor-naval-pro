"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { parseCoordinate } from "@/lib/coordinates";

type ShipMapNavio = {
  nome?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
};

export default function ShipMap({ navio }: { navio: ShipMapNavio }) {
  const lat = parseCoordinate(navio?.lat, "lat");
  const lng = parseCoordinate(navio?.lng, "lng");
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const position: [number, number] = hasValidCoords && lat !== null && lng !== null ? [lat, lng] : [37.7412, -25.6756];

  return (
    <MapContainer center={position} zoom={8} style={{ height: "300px", width: "100%" }} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={position}>
        <Popup>
          {navio?.nome || "Navio"}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

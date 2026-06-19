\ = Get-Content -Path "src\components\navios\NavioAisLiveCard.tsx" -Raw
\ = \ -replace 'CircleMarker, MapContainer, Popup, TileLayer, useMap', 'CircleMarker, MapContainer, Popup, TileLayer, useMap, Polyline'

\ = @"
  const [activeTab, setActiveTab] = useState<"map" | "aisstream">("map");
  const [track, setTrack] = useState<Coordinates[]>([]);

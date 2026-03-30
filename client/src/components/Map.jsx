import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons pour Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function RecenterMap({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.lat, position.lng]);
  }, [position, map]);
  return null;
}

export default function Map({ position, route }) {
  const center = position ? [position.lat, position.lng] : [48.8566, 2.3522];

  // GeoJSON: [lng, lat] → Leaflet: [lat, lng]
  const polylinePositions = route?.geojson?.coordinates?.map(([lng, lat]) => [lat, lng]) || [];

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {position && <Marker position={[position.lat, position.lng]} />}
      {polylinePositions.length > 0 && (
        <Polyline positions={polylinePositions} color="#3b82f6" weight={4} />
      )}
      <RecenterMap position={position} />
    </MapContainer>
  );
}

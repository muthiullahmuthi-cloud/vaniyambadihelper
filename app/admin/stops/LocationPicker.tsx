"use client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const CENTER: [number, number] = [12.68, 78.62];
const DEFAULT_ZOOM = 13;

const markerIcon = new L.DivIcon({
  className: "custom-marker-icon",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#1E3A8A" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

function ClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationPicker({ latitude, longitude, onLocationChange }: LocationPickerProps) {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="h-[250px] rounded-lg overflow-hidden border border-gray-200 z-0">
      <MapContainer
        center={hasCoords ? [lat, lng] : CENTER}
        zoom={hasCoords ? 15 : DEFAULT_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onLocationChange={onLocationChange} />
        {hasCoords && (
          <Marker position={[lat, lng]} icon={markerIcon} />
        )}
      </MapContainer>
    </div>
  );
}

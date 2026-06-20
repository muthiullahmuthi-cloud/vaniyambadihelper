"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteInfo {
  id: string;
  route_number: string;
  route_name: string;
  route_type: string;
}

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: RouteInfo[];
}

interface StopsMapProps {
  stops: Stop[];
  selectedStopId: string | null;
  userPosition: GeolocationPosition | null;
  onSelectStop: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Vaniyambadi center fallback
// ---------------------------------------------------------------------------

const CENTER: [number, number] = [12.68, 78.62];
const DEFAULT_ZOOM = 13;

// ---------------------------------------------------------------------------
// Fly to selected stop
// ---------------------------------------------------------------------------

function FlyToStop({ stop }: { stop: Stop | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);

  useEffect(() => {
    if (stop && stop.id !== prevId.current) {
      map.flyTo([stop.latitude, stop.longitude], 15, { duration: 0.6 });
      prevId.current = stop.id;
    }
  }, [map, stop]);

  return null;
}

// ---------------------------------------------------------------------------
// User location marker
// ---------------------------------------------------------------------------

function UserLocationMarker({ position }: { position: GeolocationPosition | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(
        [position.coords.latitude, position.coords.longitude],
        14,
        { duration: 0.6 }
      );
    }
  }, [map, position]);

  if (!position) return null;

  return (
    <CircleMarker
      center={[position.coords.latitude, position.coords.longitude]}
      radius={8}
      pathOptions={{
        color: "#3B82F6",
        fillColor: "#3B82F6",
        fillOpacity: 0.4,
        weight: 3,
      }}
    >
      <Popup>You are here</Popup>
    </CircleMarker>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StopsMap({
  stops,
  selectedStopId,
  userPosition,
  onSelectStop,
}: StopsMapProps) {
  const selectedStop = stops.find((s) => s.id === selectedStopId) || null;

  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0">
      <MapContainer
        center={CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToStop stop={selectedStop} />
        <UserLocationMarker position={userPosition} />

        {stops.map((stop) => {
          const isSelected = stop.id === selectedStopId;
          return (
            <CircleMarker
              key={stop.id}
              center={[stop.latitude, stop.longitude]}
              radius={isSelected ? 8 : 5}
              pathOptions={{
                color: isSelected ? "#1E3A8A" : "#6B7280",
                fillColor: isSelected ? "#1E3A8A" : "#FFFFFF",
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onSelectStop(stop.id),
              }}
            >
              <Popup>
                <div className="text-sm leading-snug min-w-[180px]">
                  <p className="font-bold text-gray-900">{stop.name}</p>
                  {stop.routes.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Routes
                      </p>
                      <div className="flex flex-col gap-1">
                        {stop.routes.map((route) => (
                          <Link
                            key={route.id}
                            href={`/route/${route.id}`}
                            className="text-primary hover:underline font-medium text-xs"
                          >
                            {route.route_number} — {route.route_name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">No routes through this stop</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

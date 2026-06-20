"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActiveRoute {
  routeId: string;
  routeNumber: string;
  routeName: string;
  routeType: string;
  stopName: string;
  stopLatitude: number;
  stopLongitude: number;
  lastReportedAt: string;
}

interface LiveMapProps {
  activeRoutes: ActiveRoute[];
}

// ---------------------------------------------------------------------------
// Vaniyambadi center
// ---------------------------------------------------------------------------

const CENTER: [number, number] = [12.68, 78.62];
const DEFAULT_ZOOM = 13;

// ---------------------------------------------------------------------------
// Auto-fit bounds helper
// ---------------------------------------------------------------------------

function MapBoundsFitter({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40] });
    } else {
      map.setView(CENTER, DEFAULT_ZOOM);
    }
  }, [map, positions]);

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LiveMap({ activeRoutes }: LiveMapProps) {
  const positions: [number, number][] = activeRoutes.map((r) => [
    r.stopLatitude,
    r.stopLongitude,
  ]);

  return (
    <div className="w-full h-[calc(100vh-20rem)] min-h-[400px] rounded-none sm:rounded-xl overflow-hidden border-0 sm:border sm:border-gray-200 shadow-sm z-0">
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
        <MapBoundsFitter positions={positions} />

        {activeRoutes.map((route) => {
          const timeAgo = formatDistanceToNow(new Date(route.lastReportedAt), {
            addSuffix: true,
          });

          return (
            <CircleMarker
              key={route.routeId}
              center={[route.stopLatitude, route.stopLongitude]}
              radius={10}
              pathOptions={{
                color: "#F59E0B",
                fillColor: "#F59E0B",
                fillOpacity: 0.8,
                weight: 3,
              }}
            >
              <Popup>
                <div className="text-sm leading-snug min-w-[160px]">
                  <p className="font-bold text-gray-900">
                    {route.routeNumber} — {route.routeName}
                  </p>
                  <p className="text-gray-600 mt-1 flex items-center gap-1">
                    <span className="text-accent">●</span> {route.stopName}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{timeAgo}</p>
                  <Link
                    href={`/route/${route.routeId}`}
                    className="mt-2 inline-block text-primary font-semibold text-xs hover:underline"
                  >
                    View Route →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

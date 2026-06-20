"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteMapLeafletProps {
  stops: Stop[];
  liveStopId?: string;
}

function MapBoundsSetter({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] });
    }
  }, [map, positions]);
  return null;
}

export default function RouteMapLeaflet({ stops, liveStopId }: RouteMapLeafletProps) {
  if (stops.length === 0) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        No stop coordinates available for map
      </div>
    );
  }

  const positions: [number, number][] = stops.map((s) => [s.latitude, s.longitude]);

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0">
      <MapContainer
        center={positions[0]}
        zoom={13}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsSetter positions={positions} />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#1E3A8A", weight: 3, opacity: 0.7 }}
          />
        )}
        {stops.map((stop, index) => {
          const isTerminal = index === 0 || index === stops.length - 1;
          const isLive = stop.id === liveStopId;

          if (isLive) {
            return (
              <React.Fragment key={stop.id}>
                <CircleMarker
                  center={[stop.latitude, stop.longitude]}
                  radius={14}
                  pathOptions={{
                    color: "#F59E0B",
                    fillColor: "#F59E0B",
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                />
                <CircleMarker
                  center={[stop.latitude, stop.longitude]}
                  radius={8}
                  pathOptions={{
                    color: "#F59E0B",
                    fillColor: "#F59E0B",
                    fillOpacity: 1,
                    weight: 2,
                  }}
                />
              </React.Fragment>
            );
          }

          return (
            <CircleMarker
              key={stop.id}
              center={[stop.latitude, stop.longitude]}
              radius={isTerminal ? 8 : 5}
              pathOptions={{
                color: "#1E3A8A",
                fillColor: isTerminal ? "#1E3A8A" : "#FFFFFF",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}

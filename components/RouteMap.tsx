"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Stop {
  name: string;
  latitude: number;
  longitude: number;
  isLiveStop?: boolean;
}

interface RouteMapProps {
  stops: Stop[];
}

export default function RouteMap({ stops }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || stops.length === 0) return;

    // Prevent double-init
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      // Performance: disable animations on low-end devices
      fadeAnimation: false,
      zoomAnimation: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 18,
    }).addTo(map);

    const latLngs: L.LatLngExpression[] = [];

    stops.forEach((stop, index) => {
      const latLng: L.LatLngExpression = [stop.latitude, stop.longitude];
      latLngs.push(latLng);

      if (stop.isLiveStop) {
        // Pulsing marker for live stop — outer glow ring + inner dot
        L.circleMarker(latLng, {
          radius: 14,
          color: "#F59E0B",
          fillColor: "#F59E0B",
          fillOpacity: 0.25,
          weight: 2,
          className: "animate-ping",
        }).addTo(map);

        L.circleMarker(latLng, {
          radius: 8,
          color: "#F59E0B",
          fillColor: "#F59E0B",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(
            `<strong>🚌 Bus last seen here</strong><br/>${stop.name}`
          )
          .addTo(map);
      } else {
        // Standard circle markers — first/last stops are larger
        const isTerminal = index === 0 || index === stops.length - 1;
        L.circleMarker(latLng, {
          radius: isTerminal ? 8 : 5,
          color: "#1E3A8A",
          fillColor: isTerminal ? "#1E3A8A" : "#FFFFFF",
          fillOpacity: 1,
          weight: 2,
        })
          .bindPopup(`<strong>${stop.name}</strong>`)
          .addTo(map);
      }
    });

    // Draw polyline connecting all stops
    if (latLngs.length > 1) {
      L.polyline(latLngs, {
        color: "#1E3A8A",
        weight: 3,
        opacity: 0.7,
        dashArray: "8, 6",
      }).addTo(map);
    }

    // Fit bounds to show all stops
    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stops]);

  if (stops.length === 0) {
    return (
      <div className="w-full h-[300px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        No stop coordinates available for map
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[300px] rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0"
    />
  );
}

"use client";

import * as React from "react";
import nextDynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Search, Navigation, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface StopsViewProps {
  stops: Stop[];
}

// ---------------------------------------------------------------------------
// Dynamically imported map
// ---------------------------------------------------------------------------

const StopsMap = nextDynamic(() => import("./StopsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] md:h-full min-h-[300px] bg-gray-100 rounded-xl flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Haversine distance
// ---------------------------------------------------------------------------

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StopsView({ stops }: StopsViewProps) {
  const [search, setSearch] = React.useState("");
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null);
  const [userPosition, setUserPosition] = React.useState<GeolocationPosition | null>(null);
  const [geoAsked, setGeoAsked] = React.useState(false);

  // Filter stops by search
  const filteredStops = React.useMemo(() => {
    if (!search) return stops;
    const q = search.toLowerCase();
    return stops.filter((s) => s.name.toLowerCase().includes(q));
  }, [stops, search]);

  // Sort stops by distance if geolocation granted
  const sortedStops = React.useMemo(() => {
    if (!userPosition) return filteredStops;
    const lat = userPosition.coords.latitude;
    const lng = userPosition.coords.longitude;
    return [...filteredStops].sort((a, b) => {
      return (
        haversineKm(lat, lng, a.latitude, a.longitude) -
        haversineKm(lat, lng, b.latitude, b.longitude)
      );
    });
  }, [filteredStops, userPosition]);

  // Geolocation handler
  function requestGeolocation() {
    if (!navigator.geolocation) return;
    setGeoAsked(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPosition(pos),
      () => {},
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }

  // Get distance display for a stop
  function getDistanceDisplay(stop: Stop): string | null {
    if (!userPosition) return null;
    const dist = haversineKm(
      userPosition.coords.latitude,
      userPosition.coords.longitude,
      stop.latitude,
      stop.longitude
    );
    return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-8rem)]">
      {/* Left panel: search + list */}
      <div className="flex flex-col gap-3 md:w-[360px] lg:w-[420px] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">
            Bus Stops ({stops.length})
          </h1>
          {!geoAsked && !userPosition && (
            <button
              onClick={requestGeolocation}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Near me
            </button>
          )}
          {geoAsked && !userPosition && (
            <span className="text-xs text-gray-400">Location off</span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search stops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        {/* Stop list */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <div className="flex flex-col gap-1">
            {sortedStops.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No stops found
              </p>
            ) : (
              sortedStops.map((stop) => {
                const isSelected = stop.id === selectedStopId;
                const dist = getDistanceDisplay(stop);
                return (
                  <button
                    key={stop.id}
                    onClick={() => setSelectedStopId(stop.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all min-h-[52px]",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-white border border-gray-200 hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    <MapPin
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isSelected ? "text-primary" : "text-gray-400"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm font-medium block truncate",
                          isSelected ? "text-primary" : "text-gray-900"
                        )}
                      >
                        {stop.name}
                      </span>
                      {stop.routes.length > 0 && (
                        <span className="text-xs text-gray-400 truncate block mt-0.5">
                          {stop.routes.map((r) => r.route_number).join(", ")}
                        </span>
                      )}
                    </div>
                    {dist !== null && (
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {dist}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Right panel: map */}
      <div className="flex-1 min-h-[300px] md:min-h-0">
        <StopsMap
          stops={sortedStops}
          selectedStopId={selectedStopId}
          userPosition={userPosition}
          onSelectStop={(id) => setSelectedStopId(id)}
        />
      </div>
    </div>
  );
}

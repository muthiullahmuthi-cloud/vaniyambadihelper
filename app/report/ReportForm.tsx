"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Search, MapPin, Bus, ArrowLeft, CheckCircle2, Send, Navigation, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Route {
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
}

interface RouteStopRow {
  stops: Stop;
}

interface ReportFormProps {
  routes: Route[];
  preselectedRouteId: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SESSION_KEY = "vaniyambadi_reporter_session";
const RATE_LIMIT_PREFIX = "vaniyambadi_rate_";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function isRateLimited(routeId: string): boolean {
  if (typeof window === "undefined") return false;
  const key = RATE_LIMIT_PREFIX + routeId;
  const stored = localStorage.getItem(key);
  if (!stored) return false;
  const timestamp = parseInt(stored, 10);
  return Date.now() - timestamp < 2 * 60 * 1000;
}

function setRateLimit(routeId: string): void {
  if (typeof window === "undefined") return;
  const key = RATE_LIMIT_PREFIX + routeId;
  localStorage.setItem(key, String(Date.now()));
}

// ---------------------------------------------------------------------------
// Distance between two lat/lng points (Haversine) in km
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

export function ReportForm({ routes, preselectedRouteId }: ReportFormProps) {
  const router = useRouter();

  // -- Steps: "route" | "stop" | "note" | "confirm"
  const [step, setStep] = React.useState<"route" | "stop" | "note" | "confirm">("route");

  const [selectedRouteId, setSelectedRouteId] = React.useState<string | null>(null);
  const [selectedRouteName, setSelectedRouteName] = React.useState<string>("");
  const [selectedStopId, setSelectedStopId] = React.useState<string | null>(null);
  const [selectedStopName, setSelectedStopName] = React.useState<string>("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [rateLimitedMsg, setRateLimitedMsg] = React.useState<string | null>(null);

  // Route search filter
  const [routeFilter, setRouteFilter] = React.useState("");

  // Stops for selected route
  const [routeStops, setRouteStops] = React.useState<Stop[]>([]);
  const [loadingStops, setLoadingStops] = React.useState(false);

  // Geolocation
  const [userPosition, setUserPosition] = React.useState<GeolocationPosition | null>(null);

  // Submitting state
  const [submitting, setSubmitting] = React.useState(false);

  // Auto-navigate from query param
  React.useEffect(() => {
    if (preselectedRouteId && routes.length > 0) {
      const match = routes.find((r) => r.id === preselectedRouteId);
      if (match) {
        handleSelectRoute(match.id, match.route_name);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedRouteId, routes]);

  // -------------------------------------------------------------------------
  // Step 1: Select route
  // -------------------------------------------------------------------------

  const filteredRoutes = routes.filter((r) => {
    if (!routeFilter) return true;
    const q = routeFilter.toLowerCase();
    return (
      r.route_number.toLowerCase().includes(q) ||
      r.route_name.toLowerCase().includes(q)
    );
  });

  async function handleSelectRoute(routeId: string, routeName: string) {
    setSelectedRouteId(routeId);
    setSelectedRouteName(routeName);

    // Check rate limit
    if (isRateLimited(routeId)) {
      setRateLimitedMsg("You already reported this route recently. Please wait a few minutes.");
      return;
    }
    setRateLimitedMsg(null);

    // Fetch stops for this route
    setLoadingStops(true);
    setError(null);
    const { data, error: stopsError } = await supabase
      .from("route_stops")
      .select(`
        stops!inner (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .eq("route_id", routeId)
      .order("sequence_order", { ascending: true });

    if (stopsError) {
      setError("Failed to load stops. Please try again.");
      setLoadingStops(false);
      return;
    }

    const stops = ((data || []) as unknown as RouteStopRow[]).map((rs) => rs.stops);
    setRouteStops(stops);
    setLoadingStops(false);
    setSelectedStopId(null);
    setStep("stop");
  }

  // -------------------------------------------------------------------------
  // Step 2: Select stop (with optional geolocation)
  // -------------------------------------------------------------------------

  const [geoAsked, setGeoAsked] = React.useState(false);

  function getDistanceToUser(stop: Stop): number | null {
    if (!userPosition) return null;
    return haversineKm(
      userPosition.coords.latitude,
      userPosition.coords.longitude,
      stop.latitude,
      stop.longitude
    );
  }

  const sortedStops = React.useMemo(() => {
    if (!userPosition) return routeStops;
    const { latitude: lat, longitude: lng } = userPosition.coords;
    return [...routeStops].sort((a, b) => {
      const dA = haversineKm(lat, lng, a.latitude, a.longitude);
      const dB = haversineKm(lat, lng, b.latitude, b.longitude);
      return dA - dB;
    });
  }, [routeStops, userPosition]);

  function requestGeolocation() {
    if (!navigator.geolocation) return;
    setGeoAsked(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition(pos);
      },
      () => {
        // Denied or error — just keep sequence order
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }

  function handleSelectStop(stopId: string, stopName: string) {
    setSelectedStopId(stopId);
    setSelectedStopName(stopName);
    // If rate limited, don't advance
    if (rateLimitedMsg) return;
    setStep("note");
  }

  // -------------------------------------------------------------------------
  // Step 3: Note + Submit
  // -------------------------------------------------------------------------

  async function handleSubmit() {
    if (!selectedRouteId || !selectedStopId) return;

    const sessionId = getOrCreateSessionId();

    // Double-check rate limit
    if (isRateLimited(selectedRouteId)) {
      setRateLimitedMsg("You already reported this route recently. Please wait a few minutes.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from("live_reports").insert({
      route_id: selectedRouteId,
      reported_stop_id: selectedStopId,
      note: note || null,
      reporter_session_id: sessionId,
    });

    if (insertError) {
      setError("Failed to submit report. Please try again.");
      setSubmitting(false);
      return;
    }

    // Set rate limit
    setRateLimit(selectedRouteId);
    setSubmitting(false);
    setStep("confirm");

    // Auto-redirect after 2 seconds
    setTimeout(() => {
      router.push(`/route/${selectedRouteId}`);
    }, 2000);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  function handleBack() {
    if (step === "stop") {
      setSelectedRouteId(null);
      setSelectedRouteName("");
      setRouteStops([]);
      setRateLimitedMsg(null);
      setError(null);
      setStep("route");
    } else if (step === "note") {
      setSelectedStopId(null);
      setSelectedStopName("");
      setStep("stop");
    }
  }

  // -- Success screen ---------------------------------------------------------

  if (step === "confirm") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Thanks!</h1>
        <p className="text-gray-500 max-w-xs">
          This helps other commuters in Vaniyambadi know where the bus is.
        </p>
        <p className="text-xs text-gray-400">
          Redirecting to route page...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
        {step !== "route" && (
          <button
            onClick={handleBack}
            className="p-1 -ml-1 hover:text-gray-700 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <span
          className={cn(
            step === "route" ? "text-primary font-semibold" : "text-gray-300"
          )}
        >
          Route
        </span>
        <span className="text-gray-300">→</span>
        <span
          className={cn(
            step === "stop" ? "text-primary font-semibold" : "text-gray-300"
          )}
        >
          Stop
        </span>
        <span className="text-gray-300">→</span>
        <span
          className={cn(
            step === "note" ? "text-primary font-semibold" : "text-gray-300"
          )}
        >
          Note
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Rate limit message */}
      {rateLimitedMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {rateLimitedMsg}
        </div>
      )}

      {/* Step 1: Select route */}
      {step === "route" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-extrabold text-gray-900">
            Which bus are you on?
          </h1>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search route number or name..."
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Route list */}
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => handleSelectRoute(route.id, `${route.route_number} — ${route.route_name}`)}
                className="flex items-center gap-3 w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-left hover:border-primary/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[56px]"
              >
                <Bus className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-gray-900">
                    {route.route_number}
                  </span>
                  <span className="text-gray-600 ml-2 truncate">
                    {route.route_name}
                  </span>
                </div>
                <Badge
                  variant={route.route_type === "intercity" ? "secondary" : "default"}
                  className="flex-shrink-0"
                >
                  {route.route_type === "intercity" ? "Intercity" : "Local"}
                </Badge>
              </button>
            ))}
            {filteredRoutes.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">
                No routes found matching &quot;{routeFilter}&quot;
              </p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select stop */}
      {step === "stop" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-gray-900">
              Where are you now?
            </h1>
            {loadingStops && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          <p className="text-sm text-gray-500 -mt-2">
            {selectedRouteName}
          </p>

          {/* Geolocation prompt */}
          {!geoAsked && !userPosition && (
            <button
              onClick={requestGeolocation}
              className="flex items-center justify-center gap-2 w-full py-4 bg-primary/5 border border-primary/20 rounded-xl text-sm font-semibold text-primary hover:bg-primary/10 transition-colors min-h-[52px]"
            >
              <Navigation className="w-5 h-5" />
              Use my location to sort nearest stops
            </button>
          )}
          {geoAsked && !userPosition && (
            <p className="text-xs text-gray-400 text-center">
              Showing stops in route order. {navigator.geolocation ? "Location access was denied." : ""}
            </p>
          )}
          {userPosition && (
            <p className="text-xs text-gray-400 text-center">
              Sorted by proximity to you
            </p>
          )}

          {/* Stop list */}
          <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto">
            {sortedStops.map((stop) => {
              const dist = getDistanceToUser(stop);
              return (
                <button
                  key={stop.id}
                  onClick={() => handleSelectStop(stop.id, stop.name)}
                  className="flex items-center gap-3 w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-left hover:border-primary/50 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary min-h-[56px]"
                >
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 flex-1">
                    {stop.name}
                  </span>
                  {dist !== null && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {dist < 1
                        ? `${Math.round(dist * 1000)}m`
                        : `${dist.toFixed(1)}km`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Optional note + Submit */}
      {step === "note" && (
        <div className="flex flex-col gap-4">
          <h1 className="text-xl font-extrabold text-gray-900">
            Anything to add?
          </h1>

          <p className="text-sm text-gray-500 -mt-2">
            {selectedRouteName} — {selectedStopName}
          </p>

          <textarea
            placeholder="e.g. bus is delayed, very crowded (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            autoFocus
          />

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-6 text-base shadow-md"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
            {!note && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
              >
                Skip note and submit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

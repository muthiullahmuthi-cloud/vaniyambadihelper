"use client";

import * as React from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LiveReportRow {
  id: string;
  created_at: string;
  note: string | null;
  route_id: string;
  reported_stop_id: string;
  routes: { route_number: string; route_name: string; route_type: string };
  stops: { name: string; latitude: number; longitude: number };
}

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

// ---------------------------------------------------------------------------
// Dynamically imported map (client-only)
// ---------------------------------------------------------------------------

const LiveMap = nextDynamic(() => import("./LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-20rem)] min-h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getTwentyMinutesAgoISOUTC(): string {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const twentyMinsAgoIST = new Date(nowIST.getTime() - 20 * 60 * 1000);
  const twentyMinsAgoUTC = new Date(twentyMinsAgoIST.getTime() - IST_OFFSET_MS);
  return twentyMinsAgoUTC.toISOString();
}

function dedupeByRoute(reports: LiveReportRow[]): ActiveRoute[] {
  const latest = new Map<string, LiveReportRow>();
  for (const r of reports) {
    const existing = latest.get(r.route_id);
    if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
      latest.set(r.route_id, r);
    }
  }
  return Array.from(latest.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r) => ({
      routeId: r.route_id,
      routeNumber: r.routes.route_number,
      routeName: r.routes.route_name,
      routeType: r.routes.route_type,
      stopName: r.stops.name,
      stopLatitude: Number(r.stops.latitude),
      stopLongitude: Number(r.stops.longitude),
      lastReportedAt: r.created_at,
    }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LiveMapView() {
  const [activeRoutes, setActiveRoutes] = React.useState<ActiveRoute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [initialLoadDone, setInitialLoadDone] = React.useState(false);

  const fetchLiveData = React.useCallback(async () => {
    try {
      const twentyMinsAgo = getTwentyMinutesAgoISOUTC();
      const { data, error } = await supabase
        .from("live_reports")
        .select(`
          id,
          created_at,
          note,
          route_id,
          reported_stop_id,
          routes!inner(route_number, route_name, route_type),
          stops!inner(name, latitude, longitude)
        `)
        .gte("created_at", twentyMinsAgo)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching live reports:", error);
        return;
      }

      const deduped = dedupeByRoute((data as unknown as LiveReportRow[]) || []);
      setActiveRoutes(deduped);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, []);

  React.useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // -- Empty state ------------------------------------------------------------

  if (initialLoadDone && activeRoutes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">No live reports right now</h1>
        <p className="text-gray-500 max-w-sm">
          Nobody has reported a bus in the last 20 minutes. Be the first to help other commuters!
        </p>
        <Link
          href="/report"
          className="mt-2 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
        >
          Report a Bus
        </Link>
      </div>
    );
  }

  // -- Loading state ----------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoadingSpinner size={32} />
        <p className="text-sm text-gray-400">Loading live reports...</p>
      </div>
    );
  }

  // -- Main view --------------------------------------------------------------

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
            </span>
            <h1 className="text-lg font-bold text-gray-900">
              Live Now
            </h1>
            <span className="text-sm text-gray-400 font-medium">
              ({activeRoutes.length} route{activeRoutes.length !== 1 ? "s" : ""})
            </span>
          </div>
          <button
            onClick={fetchLiveData}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Horizontal scrollable cards strip */}
      <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-2">
        <div className="flex gap-3 min-w-0">
          {activeRoutes.map((route) => {
            const timeAgo = formatDistanceToNow(new Date(route.lastReportedAt), {
              addSuffix: true,
            });
            return (
              <Link
                key={route.routeId}
                href={`/route/${route.routeId}`}
                className="flex-shrink-0 w-[240px]"
              >
                <Card className="hover:border-accent/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="live" className="text-[10px] uppercase px-2">
                        Live
                      </Badge>
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                      {route.routeNumber} — {route.routeName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <span className="truncate">{route.stopName}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="px-0">
        <LiveMap activeRoutes={activeRoutes} />
      </div>
    </div>
  );
}

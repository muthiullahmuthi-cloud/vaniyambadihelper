"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { MapPin, Clock, Bus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const RouteMapLeaflet = dynamic(() => import("@/components/RouteMapLeaflet"), {
  ssr: false,
  loading: () => <LoadingSpinner className="w-full h-[300px]" />,
});

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getTwentyMinutesAgoISOUTC(): string {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const twentyMinsAgoIST = new Date(nowIST.getTime() - 20 * 60 * 1000);
  const twentyMinsAgoUTC = new Date(twentyMinsAgoIST.getTime() - IST_OFFSET_MS);
  return twentyMinsAgoUTC.toISOString();
}

interface StopWithSeq {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence_order: number;
}

interface Schedule {
  id: string;
  departure_time: string;
  days_of_week: string[];
  operator_name?: string;
}

interface RouteDetail {
  id: string;
  route_number: string;
  route_name: string;
  route_type: string;
  direction_group?: string | null;
}

interface LiveReport {
  id: string;
  created_at: string;
  reported_stop_id: string;
  stops: { name: string };
}

interface RecentReport {
  id: string;
  created_at: string;
  stops: { name: string };
}

interface RouteDetailExpandedProps {
  routeId: string;
}

export function RouteDetailExpanded({ routeId }: RouteDetailExpandedProps) {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [stops, setStops] = useState<StopWithSeq[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [latestLiveReport, setLatestLiveReport] = useState<LiveReport | null>(null);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);

      try {
        const [routeRes, stopsRes, schedulesRes, liveRes, recentRes] = await Promise.all([
          supabase.from("routes").select("*").eq("id", routeId).single(),
          supabase
            .from("route_stops")
            .select(`
              id,
              sequence_order,
              stops!inner (
                id,
                name,
                latitude,
                longitude
              )
            `)
            .eq("route_id", routeId)
            .order("sequence_order", { ascending: true }),
          supabase
            .from("schedules")
            .select("*")
            .eq("route_id", routeId)
            .order("departure_time", { ascending: true }),
          supabase
            .from("live_reports")
            .select(`
              id,
              created_at,
              reported_stop_id,
              stops!inner(name)
            `)
            .eq("route_id", routeId)
            .gte("created_at", getTwentyMinutesAgoISOUTC())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("live_reports")
            .select(`
              id,
              created_at,
              stops!inner(name)
            `)
            .eq("route_id", routeId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        if (cancelled) return;

        if (routeRes.error || !routeRes.data) {
          setError(true);
          return;
        }

        setRoute(routeRes.data as unknown as RouteDetail);
        const mappedStops = ((stopsRes.data || []) as { sequence_order: number; stops: unknown }[]).map((rs) => {
          const stop = rs.stops as { id: string; name: string; latitude: number; longitude: number };
          return { ...stop, sequence_order: rs.sequence_order };
        });
        setStops(mappedStops);
        setSchedules((schedulesRes.data || []) as unknown as Schedule[]);
        setLatestLiveReport(liveRes.data as unknown as LiveReport | null);
        setRecentReports((recentRes.data || []) as unknown as RecentReport[]);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [routeId]);

  if (error) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Could not load route details.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse p-5">
        <div className="h-8 w-3/4 bg-gray-200 rounded" />
        <div className="h-[300px] bg-gray-100 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Route not found.
      </div>
    );
  }

  const liveStopId = latestLiveReport ? latestLiveReport.reported_stop_id : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
          {route.route_number} — {route.route_name}
        </h1>
        <Badge variant={route.route_type === "intercity" ? "secondary" : "default"}>
          {route.route_type === "intercity" ? "Intercity" : "Local"}
        </Badge>
        {latestLiveReport && (
          <Badge variant="live">Live</Badge>
        )}
      </div>

      <Link
        href={`/report?route_id=${routeId}`}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
      >
        Report this bus
      </Link>

      {/* Map */}
      <RouteMapLeaflet stops={stops} liveStopId={liveStopId} />

      {/* Stops list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4 text-primary" />
            Stops ({stops.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stops.length > 0 ? (
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-primary/30" />
              <ol className="space-y-4">
                {stops.map((stop, index) => (
                  <li key={stop.id} className="relative flex items-center gap-3">
                    <div
                      className={`absolute -left-[22px] w-3.5 h-3.5 rounded-full border-2 border-primary flex-shrink-0 ${
                        index === 0 || index === stops.length - 1
                          ? "bg-primary"
                          : "bg-white"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-800">
                      {stop.name}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No stops available.</p>
          )}
        </CardContent>
      </Card>

      {/* Schedule section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Schedule ({schedules.length} trips)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Days</th>
                    {schedules.some((s) => s.operator_name) && (
                      <th className="pb-2">Operator</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-4 font-medium text-gray-900 whitespace-nowrap">
                        {s.departure_time.substring(0, 5)}
                      </td>
                      <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">
                        {s.days_of_week && s.days_of_week.length > 0
                          ? s.days_of_week
                              .map((d: string) => d.charAt(0).toUpperCase() + d.slice(1, 3))
                              .join(", ")
                          : "\u2014"}
                      </td>
                      {schedules.some((x) => x.operator_name) && (
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {s.operator_name || "\u2014"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No schedules available.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bus className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReports.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentReports.map((report) => {
                const stop = report.stops as unknown as { name: string };
                const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
                return (
                  <li key={report.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium text-gray-800">
                      {stop.name}
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No recent activity for this route.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

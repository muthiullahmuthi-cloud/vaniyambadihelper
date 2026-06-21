"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getTwentyMinutesAgoIST } from "@/lib/timeUtils";
import { RouteResultCard } from "@/components/RouteResultCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Info } from "lucide-react";
import Link from "next/link";

interface StopInfo {
  name: string;
}

interface RouteStop {
  sequence_order: number;
  stops: StopInfo;
}

interface Schedule {
  departure_time: string;
  days_of_week: string[];
}

interface RouteResult {
  id: string;
  route_number: string;
  route_name: string;
  origin?: { name: string };
  destination?: { name: string };
  schedules?: Schedule[];
  route_stops?: RouteStop[];
}

function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="h-5 w-16 bg-gray-200 rounded mb-3" />
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
          <div className="h-16 bg-gray-100 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<RouteResult[]>([]);
  const [liveRouteIds, setLiveRouteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const routeParam = searchParams.get("route");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const hasParams = routeParam || fromParam || toParam;

  const performSearch = useCallback(async () => {
    if (!hasParams) {
      setResults([]);
      setLiveRouteIds(new Set());
      return;
    }

    setLoading(true);

    try {
      let matchedRoutes: RouteResult[] = [];

      if (routeParam) {
        const { data } = await supabase
          .from("routes")
          .select(`
            id, route_number, route_name,
            origin:stops!routes_origin_stop_id_fkey(name),
            destination:stops!routes_destination_stop_id_fkey(name),
            schedules(departure_time, days_of_week)
          `)
          .ilike("route_number", `%${routeParam}%`);
        matchedRoutes = (data as unknown as RouteResult[]) || [];
      } else if (fromParam || toParam) {
        const { data } = await supabase
          .from("routes")
          .select(`
            id, route_number, route_name,
            origin:stops!routes_origin_stop_id_fkey(name),
            destination:stops!routes_destination_stop_id_fkey(name),
            schedules(departure_time, days_of_week),
            route_stops(sequence_order, stops(name))
          `);

        const fromQuery = fromParam?.toLowerCase();
        const toQuery = toParam?.toLowerCase();

        matchedRoutes = ((data as unknown as RouteResult[]) || []).filter((route) => {
          let fromSeq = -1;
          let toSeq = -1;

          for (const rs of route.route_stops || []) {
            if (!rs.stops) continue;
            const stopName = rs.stops.name.toLowerCase();

            if (fromQuery && stopName.includes(fromQuery) && fromSeq === -1) {
              fromSeq = rs.sequence_order;
            }
            if (toQuery && stopName.includes(toQuery)) {
              toSeq = rs.sequence_order;
            }
          }

          if (fromQuery && toQuery) {
            return fromSeq !== -1 && toSeq !== -1 && fromSeq < toSeq;
          } else if (fromQuery) {
            return fromSeq !== -1;
          } else if (toQuery) {
            return toSeq !== -1;
          }
          return false;
        });
      }

      const liveIds = new Set<string>();
      if (matchedRoutes.length > 0) {
        const routeIds = matchedRoutes.map((r) => r.id);
        const twentyMinsAgo = getTwentyMinutesAgoIST();
        const { data: liveData } = await supabase
          .from("live_reports")
          .select("route_id")
          .in("route_id", routeIds)
          .gte("created_at", twentyMinsAgo);

        (liveData || []).forEach((report) => {
          liveIds.add(report.route_id);
        });
      }

      setResults(matchedRoutes);
      setLiveRouteIds(liveIds);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [routeParam, fromParam, toParam, hasParams]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  if (!hasParams) return null;

  const pageTitle = routeParam
    ? `Routes for "${routeParam}"`
    : fromParam && toParam
    ? `${fromParam} to ${toParam}`
    : fromParam
    ? `Departing from ${fromParam}`
    : `Going to ${toParam}`;

  return (
    <section className="max-w-3xl mx-auto w-full">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{pageTitle}</h2>

      {loading ? (
        <ResultsSkeleton />
      ) : results.length > 0 ? (
        <div className="flex flex-col gap-4">
          {results.map((route) => (
            <RouteResultCard
              key={route.id}
              route={route}
              isLive={liveRouteIds.has(route.id)}
              isExpanded={expandedId === route.id}
              onToggle={() => setExpandedId(expandedId === route.id ? null : route.id)}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 font-semibold mb-2">No routes found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              We couldn&apos;t find any buses matching your search criteria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/stops" className="w-full">
                <Button variant="outline" className="w-full">Browse Stops</Button>
              </Link>
              <Link href="/about#feedback" className="w-full">
                <Button variant="default" className="w-full">Suggest this route</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export function SearchResults() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <SearchResultsInner />
    </Suspense>
  );
}

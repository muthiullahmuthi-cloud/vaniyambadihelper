import { supabase } from "@/lib/supabase";
import { getNextDepartures, getTwentyMinutesAgoIST } from "@/lib/timeUtils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Clock, Info, ChevronLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const routeParam = typeof searchParams.route === "string" ? searchParams.route : undefined;
  const fromParam = typeof searchParams.from === "string" ? searchParams.from : undefined;
  const toParam = typeof searchParams.to === "string" ? searchParams.to : undefined;

  // Replace any with a broad generic type for the result
  type RouteResult = {
    id: string;
    route_number: string;
    route_name: string;
    origin?: { name: string };
    destination?: { name: string };
    schedules?: { departure_time: string; days_of_week: string[] }[];
    route_stops?: { sequence_order: number; stops: { name: string } }[];
  };

  let matchedRoutes: RouteResult[] = [];

  // 1. Fetch matching routes
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
    // Fetch all routes with their route_stops and filter in Javascript
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
        
        // Find the earliest matching fromSeq
        if (fromQuery && stopName.includes(fromQuery) && fromSeq === -1) {
          fromSeq = rs.sequence_order;
        }
        // Find the latest matching toSeq
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

  // 2. Fetch live reports for the matched routes
  const liveRouteIds = new Set<string>();
  if (matchedRoutes.length > 0) {
    const routeIds = matchedRoutes.map((r) => r.id);
    const twentyMinsAgo = getTwentyMinutesAgoIST();
    const { data: liveData } = await supabase
      .from("live_reports")
      .select("route_id")
      .in("route_id", routeIds)
      .gte("created_at", twentyMinsAgo);

    (liveData || []).forEach((report) => {
      liveRouteIds.add(report.route_id);
    });
  }

  // Determine Title
  let pageTitle = "Search Results";
  if (routeParam) {
    pageTitle = `Routes for "${routeParam}"`;
  } else if (fromParam && toParam) {
    pageTitle = `${fromParam} to ${toParam}`;
  } else if (fromParam) {
    pageTitle = `Departing from ${fromParam}`;
  } else if (toParam) {
    pageTitle = `Going to ${toParam}`;
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
      </div>

      {matchedRoutes.length > 0 ? (
        <div className="flex flex-col gap-4">
          {matchedRoutes.map((route) => {
            const isLive = liveRouteIds.has(route.id);
            const nextDepartures = getNextDepartures(route.schedules || []);
            
            return (
              <Link key={route.id} href={`/route/${route.id}`}>
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-bold text-primary bg-primary/10 text-sm">
                          {route.route_number}
                        </Badge>
                        {isLive && (
                          <Badge variant="live" className="text-[10px] uppercase px-2 animate-pulse-glow">
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 leading-tight mb-2">
                      {route.route_name}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                        {route.origin?.name || "Unknown Origin"}
                      </span>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[200px]">
                        {route.destination?.name || "Unknown Dest"}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1 uppercase tracking-wider">Next Departures</p>
                        {nextDepartures.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {nextDepartures.map((time, idx) => (
                              <span key={idx} className="text-sm font-semibold text-primary bg-white border border-gray-200 px-2 py-1 rounded">
                                {time}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-600 italic">No schedule available</span>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gray-50 border-dashed mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Info className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 font-semibold mb-2">No routes found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              We couldn&apos;t find any buses matching your search criteria. Check your spelling or try searching for a nearby major stop.
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
    </div>
  );
}

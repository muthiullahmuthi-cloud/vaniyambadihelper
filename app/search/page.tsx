import { supabase } from "@/lib/supabase";
import { getTwentyMinutesAgoIST } from "@/lib/timeUtils";
import { RouteResultCard } from "@/components/RouteResultCard";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchPageForm } from "@/components/SearchPageForm";
import { Info, ChevronLeft, Bus as BusIcon } from "lucide-react";
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

  const hasParams = !!(routeParam || fromParam || toParam);

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

  if (hasParams) {
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
  }

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

  let pageTitle = "Search Buses";
  if (routeParam) {
    pageTitle = `Routes for "${routeParam}"`;
  } else if (fromParam && toParam) {
    pageTitle = `Buses from ${fromParam} to ${toParam}`;
  } else if (fromParam) {
    pageTitle = `Departing from ${fromParam}`;
  } else if (toParam) {
    pageTitle = `Going to ${toParam}`;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 pt-4">
      {/* Search form */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 sm:p-6 mb-8">
        <SearchPageForm />
      </div>

      {hasParams ? (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          </div>

          {matchedRoutes.length > 0 ? (
            <div className="flex flex-col gap-4">
              {matchedRoutes.map((route) => (
                <RouteResultCard
                  key={route.id}
                  route={route}
                  isLive={liveRouteIds.has(route.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-gray-50 border-dashed mt-8">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Info className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl text-gray-900 font-semibold mb-2">
                  {routeParam
                    ? `No routes matching "${routeParam}"`
                    : fromParam && toParam
                    ? `No buses found from ${fromParam} to ${toParam}`
                    : "No routes found"}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                  Try different stop names or check your spelling. You can also browse all stops.
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
        </>
      ) : (
        <Card className="bg-gray-50 border-dashed mt-8">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <BusIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-900 font-semibold mb-2">Find your bus</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Enter a starting place and destination to find buses.
            </p>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

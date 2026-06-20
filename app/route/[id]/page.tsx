import { supabase } from "@/lib/supabase";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Clock, Bus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";

const RouteMapLeaflet = nextDynamic(() => import("@/components/RouteMapLeaflet"), {
  ssr: false,
  loading: () => <LoadingSpinner className="w-full h-[300px]" />,
});

export const dynamic = "force-dynamic";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getTwentyMinutesAgoISOUTC(): string {
  const now = new Date();
  const nowIST = new Date(now.getTime() + IST_OFFSET_MS);
  const twentyMinsAgoIST = new Date(nowIST.getTime() - 20 * 60 * 1000);
  const twentyMinsAgoUTC = new Date(twentyMinsAgoIST.getTime() - IST_OFFSET_MS);
  return twentyMinsAgoUTC.toISOString();
}

interface RouteDetailPageProps {
  params: { id: string };
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { id } = params;

  // 1. Fetch the route
  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .eq("id", id)
    .single();

  if (routeError || !route) {
    return (
      <main className="flex flex-col items-center justify-center py-20 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Route not found</h1>
        <p className="text-gray-500">The route you are looking for does not exist.</p>
        <Link href="/" className="text-primary underline underline-offset-2 hover:text-primary/80">
          Go back home
        </Link>
      </main>
    );
  }

  // 2. Fetch route_stops joined with stops
  const { data: routeStops } = await supabase
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
    .eq("route_id", id)
    .order("sequence_order", { ascending: true });

  // 3. Fetch schedules
  const { data: schedules } = await supabase
    .from("schedules")
    .select("*")
    .eq("route_id", id)
    .order("departure_time", { ascending: true });

  // 4. Fetch the return-direction route if direction_group exists
  let returnRoute = null;
  if (route.direction_group) {
    const { data: otherRoute } = await supabase
      .from("routes")
      .select("id, route_number, route_name")
      .eq("direction_group", route.direction_group)
      .neq("id", id)
      .maybeSingle();
    returnRoute = otherRoute;
  }

  // 5. Fetch most recent live report within last 20 minutes (IST)
  const twentyMinsAgo = getTwentyMinutesAgoISOUTC();
  const { data: latestLiveReport } = await supabase
    .from("live_reports")
    .select(`
      id,
      created_at,
      reported_stop_id,
      stops!inner(name)
    `)
    .eq("route_id", id)
    .gte("created_at", twentyMinsAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 6. Fetch recent activity (last 5 reports all time for this route)
  const { data: recentReports } = await supabase
    .from("live_reports")
    .select(`
      id,
      created_at,
      stops!inner(name)
    `)
    .eq("route_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  const stops = (routeStops || []).map((rs) => {
    const stop = rs.stops as unknown as { id: string; name: string; latitude: number; longitude: number };
    return { ...stop, sequence_order: rs.sequence_order };
  });

  const liveStopId = latestLiveReport ? latestLiveReport.reported_stop_id : undefined;

  return (
    <main className="py-6 flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
            {route.route_number} — {route.route_name}
          </h1>
          <Badge variant={route.route_type === "intercity" ? "secondary" : "default"}>
            {route.route_type === "intercity" ? "Intercity" : "Local"}
          </Badge>
          {latestLiveReport && (
            <Badge variant="live">Live</Badge>
          )}
        </div>

        {returnRoute && (
          <div>
            <Link
              href={`/route/${returnRoute.id}`}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-3 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              View other direction
            </Link>
          </div>
        )}

        <Link
          href={`/report?route_id=${id}`}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-fit"
        >
          Report this bus
        </Link>
      </div>

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
              {/* Vertical transit line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-primary/30" />
              <ol className="space-y-4">
                {stops.map((stop, index) => (
                  <li key={stop.id} className="relative flex items-center gap-3">
                    {/* Circle dot on the line */}
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
            Schedule ({schedules?.length || 0} trips)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules && schedules.length > 0 ? (
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
                          : "—"}
                      </td>
                      {schedules.some((x) => x.operator_name) && (
                        <td className="py-2 text-gray-600 whitespace-nowrap">
                          {s.operator_name || "—"}
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
          {recentReports && recentReports.length > 0 ? (
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
    </main>
  );
}

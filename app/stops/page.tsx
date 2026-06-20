import { supabase } from "@/lib/supabase";
import { StopsView } from "./StopsView";

export const dynamic = "force-dynamic";

interface RouteInfo {
  id: string;
  route_number: string;
  route_name: string;
  route_type: string;
}

interface StopWithRoutes {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: RouteInfo[];
}

export default async function StopsPage() {
  // Fetch all stops
  const { data: stops } = await supabase
    .from("stops")
    .select("id, name, latitude, longitude")
    .order("name");

  // Fetch all route_stops with route info
  const { data: routeStops } = await supabase
    .from("route_stops")
    .select(`
      stop_id,
      routes!inner(id, route_number, route_name, route_type)
    `);

  // Group routes by stop_id
  const routesByStop = new Map<string, RouteInfo[]>();
  if (routeStops) {
    for (const rs of routeStops as unknown as Array<{ stop_id: string; routes: RouteInfo }>) {
      const existing = routesByStop.get(rs.stop_id) || [];
      existing.push(rs.routes);
      routesByStop.set(rs.stop_id, existing);
    }
  }

  // Attach routes to each stop
  const stopsWithRoutes: StopWithRoutes[] = (stops || []).map((stop) => ({
    ...stop,
    latitude: Number(stop.latitude),
    longitude: Number(stop.longitude),
    routes: routesByStop.get(stop.id) || [],
  }));

  return (
    <main className="py-6">
      <StopsView stops={stopsWithRoutes} />
    </main>
  );
}

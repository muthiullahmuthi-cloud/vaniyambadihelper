import { getSupabaseAdmin } from "@/lib/supabase";
import { RouteStopsManager } from "./RouteStopsManager";

export const dynamic = "force-dynamic";

export default async function AdminRouteStopsPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: routes } = await supabaseAdmin
    .from("routes")
    .select("id, route_number, route_name")
    .order("route_number");

  const { data: stops } = await supabaseAdmin
    .from("stops")
    .select("id, name")
    .order("name");

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Route Stops</h1>
      <RouteStopsManager routes={routes || []} stops={stops || []} />
    </main>
  );
}

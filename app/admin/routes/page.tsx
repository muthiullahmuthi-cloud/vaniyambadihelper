import { supabaseAdmin } from "@/lib/supabase";
import { RoutesManager } from "./RoutesManager";

export const dynamic = "force-dynamic";

export default async function AdminRoutesPage() {
  const { data: routes } = await supabaseAdmin
    .from("routes")
    .select("*, origin:origin_stop_id(name), destination:destination_stop_id(name)")
    .order("route_number");

  const { data: stops } = await supabaseAdmin
    .from("stops")
    .select("id, name")
    .order("name");

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Routes</h1>
      <RoutesManager routes={routes || []} stops={stops || []} />
    </main>
  );
}

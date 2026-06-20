import { supabaseAdmin } from "@/lib/supabase";
import { SchedulesManager } from "./SchedulesManager";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  const { data: routes } = await supabaseAdmin
    .from("routes")
    .select("id, route_number, route_name")
    .order("route_number");

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Schedules</h1>
      <SchedulesManager routes={routes || []} />
    </main>
  );
}

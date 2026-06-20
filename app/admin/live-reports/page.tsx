import { supabaseAdmin } from "@/lib/supabase";
import { LiveReportsManager } from "./LiveReportsManager";

export const dynamic = "force-dynamic";

export default async function AdminLiveReportsPage() {
  const { data: reports } = await supabaseAdmin
    .from("live_reports")
    .select("*, routes!inner(route_number, route_name), stops!inner(name)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Live Reports</h1>
      <LiveReportsManager reports={reports || []} />
    </main>
  );
}

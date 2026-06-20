import { getSupabaseAdmin } from "@/lib/supabase";
import { StopsManager } from "./StopsManager";

export const dynamic = "force-dynamic";

export default async function AdminStopsPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: stops } = await supabaseAdmin
    .from("stops")
    .select("*")
    .order("name");

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Stops</h1>
      <StopsManager stops={stops || []} />
    </main>
  );
}

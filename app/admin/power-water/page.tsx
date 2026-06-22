import { getSupabaseAdmin } from "@/lib/supabase";
import { PowerWaterManager } from "./PowerWaterManager";

export const dynamic = "force-dynamic";

export default async function AdminPowerWaterPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: updates } = await supabaseAdmin
    .from("power_water_updates")
    .select("*")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Power & Water Updates</h1>
      <PowerWaterManager updates={updates || []} />
    </main>
  );
}

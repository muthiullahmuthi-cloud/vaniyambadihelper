import { getSupabaseAdmin } from "@/lib/supabase";
import { EmergencyManager } from "./EmergencyManager";

export const dynamic = "force-dynamic";

export default async function AdminEmergencyPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: contacts } = await supabaseAdmin
    .from("emergency_contacts")
    .select("*")
    .order("category")
    .order("display_order");

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Emergency Contacts</h1>
      <EmergencyManager contacts={contacts || []} />
    </main>
  );
}

import { getSupabaseAdmin } from "@/lib/supabase";
import { AdvertisementsManager } from "./AdvertisementsManager";

export const dynamic = "force-dynamic";

export default async function AdminAdvertisementsPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: ads } = await supabaseAdmin
    .from("advertisements")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Advertisement Board</h1>
      <AdvertisementsManager ads={ads || []} />
    </main>
  );
}

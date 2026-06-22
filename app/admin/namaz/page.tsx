import { getSupabaseAdmin } from "@/lib/supabase";
import { NamazManager } from "./NamazManager";

export const dynamic = "force-dynamic";

export default async function AdminNamazPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: mosques } = await supabaseAdmin
    .from("mosques")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Namaz Timings / Mosques</h1>
      <NamazManager mosques={mosques || []} />
    </main>
  );
}

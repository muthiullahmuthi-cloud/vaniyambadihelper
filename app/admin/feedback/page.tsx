import { getSupabaseAdmin } from "@/lib/supabase";
import { FeedbackManager } from "./FeedbackManager";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: feedback } = await supabaseAdmin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">User Feedback</h1>
      <FeedbackManager feedback={feedback || []} />
    </main>
  );
}

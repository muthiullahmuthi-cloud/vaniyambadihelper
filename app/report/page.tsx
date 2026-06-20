import { supabase } from "@/lib/supabase";
import { ReportForm } from "./ReportForm";

export const dynamic = "force-dynamic";

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  route_type: string;
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: { route_id?: string };
}) {
  const { data: routes } = await supabase
    .from("routes")
    .select("id, route_number, route_name, route_type")
    .order("route_number");

  return (
    <main className="py-6">
      <ReportForm
        routes={(routes as Route[]) || []}
        preselectedRouteId={searchParams.route_id || null}
      />
    </main>
  );
}

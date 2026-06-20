import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("route_id");

  let query = supabaseAdmin
    .from("route_stops")
    .select("*, stops!inner(id, name)")
    .order("sequence_order");

  if (routeId) query = query.eq("route_id", routeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { route_id, stop_id, sequence_order, eta_minutes_from_origin } = body;

    if (!route_id || !stop_id || sequence_order == null) {
      return NextResponse.json({ error: "route_id, stop_id, and sequence_order are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("route_stops")
      .insert({ route_id, stop_id, sequence_order, eta_minutes_from_origin: eta_minutes_from_origin || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

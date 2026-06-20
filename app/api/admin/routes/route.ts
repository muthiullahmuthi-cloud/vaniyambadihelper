import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("routes")
    .select("*, origin:origin_stop_id(name), destination:destination_stop_id(name)")
    .order("route_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { route_number, route_name, route_type, origin_stop_id, destination_stop_id, direction_group } = body;

    if (!route_number || !route_name || !route_type || !origin_stop_id || !destination_stop_id) {
      return NextResponse.json({ error: "route_number, route_name, route_type, origin_stop_id, and destination_stop_id are required" }, { status: 400 });
    }

    if (!["local", "intercity"].includes(route_type)) {
      return NextResponse.json({ error: "route_type must be 'local' or 'intercity'" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("routes")
      .insert({ route_number, route_name, route_type, origin_stop_id, destination_stop_id, direction_group: direction_group || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

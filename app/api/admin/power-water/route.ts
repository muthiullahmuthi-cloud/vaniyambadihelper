import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("power_water_updates")
    .select("*")
    .order("status", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { type, area, description, starts_at, ends_at } = body;

    if (!type || !area || !description || !starts_at) {
      return NextResponse.json({ error: "type, area, description, and starts_at are required" }, { status: 400 });
    }

    if (!["power_cut", "water_supply"].includes(type)) {
      return NextResponse.json({ error: "type must be power_cut or water_supply" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("power_water_updates")
      .insert({ type, area, description, starts_at, ends_at: ends_at || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

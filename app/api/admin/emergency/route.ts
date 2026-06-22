import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("emergency_contacts")
    .select("*")
    .order("category")
    .order("display_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { name, category, phone, address, is_24x7, display_order } = body;

    if (!name || !category || !phone) {
      return NextResponse.json({ error: "name, category, and phone are required" }, { status: 400 });
    }

    if (!["national", "hospital", "police", "fire", "ambulance", "electricity_board", "water_board", "other"].includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("emergency_contacts")
      .insert({ name, category, phone, address: address || null, is_24x7: is_24x7 || false, display_order: display_order || 0 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("advertisements")
    .select("*")
    .order("display_order")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { business_name, image_url, link_url } = body;

    if (!business_name || !image_url) {
      return NextResponse.json({ error: "business_name and image_url are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("advertisements")
      .insert({ business_name, image_url, link_url: link_url || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.stop_id !== undefined) updates.stop_id = body.stop_id;
    if (body.sequence_order !== undefined) updates.sequence_order = body.sequence_order;
    if (body.eta_minutes_from_origin !== undefined) updates.eta_minutes_from_origin = body.eta_minutes_from_origin;

    const { data, error } = await supabaseAdmin
      .from("route_stops")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("route_stops")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

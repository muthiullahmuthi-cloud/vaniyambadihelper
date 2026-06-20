import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.route_number !== undefined) updates.route_number = body.route_number;
    if (body.route_name !== undefined) updates.route_name = body.route_name;
    if (body.route_type !== undefined) {
      if (!["local", "intercity"].includes(body.route_type)) {
        return NextResponse.json({ error: "route_type must be 'local' or 'intercity'" }, { status: 400 });
      }
      updates.route_type = body.route_type;
    }
    if (body.origin_stop_id !== undefined) updates.origin_stop_id = body.origin_stop_id;
    if (body.destination_stop_id !== undefined) updates.destination_stop_id = body.destination_stop_id;
    if (body.direction_group !== undefined) updates.direction_group = body.direction_group || null;

    const { data, error } = await supabaseAdmin
      .from("routes")
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
    .from("routes")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.route_id !== undefined) updates.route_id = body.route_id;
    if (body.departure_time !== undefined) updates.departure_time = body.departure_time;
    if (body.days_of_week !== undefined) {
      if (!Array.isArray(body.days_of_week) || body.days_of_week.length === 0) {
        return NextResponse.json({ error: "days_of_week must be a non-empty array" }, { status: 400 });
      }
      updates.days_of_week = body.days_of_week;
    }
    if (body.operator_name !== undefined) updates.operator_name = body.operator_name || null;
    if (body.bus_category !== undefined) updates.bus_category = body.bus_category || null;

    const { data, error } = await supabaseAdmin
      .from("schedules")
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
  const { error } = await supabaseAdmin
    .from("schedules")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

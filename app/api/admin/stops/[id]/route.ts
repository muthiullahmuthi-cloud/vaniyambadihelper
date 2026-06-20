import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, name_local, latitude, longitude } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (name_local !== undefined) updates.name_local = name_local || null;
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;

    const { data, error } = await supabaseAdmin
      .from("stops")
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
    .from("stops")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

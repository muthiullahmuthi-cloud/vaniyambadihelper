import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.area !== undefined) updates.area = body.area;
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone;
    if (body.fajr !== undefined) updates.fajr = body.fajr;
    if (body.dhuhr !== undefined) updates.dhuhr = body.dhuhr;
    if (body.asr !== undefined) updates.asr = body.asr;
    if (body.maghrib !== undefined) updates.maghrib = body.maghrib;
    if (body.isha !== undefined) updates.isha = body.isha;
    if (body.jumma !== undefined) updates.jumma = body.jumma;
    if (body.status !== undefined) updates.status = body.status;

    const { data, error } = await supabaseAdmin
      .from("mosques")
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
    .from("mosques")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

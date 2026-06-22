import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.link_url !== undefined) updates.link_url = body.link_url;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.display_order !== undefined) updates.display_order = body.display_order;

    const { data, error } = await supabaseAdmin
      .from("advertisements")
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
    .from("advertisements")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

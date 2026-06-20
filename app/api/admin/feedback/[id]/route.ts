import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();

    if (body.resolved === undefined) {
      return NextResponse.json({ error: "resolved field is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("feedback")
      .update({ resolved: body.resolved })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

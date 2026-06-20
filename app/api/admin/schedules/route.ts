import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const routeId = searchParams.get("route_id");

  let query = supabaseAdmin
    .from("schedules")
    .select("*")
    .order("departure_time");

  if (routeId) query = query.eq("route_id", routeId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.bulk) {
      return handleBulkImport(body.rows);
    }

    const { route_id, departure_time, days_of_week, operator_name, bus_category } = body;

    if (!route_id || !departure_time || !days_of_week) {
      return NextResponse.json({ error: "route_id, departure_time, and days_of_week are required" }, { status: 400 });
    }

    if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
      return NextResponse.json({ error: "days_of_week must be a non-empty array" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("schedules")
      .insert({ route_id, departure_time, days_of_week, operator_name: operator_name || null, bus_category: bus_category || null })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

async function handleBulkImport(rows: unknown[]) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const errors: { row: number; error: string }[] = [];
  const inserts: {
    route_id: string;
    departure_time: string;
    days_of_week: string[];
    bus_category: string | null;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, string>;
    const { route_number, departure_time, days_of_week, bus_category } = row;

    if (!route_number || !departure_time || !days_of_week) {
      errors.push({ row: i + 1, error: "Missing required fields (route_number, departure_time, days_of_week)" });
      continue;
    }

    const dayArray = days_of_week.split(",").map((d: string) => d.trim().toLowerCase()).filter(Boolean);
    if (dayArray.length === 0) {
      errors.push({ row: i + 1, error: "days_of_week must contain at least one day" });
      continue;
    }

    const validDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    const invalidDays = dayArray.filter((d: string) => !validDays.includes(d));
    if (invalidDays.length > 0) {
      errors.push({ row: i + 1, error: `Invalid days: ${invalidDays.join(", ")}. Use: ${validDays.join(", ")}` });
      continue;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    if (!timeRegex.test(departure_time)) {
      errors.push({ row: i + 1, error: `Invalid departure_time format: "${departure_time}". Use HH:MM or HH:MM:SS` });
      continue;
    }

    const { data: routes } = await supabaseAdmin
      .from("routes")
      .select("id")
      .eq("route_number", route_number)
      .limit(1);

    if (!routes || routes.length === 0) {
      errors.push({ row: i + 1, error: `Route "${route_number}" not found` });
      continue;
    }

    inserts.push({
      route_id: routes[0].id,
      departure_time: departure_time.length === 5 ? `${departure_time}:00` : departure_time,
      days_of_week: dayArray,
      bus_category: bus_category || null,
    });
  }

  if (inserts.length === 0) {
    return NextResponse.json({ inserted: 0, errors }, { status: errors.length > 0 ? 400 : 200 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("schedules")
    .insert(inserts);

  if (insertError) {
    return NextResponse.json({ error: insertError.message, partial: inserts.length, errors }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserts.length, errors });
}

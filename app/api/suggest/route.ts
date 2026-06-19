import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error } = await supabase.from("gym_suggestions").insert({
    gym_name: body.gym_name,
    city: body.city,
    country: body.country,
    website_url: body.website_url,
    google_maps_url: body.google_maps_url,
    day_pass_price: body.day_pass_price,
    shower: body.shower,
    notes: body.notes,
    contact_email: body.contact_email,
    submission_type: body.submission_type,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
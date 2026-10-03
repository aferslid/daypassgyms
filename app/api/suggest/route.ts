import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function textOrNull(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const gymName = textOrNull(body.gym_name);

    if (!gymName) {
      return NextResponse.json(
        { error: "Gym name is required." },
        { status: 400 }
      );
    }

    const submissionType =
      body.submission_type === "update" ||
      body.submission_type === "owner"
        ? "update"
        : "new";

    const submitterIsOwner =
      body.submitter_is_owner === true ||
      body.submission_type === "owner";

    const spotId =
      Number.isInteger(Number(body.spot_id)) &&
      Number(body.spot_id) > 0
        ? Number(body.spot_id)
        : null;

    const freeTrial =
      body.free_trial === true
        ? true
        : body.free_trial === false
        ? false
        : null;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { error } = await supabase
      .from("gym_suggestions")
      .insert({
        spot_id: spotId,

        submission_type: submissionType,
        submitter_is_owner: submitterIsOwner,

        gym_name: gymName,
        gym_type: textOrNull(body.gym_type),

        city: textOrNull(body.city),
        country: textOrNull(body.country),
        address: textOrNull(body.address),

        website_url: textOrNull(body.website_url),
        instagram_url: textOrNull(body.instagram_url),
        google_maps_url: textOrNull(body.google_maps_url),

        phone: textOrNull(body.phone),
        gym_email: textOrNull(body.gym_email),

        day_pass_price: textOrNull(body.day_pass_price),
        currency: textOrNull(body.currency),
        week_pass_price: textOrNull(body.week_pass_price),
        day_pass_note: textOrNull(body.day_pass_note),

        free_trial: freeTrial,
        free_trial_duration: textOrNull(
          body.free_trial_duration
        ),

        shower: textOrNull(body.shower),
        locker: textOrNull(body.locker),
        wifi: textOrNull(body.wifi),
        pool: textOrNull(body.pool),

        access_gender: textOrNull(body.access_gender),
        opening_hours: textOrNull(body.opening_hours),

        notes: textOrNull(body.notes),

        contact_email: textOrNull(body.contact_email),

        status: "new",
      });

    if (error) {
      console.error("Gym suggestion insert error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gym suggestion API error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}
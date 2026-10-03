import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const allowedEventTypes = [
  "google_maps",
  "website",
  "instagram",
  "phone",
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const spotId = Number(body.spot_id);
    const eventType = body.event_type;
    const visitorId =
      typeof body.visitor_id === "string" && body.visitor_id.length <= 100
        ? body.visitor_id
        : null;

    if (!Number.isInteger(spotId) || spotId <= 0) {
      return NextResponse.json(
        { error: "Invalid spot_id" },
        { status: 400 }
      );
    }

    if (!allowedEventTypes.includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event_type" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("outbound_clicks")
      .insert({
        spot_id: spotId,
        event_type: eventType,
        visitor_id: visitorId,
      });

    if (error) {
      console.error("Outbound click insert error:", error);

      return NextResponse.json(
        { error: "Could not record click" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Outbound click API error:", error);

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
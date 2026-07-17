import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_SECRET = process.env.INDEXNOW_SECRET;

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization");

    if (
      !INDEXNOW_SECRET ||
      authorization !== `Bearer ${INDEXNOW_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!INDEXNOW_KEY) {
      return NextResponse.json(
        { error: "INDEXNOW_KEY is missing" },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const record = payload.record;

    if (!record) {
      return NextResponse.json(
        { error: "Missing Supabase record" },
        { status: 400 }
      );
    }

    const countrySlug = record.country_slug || record.country;
    const citySlug = record.city_slug || record.city;
    const gymSlug = record.slug;

    if (!countrySlug || !citySlug || !gymSlug) {
      return NextResponse.json(
        {
          error: "Missing country, city or gym slug",
          received: {
            countrySlug,
            citySlug,
            gymSlug,
          },
        },
        { status: 400 }
      );
    }

    const gymUrl =
      `https://www.daypassgyms.com/gyms/` +
      `${countrySlug}/${citySlug}/${gymSlug}`;

    const indexNowResponse = await fetch(
      "https://api.indexnow.org/indexnow",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          host: "www.daypassgyms.com",
          key: INDEXNOW_KEY,
          keyLocation:
            `https://www.daypassgyms.com/${INDEXNOW_KEY}.txt`,
          urlList: [gymUrl],
        }),
      }
    );

    const responseText = await indexNowResponse.text();

    if (!indexNowResponse.ok) {
      return NextResponse.json(
        {
          error: "IndexNow submission failed",
          status: indexNowResponse.status,
          response: responseText,
          gymUrl,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      gymUrl,
      indexNowStatus: indexNowResponse.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}
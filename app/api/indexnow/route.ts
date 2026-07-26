import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_SECRET = process.env.INDEXNOW_SECRET;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

    if (!record.id || !record.name) {
        return NextResponse.json(
            {
            error: "Missing gym id or name",
            received: {
                id: record.id,
                name: record.name,
            },
            },
            { status: 400 }
        );
        }

        const gymSlug = `${slugify(record.name)}-${record.id}`;

    const gymUrl = `https://www.daypassgyms.com/gym/${gymSlug}`;

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
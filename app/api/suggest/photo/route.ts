import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getExtension(contentType: string) {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";

  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const photo = formData.get("photo");
    const suggestionId = Number(
      formData.get("suggestion_id")
    );

    if (
      !Number.isInteger(suggestionId) ||
      suggestionId <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid suggestion ID." },
        { status: 400 }
      );
    }

    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "Photo is required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(photo.type)) {
      return NextResponse.json(
        {
          error:
            "Only JPG, PNG and WebP images are accepted.",
        },
        { status: 400 }
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Photo must be smaller than 5 MB.",
        },
        { status: 400 }
      );
    }

    const extension = getExtension(photo.type);

    if (!extension) {
      return NextResponse.json(
        { error: "Unsupported image format." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { data: suggestion, error: suggestionError } =
      await supabase
        .from("gym_suggestions")
        .select("id, submitter_is_owner")
        .eq("id", suggestionId)
        .single();

    if (
      suggestionError ||
      !suggestion ||
      !suggestion.submitter_is_owner
    ) {
      return NextResponse.json(
        {
          error:
            "Photo uploads are only available for gym owner submissions.",
        },
        { status: 403 }
      );
    }

    const filePath =
      `${suggestionId}/${crypto.randomUUID()}.${extension}`;

    const arrayBuffer = await photo.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("gym-suggestion-images")
      .upload(filePath, arrayBuffer, {
        contentType: photo.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Suggestion photo upload error:",
        uploadError
      );

      return NextResponse.json(
        { error: "Photo upload failed." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("gym_suggestions")
      .update({
        photo_path: filePath,
      })
      .eq("id", suggestionId);

    if (updateError) {
      await supabase.storage
        .from("gym-suggestion-images")
        .remove([filePath]);

      console.error(
        "Suggestion photo path update error:",
        updateError
      );

      return NextResponse.json(
        { error: "Photo could not be linked." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      photo_path: filePath,
    });
  } catch (error) {
    console.error(
      "Suggestion photo API error:",
      error
    );

    return NextResponse.json(
      { error: "Invalid photo upload." },
      { status: 400 }
    );
  }
}
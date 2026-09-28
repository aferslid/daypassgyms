import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  const isAdmin =
    cookieStore.get("admin_auth")?.value === "true";

  return NextResponse.json({
    authorized: isAdmin,
  });
}
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: Set a short-lived cookie with valid invitation code id for OAuth callback.
 * Body: { codeId: string }. No auth required (used before user is logged in).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const codeId = typeof body?.codeId === "string" ? body.codeId.trim() : "";

    if (!codeId) {
      return NextResponse.json(
        { error: "Invitation code id is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: row, error } = await admin
      .from("invitation_codes")
      .select("id")
      .eq("id", codeId)
      .eq("is_active", true)
      .is("used_at", null)
      .maybeSingle();

    if (error || !row) {
      return NextResponse.json(
        { error: "Invalid or already used invitation code" },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieValue = `pending_invite_id=${codeId}; Path=/; Max-Age=600; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`;

    const res = NextResponse.json({ success: true });
    res.headers.set("Set-Cookie", cookieValue);
    return res;
  } catch (err) {
    console.error("Set invite cookie error:", err);
    return NextResponse.json(
      { error: "Failed to set invitation cookie" },
      { status: 500 }
    );
  }
}

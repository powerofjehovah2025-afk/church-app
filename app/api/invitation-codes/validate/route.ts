import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Invitation code is required" },
        { status: 200 }
      );
    }

    const admin = createAdminClient();

    const { data: row, error } = await admin
      .from("invitation_codes")
      .select("id")
      .eq("code", code)
      .is("used_at", null)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error validating invitation code:", error);
      return NextResponse.json(
        { valid: false, error: "Failed to validate code" },
        { status: 200 }
      );
    }

    if (!row) {
      return NextResponse.json(
        { valid: false, error: "Invalid invitation code" },
        { status: 200 }
      );
    }

    return NextResponse.json({ valid: true, codeId: row.id });
  } catch (err) {
    console.error("Invitation code validate error:", err);
    return NextResponse.json(
      { valid: false, error: "Invalid invitation code" },
      { status: 200 }
    );
  }
}

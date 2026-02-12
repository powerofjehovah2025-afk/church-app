import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const codeId = typeof body?.codeId === "string" ? body.codeId.trim() : "";
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

    if (!codeId || !userId) {
      return NextResponse.json(
        { error: "codeId and userId are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from("invitation_codes")
      .update({
        used_at: new Date().toISOString(),
        used_by: userId,
      })
      .eq("id", codeId)
      .is("used_at", null);

    if (error) {
      console.error("Error recording invitation code use:", error);
      return NextResponse.json(
        { error: "Failed to record code use" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Invitation code use error:", err);
    return NextResponse.json(
      { error: "Failed to record code use" },
      { status: 500 }
    );
  }
}

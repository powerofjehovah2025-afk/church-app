import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * API endpoint to validate an invitation code
 * This can be called by anyone (including anonymous users) during signup
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const code = body?.code?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { error: "Invitation code is required", valid: false },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Query the code - RLS policy allows anonymous users to check validity
    const { data: invitationCode, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !invitationCode) {
      return NextResponse.json({
        valid: false,
        error: "Invalid invitation code",
      });
    }

    // Check if code is active
    if (!invitationCode.is_active) {
      return NextResponse.json({
        valid: false,
        error: "This invitation code has been deactivated",
      });
    }

    // Check if code has expired
    if (invitationCode.expires_at) {
      const expiresAt = new Date(invitationCode.expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({
          valid: false,
          error: "This invitation code has expired",
        });
      }
    }

    // Check if code has reached max uses
    if (invitationCode.max_uses !== null) {
      if (invitationCode.used_count >= invitationCode.max_uses) {
        return NextResponse.json({
          valid: false,
          error: "This invitation code has reached its usage limit",
        });
      }
    }

    return NextResponse.json({
      valid: true,
      code: invitationCode.code,
      codeId: invitationCode.id,
    });
  } catch (error) {
    console.error("Error validating invitation code:", error);
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}


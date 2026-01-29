import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: List all invitation codes (admin only)
 * POST: Create a new invitation code (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Fetch all invitation codes with creator info
    const admin = createAdminClient();
    const { data: codes, error } = await admin
      .from("invitation_codes")
      .select(`
        *,
        creator:profiles!invitation_codes_created_by_fkey(id, email, full_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitation codes:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ codes: codes || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      code,
      expiresAt,
      maxUses,
    } = body;

    // Generate code if not provided
    let finalCode = code?.trim().toUpperCase();
    if (!finalCode) {
      // Generate a random 8-character code
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      finalCode = "";
      for (let i = 0; i < 8; i++) {
        finalCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // Validate code format (alphanumeric, 4-20 characters)
    if (!/^[A-Z0-9]{4,20}$/.test(finalCode)) {
      return NextResponse.json(
        { error: "Code must be 4-20 alphanumeric characters" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    
    // Check if code already exists
    const { data: existing } = await admin
      .from("invitation_codes")
      .select("id")
      .eq("code", finalCode)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This code already exists. Please use a different code." },
        { status: 400 }
      );
    }

    // Create the invitation code
    const { data: newCode, error } = await admin
      .from("invitation_codes")
      .insert({
        code: finalCode,
        created_by: user.id,
        expires_at: expiresAt || null,
        max_uses: maxUses || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invitation code:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: newCode,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}


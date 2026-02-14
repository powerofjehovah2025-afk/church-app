import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPhoneWithCountryCode, getPhoneValidationError } from "@/lib/phone";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in GET /api/member/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const body = await request.json();
    const { full_name, email, phone, skills, availability } = body;

    // Only allow members to update their own profile
    // Members cannot change role, id, or created_at
    const updateData: {
      full_name?: string;
      email?: string;
      phone?: string;
      skills?: string[] | null;
      availability?: Record<string, unknown> | null;
    } = {};

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }
    if (email !== undefined) {
      updateData.email = email;
    }
    if (phone !== undefined) {
      const trimmed = typeof phone === "string" ? phone.trim() : "";
      if (trimmed && !isValidPhoneWithCountryCode(trimmed)) {
        const err = getPhoneValidationError(trimmed);
        return NextResponse.json(
          { error: err || "Phone must include country code (e.g. +44 or +234)." },
          { status: 400 }
        );
      }
      updateData.phone = trimmed || null;
    }
    if (skills !== undefined) {
      updateData.skills = skills;
    }
    if (availability !== undefined) {
      updateData.availability = availability;
    }

    const { data: profile, error } = await admin
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in PUT /api/member/profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const admin = createAdminClient();

    // Get user profile with role
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get role details if role exists
    let roleDetails = null;
    if (profile.role) {
      const { data: role } = await admin
        .from("roles")
        .select("*")
        .eq("name", profile.role)
        .eq("is_active", true)
        .single();

      if (role) {
        // Get permissions
        const { data: permissions } = await admin
          .from("role_permissions")
          .select("*")
          .eq("role_id", role.id);

        roleDetails = {
          ...role,
          permissions: permissions || [],
        };
      }
    }

    return NextResponse.json({
      role: profile.role,
      roleDetails,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/users/[userId]/role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    // Verify role exists
    const { data: roleExists } = await admin
      .from("roles")
      .select("id")
      .eq("name", role)
      .eq("is_active", true)
      .single();

    if (!roleExists) {
      return NextResponse.json(
        { error: "Invalid role. Role does not exist or is inactive." },
        { status: 400 }
      );
    }

    // Update user role
    const { data: profile, error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return NextResponse.json(
        { error: "Failed to update user role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in PUT /api/admin/users/[userId]/role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const admin = createAdminClient();

    const { data: role, error } = await admin
      .from("roles")
      .select("*")
      .eq("id", roleId)
      .single();

    if (error || !role) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      );
    }

    // Fetch role permissions
    const { data: permissions } = await admin
      .from("role_permissions")
      .select("*")
      .eq("role_id", roleId);

    return NextResponse.json({
      role,
      permissions: permissions || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/roles/[roleId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    const { name, description, permissions, hierarchy_level, is_active } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (hierarchy_level !== undefined) updateData.hierarchy_level = hierarchy_level;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: role, error } = await admin
      .from("roles")
      .update(updateData)
      .eq("id", roleId)
      .select()
      .single();

    if (error) {
      console.error("Error updating role:", error);
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error in PUT /api/admin/roles/[roleId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roleId: string }> }
) {
  try {
    const { roleId } = await params;
    const admin = createAdminClient();

    // Soft delete by setting is_active to false
    const { error } = await admin
      .from("roles")
      .update({ is_active: false })
      .eq("id", roleId);

    if (error) {
      console.error("Error deleting role:", error);
      return NextResponse.json(
        { error: "Failed to delete role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/roles/[roleId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


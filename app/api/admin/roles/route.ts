import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();

    const { data: roles, error } = await admin
      .from("roles")
      .select("*")
      .eq("is_active", true)
      .order("hierarchy_level", { ascending: true });

    if (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ roles: roles || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await request.json();

    const { name, description, permissions, hierarchy_level } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 }
      );
    }

    const { data: role, error } = await admin
      .from("roles")
      .insert({
        name,
        description: description || null,
        permissions: permissions || {},
        hierarchy_level: hierarchy_level || 100,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating role:", error);
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "Role with this name already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create role" },
        { status: 500 }
      );
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/roles:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


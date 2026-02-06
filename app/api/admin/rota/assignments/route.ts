import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceAssignmentInsert, ServiceAssignmentUpdate } from "@/types/database.types";

/**
 * GET: List assignments (with optional filters)
 * POST: Create a new assignment (admin only)
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const dutyTypeId = searchParams.get("dutyTypeId");
    const memberId = searchParams.get("memberId");

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    // Use admin client for admin, regular client for members
    const client = isAdmin ? createAdminClient() : supabase;

    let query = client
      .from("service_assignments")
      .select(`
        *,
        service:services(*),
        duty_type:duty_types(*),
        member:profiles!member_id(id, full_name, email),
        assigned_by_user:profiles!assigned_by(id, full_name, email)
      `)
      .order("assigned_at", { ascending: false });

    // Apply filters
    if (serviceId) {
      query = query.eq("service_id", serviceId);
    }
    if (dutyTypeId) {
      query = query.eq("duty_type_id", dutyTypeId);
    }
    if (memberId) {
      query = query.eq("member_id", memberId);
    } else if (!isAdmin) {
      // Members can only see their own assignments
      query = query.eq("member_id", user.id);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error("Error fetching assignments:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignments: assignments || [] });
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

/**
 * POST: Create a new assignment (admin only)
 */
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
    const { service_id, duty_type_id, member_id, status, notes } = body;

    if (!service_id || !duty_type_id || !member_id) {
      return NextResponse.json(
        { error: "Service ID, duty type ID, and member ID are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newAssignment, error } = await admin
      .from("service_assignments")
      .insert({
        service_id,
        duty_type_id,
        member_id,
        status: status || "pending",
        assigned_by: user.id,
        notes: notes?.trim() || null,
      } as ServiceAssignmentInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating assignment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: newAssignment,
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

/**
 * PUT: Update an assignment (admin only)
 */
export async function PUT(request: Request) {
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
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const updateData: ServiceAssignmentUpdate = {};
    if (status !== undefined) {
      if (!["pending", "confirmed", "declined", "completed"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be: pending, confirmed, declined, or completed" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null;
    }

    const admin = createAdminClient();
    const { data: updatedAssignment, error } = await admin
      .from("service_assignments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating assignment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
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

/**
 * DELETE: Remove an assignment (admin only)
 */
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("service_assignments").delete().eq("id", id);

    if (error) {
      console.error("Error deleting assignment:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assignment removed successfully",
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


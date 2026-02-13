import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * PATCH: Update a service assignment (reassign member, notes, status).
 * Body: { member_id?, notes?, status? }. Admin only.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { member_id, notes, status } = body as {
      member_id?: string;
      notes?: string | null;
      status?: string;
    };

    const admin = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (typeof member_id === "string") {
      const { data: member } = await admin
        .from("profiles")
        .select("id")
        .eq("id", member_id)
        .single();
      if (!member) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }
      updates.member_id = member_id;
    }
    if (notes !== undefined) updates.notes = notes;
    if (typeof status === "string") updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Provide at least one of member_id, notes, status" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await admin
      .from("service_assignments")
      .update(updates)
      .eq("id", id)
      .select(`
        id,
        service_id,
        duty_type_id,
        member_id,
        status,
        assigned_at,
        notes,
        service:services(id, date, name, time),
        duty_type:duty_types(id, name),
        member:profiles!service_assignments_member_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error updating assignment:", error);
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      );
    }

    if (!updated) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ assignment: updated });
  } catch (err) {
    console.error("PATCH /api/admin/rota/assignments/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove a service assignment (unassign slot). Admin only.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("service_assignments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting assignment:", error);
      return NextResponse.json(
        { error: "Failed to delete assignment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/rota/assignments/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthUser } from "@/lib/auth/require-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ newcomerId: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newcomerId } = await params;
    const admin = createAdminClient();

    // Non-admins may only view follow-up for newcomers assigned to them
    if (auth.role !== "admin") {
      const { data: newcomer, error: newcomerErr } = await admin
        .from("newcomers")
        .select("assigned_to")
        .eq("id", newcomerId)
        .single();
      if (newcomerErr || !newcomer) {
        return NextResponse.json(
          { error: "Failed to fetch newcomer" },
          { status: 500 }
        );
      }
      if ((newcomer as { assigned_to: string | null }).assigned_to !== auth.user.id) {
        return NextResponse.json(
          { error: "Forbidden. You may only view follow-up for newcomers assigned to you." },
          { status: 403 }
        );
      }
    }

    // Get follow-up history
    const { data: history, error: historyError } = await admin
      .from("followup_history")
      .select(`
        *,
        staff:profiles!followup_history_staff_id_fkey(id, full_name, email)
      `)
      .eq("newcomer_id", newcomerId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("Error fetching follow-up history:", historyError);
      return NextResponse.json(
        { error: "Failed to fetch follow-up history" },
        { status: 500 }
      );
    }

    // Get current newcomer follow-up status
    const { data: newcomer, error: newcomerError } = await admin
      .from("newcomers")
      .select("followup_status, followup_notes, last_followup_at, followup_count, next_followup_date")
      .eq("id", newcomerId)
      .single();

    if (newcomerError) {
      console.error("Error fetching newcomer:", newcomerError);
      return NextResponse.json(
        { error: "Failed to fetch newcomer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: history || [],
      currentStatus: newcomer,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/newcomers/[newcomerId]/followup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ newcomerId: string }> }
) {
  try {
    const { newcomerId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    const {
      followup_status,
      followup_notes,
      contact_method,
      next_followup_date,
    } = body;

    if (!followup_status) {
      return NextResponse.json(
        { error: "followup_status is required" },
        { status: 400 }
      );
    }

    // Get current user (staff member making the update) via server client
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const user = auth.user;

    // Non-admins may only update follow-up for newcomers assigned to them
    if (auth.role !== "admin") {
      const { data: newcomer, error: newcomerErr } = await admin
        .from("newcomers")
        .select("assigned_to")
        .eq("id", newcomerId)
        .single();
      if (newcomerErr || !newcomer) {
        return NextResponse.json(
          { error: "Failed to fetch newcomer" },
          { status: 500 }
        );
      }
      if ((newcomer as { assigned_to: string | null }).assigned_to !== user.id) {
        return NextResponse.json(
          { error: "Forbidden. You may only update follow-up for newcomers assigned to you." },
          { status: 403 }
        );
      }
    }

    // Update newcomer follow-up fields
    const updateData: Record<string, unknown> = {
      followup_status,
      last_followup_at: new Date().toISOString(),
    };

    if (followup_notes !== undefined) {
      updateData.followup_notes = followup_notes;
    }

    if (next_followup_date !== undefined) {
      updateData.next_followup_date = next_followup_date || null;
    }

    // Increment follow-up count
    const { data: currentNewcomer } = await admin
      .from("newcomers")
      .select("followup_count")
      .eq("id", newcomerId)
      .single();

    updateData.followup_count = (currentNewcomer?.followup_count || 0) + 1;

    // If status is 'contacted', also update the contacted field
    if (followup_status === "contacted") {
      updateData.contacted = true;
      updateData.contacted_at = new Date().toISOString();
    }

    // Validate status value
    const validStatuses = ['not_started', 'in_progress', 'contacted', 'completed', 'no_response'];
    if (!validStatuses.includes(followup_status)) {
      return NextResponse.json(
        { error: "Invalid followup_status value" },
        { status: 400 }
      );
    }

    const { data: updatedNewcomer, error: updateError } = await admin
      .from("newcomers")
      .update(updateData)
      .eq("id", newcomerId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating newcomer:", updateError);
      return NextResponse.json(
        { error: "Failed to update follow-up status" },
        { status: 500 }
      );
    }

    // Create follow-up history entry
    const { data: historyEntry, error: historyError } = await admin
      .from("followup_history")
      .insert({
        newcomer_id: newcomerId,
        staff_id: user.id,
        status: followup_status,
        notes: followup_notes || null,
        contact_method: contact_method || null,
      })
      .select(`
        *,
        staff:profiles!followup_history_staff_id_fkey(id, full_name, email)
      `)
      .single();

    if (historyError) {
      console.error("Error creating follow-up history:", historyError);
      // Don't fail the request if history creation fails
    }

    return NextResponse.json({
      newcomer: updatedNewcomer,
      historyEntry: historyEntry || null,
    });
  } catch (error) {
    console.error("Error in PUT /api/admin/newcomers/[newcomerId]/followup:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

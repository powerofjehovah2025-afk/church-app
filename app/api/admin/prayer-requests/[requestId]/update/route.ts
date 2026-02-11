import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const admin = createAdminClient();
    
    // Verify admin or team member
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { update_text, status } = body;

    if (!update_text) {
      return NextResponse.json(
        { error: "update_text is required" },
        { status: 400 }
      );
    }

    // Check if user is admin or assigned team member
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      // Check if user is assigned to this prayer request
      const { data: assignment } = await admin
        .from("prayer_team_assignments")
        .select("id")
        .eq("prayer_request_id", requestId)
        .eq("team_member_id", user.id)
        .single();

      if (!assignment) {
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Create update
    const { error: updateError } = await admin
      .from("prayer_updates")
      .insert({
        prayer_request_id: requestId,
        updated_by: user.id,
        update_text,
      });

    if (updateError) {
      console.error("Error creating update:", updateError);
      return NextResponse.json(
        { error: "Failed to create update" },
        { status: 500 }
      );
    }

    // Update status if provided (admin only)
    if (status && isAdmin) {
      const updateData: { status: string; answered_at?: string | null } = { status };
      if (status === "answered") {
        updateData.answered_at = new Date().toISOString();
      }

      await admin
        .from("prayer_requests")
        .update(updateData)
        .eq("id", requestId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/admin/prayer-requests/[requestId]/update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


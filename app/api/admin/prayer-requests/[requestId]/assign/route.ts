import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const admin = createAdminClient();
    
    // Verify admin
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { team_member_ids } = body;

    if (!team_member_ids || !Array.isArray(team_member_ids)) {
      return NextResponse.json(
        { error: "team_member_ids array is required" },
        { status: 400 }
      );
    }

    // Update main assignment
    if (team_member_ids.length > 0) {
      await admin
        .from("prayer_requests")
        .update({ assigned_to: team_member_ids[0] })
        .eq("id", requestId);
    }

    // Clear existing team assignments
    await admin
      .from("prayer_team_assignments")
      .delete()
      .eq("prayer_request_id", requestId);

    // Create new team assignments
    if (team_member_ids.length > 0) {
      const assignments = team_member_ids.map((memberId: string) => ({
        prayer_request_id: requestId,
        team_member_id: memberId,
        assigned_by: user.id,
      }));

      const { error: assignError } = await admin
        .from("prayer_team_assignments")
        .insert(assignments);

      if (assignError) {
        console.error("Error assigning team members:", assignError);
        return NextResponse.json(
          { error: "Failed to assign team members" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/admin/prayer-requests/[requestId]/assign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


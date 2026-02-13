import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: prayerRequest, error } = await admin
      .from("prayer_requests")
      .select(`
        *,
        assigned_to_profile:profiles!prayer_requests_assigned_to_fkey(id, full_name, email),
        team_assignments:prayer_team_assignments(
          id,
          team_member:profiles!prayer_team_assignments_team_member_id_fkey(id, full_name, email),
          assigned_at
        ),
        updates:prayer_updates(
          id,
          update_text,
          created_at,
          updated_by_profile:profiles!prayer_updates_updated_by_fkey(id, full_name, email)
        )
      `)
      .eq("id", requestId)
      .eq("member_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching prayer request:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer request" },
        { status: 500 }
      );
    }

    if (!prayerRequest) {
      return NextResponse.json(
        { error: "Prayer request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: prayerRequest });
  } catch (error) {
    console.error("Error in GET /api/member/prayer-requests/[requestId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
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
    const { title, request: requestText, priority, status } = body;

    const updateData: {
      title?: string;
      request?: string;
      priority?: string;
      status?: string;
      answered_at?: string | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (requestText !== undefined) updateData.request = requestText;
    if (priority !== undefined) updateData.priority = priority;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "answered") {
        updateData.answered_at = new Date().toISOString();
      } else if (status !== "answered" && status !== "closed") {
        updateData.answered_at = null;
      }
    }

    const { data: prayerRequest, error } = await admin
      .from("prayer_requests")
      .update(updateData)
      .eq("id", requestId)
      .eq("member_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating prayer request:", error);
      return NextResponse.json(
        { error: "Failed to update prayer request" },
        { status: 500 }
      );
    }

    if (!prayerRequest) {
      return NextResponse.json(
        { error: "Prayer request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: prayerRequest });
  } catch (error) {
    console.error("Error in PUT /api/member/prayer-requests/[requestId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("prayer_requests")
      .delete()
      .eq("id", requestId)
      .eq("member_id", user.id);

    if (error) {
      console.error("Error deleting prayer request:", error);
      return NextResponse.json(
        { error: "Failed to delete prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/member/prayer-requests/[requestId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


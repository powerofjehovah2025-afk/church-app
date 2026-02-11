import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    let query = admin
      .from("prayer_requests")
      .select(`
        *,
        member:profiles!prayer_requests_member_id_fkey(id, full_name, email),
        assigned_to_profile:profiles!prayer_requests_assigned_to_fkey(id, full_name, email),
        team_assignments:prayer_team_assignments(
          id,
          team_member:profiles!prayer_team_assignments_team_member_id_fkey(id, full_name, email),
          assigned_at
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (priority) {
      query = query.eq("priority", priority);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error("Error fetching prayer requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/prayer-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


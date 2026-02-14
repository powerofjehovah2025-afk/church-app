import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/require-auth";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const admin = createAdminClient();

    // Get all staff members
    const { data: staffMembers, error: staffError } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin"]);

    if (staffError) {
      console.error("Error fetching staff members:", staffError);
      return NextResponse.json(
        { error: "Failed to fetch staff members" },
        { status: 500 }
      );
    }

    // Get assigned newcomers
    const { data: newcomers, error: newcomersError } = await admin
      .from("newcomers")
      .select(`
        id,
        assigned_to,
        followup_status,
        last_followup_at,
        assigned_at
      `)
      .not("assigned_to", "is", null);

    if (newcomersError) {
      console.error("Error fetching newcomers:", newcomersError);
      return NextResponse.json(
        { error: "Failed to fetch newcomers" },
        { status: 500 }
      );
    }

    // Get tasks
    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id, assigned_to, status")
      .in("status", ["pending", "in_progress"]);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      // Don't fail, just continue without tasks
    }

    // Calculate metrics for each staff member
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const staffDirectory = (staffMembers || []).map((staff) => {
      const assignedNewcomers = (newcomers || []).filter(
        (n) => n.assigned_to === staff.id
      );

      const completedThisWeek = assignedNewcomers.filter((n) => {
        if (n.followup_status !== "contacted" && n.followup_status !== "completed") {
          return false;
        }
        if (!n.last_followup_at) return false;
        return new Date(n.last_followup_at) >= sevenDaysAgo;
      }).length;

      const activeTasks = (tasks || []).filter(
        (t) => t.assigned_to === staff.id
      ).length;

      const responded = assignedNewcomers.filter(
        (n) => n.followup_status === "contacted" || n.followup_status === "completed"
      ).length;

      const responseRate = assignedNewcomers.length > 0
        ? (responded / assignedNewcomers.length) * 100
        : 0;

      return {
        staff_id: staff.id,
        staff_name: staff.full_name || staff.email || "Unknown",
        staff_email: staff.email,
        role: staff.role,
        current_assignments: assignedNewcomers.length,
        completed_this_week: completedThisWeek,
        active_tasks: activeTasks,
        response_rate: responseRate,
      };
    });

    // Sort by current assignments (descending)
    staffDirectory.sort((a, b) => b.current_assignments - a.current_assignments);

    return NextResponse.json({
      staff: staffDirectory,
      totalStaff: staffDirectory.length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/staff/directory:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();

    // Get all staff members (excluding regular members)
    const { data: staffMembers, error: staffError } = await admin
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["admin", "pastor", "elder", "deacon", "leader"]);

    if (staffError) {
      console.error("Error fetching staff members:", staffError);
      return NextResponse.json(
        { error: "Failed to fetch staff members" },
        { status: 500 }
      );
    }

    // Get all assigned newcomers
    const { data: newcomers, error: newcomersError } = await admin
      .from("newcomers")
      .select(`
        id,
        full_name,
        assigned_to,
        followup_status,
        followup_count,
        last_followup_at,
        assigned_at,
        created_at
      `)
      .not("assigned_to", "is", null);

    if (newcomersError) {
      console.error("Error fetching newcomers:", newcomersError);
      return NextResponse.json(
        { error: "Failed to fetch newcomers" },
        { status: 500 }
      );
    }

    // Calculate performance metrics for each staff member
    const performanceMetrics = (staffMembers || []).map((staff) => {
      const assignedNewcomers = (newcomers || []).filter(
        (n) => n.assigned_to === staff.id
      );

      const completed = assignedNewcomers.filter(
        (n) => n.followup_status === "contacted" || n.followup_status === "completed"
      ).length;

      const inProgress = assignedNewcomers.filter(
        (n) => n.followup_status === "in_progress"
      ).length;

      const notStarted = assignedNewcomers.filter(
        (n) => n.followup_status === "not_started" || !n.followup_status
      ).length;

      // Calculate average response time
      let totalResponseTime = 0;
      let respondedCount = 0;
      const now = new Date();

      assignedNewcomers.forEach((newcomer) => {
        if (newcomer.last_followup_at && newcomer.assigned_at) {
          const assignedAt = new Date(newcomer.assigned_at);
          const contactedAt = new Date(newcomer.last_followup_at);
          const responseTimeHours = (contactedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
          if (responseTimeHours > 0) {
            totalResponseTime += responseTimeHours;
            respondedCount++;
          }
        }
      });

      const averageResponseTimeHours = respondedCount > 0 ? totalResponseTime / respondedCount : 0;

      // Calculate completion rate
      const completionRate = assignedNewcomers.length > 0
        ? (completed / assignedNewcomers.length) * 100
        : 0;

      // Count overdue (assigned more than 48 hours ago and not contacted/completed)
      const overdue = assignedNewcomers.filter((n) => {
        if (n.followup_status === "contacted" || n.followup_status === "completed") {
          return false;
        }
        const assignedAt = n.assigned_at ? new Date(n.assigned_at) : new Date(n.created_at);
        const hoursSinceAssignment = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
        return hoursSinceAssignment > 48;
      }).length;

      // Check if staff is active (has assignments or completed follow-ups in last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentActivity = assignedNewcomers.some((n) => {
        if (n.last_followup_at) {
          return new Date(n.last_followup_at) >= thirtyDaysAgo;
        }
        if (n.assigned_at) {
          return new Date(n.assigned_at) >= thirtyDaysAgo;
        }
        return false;
      });

      return {
        staff_id: staff.id,
        staff_name: staff.full_name || staff.email || "Unknown",
        staff_email: staff.email,
        role: staff.role,
        assigned_count: assignedNewcomers.length,
        completed_count: completed,
        in_progress_count: inProgress,
        not_started_count: notStarted,
        overdue_count: overdue,
        completion_rate: completionRate,
        average_response_time_hours: averageResponseTimeHours,
        average_response_time_days: averageResponseTimeHours / 24,
        is_active: recentActivity || assignedNewcomers.length > 0,
      };
    });

    // Sort by assigned count (descending)
    performanceMetrics.sort((a, b) => b.assigned_count - a.assigned_count);

    return NextResponse.json({
      staffPerformance: performanceMetrics,
      totalStaff: performanceMetrics.length,
      activeStaff: performanceMetrics.filter((s) => s.is_active).length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/reports/staff-performance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");
    const status = searchParams.get("status");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    // Base query for newcomers with assignments
    let newcomersQuery = admin
      .from("newcomers")
      .select(`
        id,
        full_name,
        email,
        phone,
        status,
        followup_status,
        followup_count,
        last_followup_at,
        assigned_at,
        created_at,
        assigned_to,
        staff:profiles!newcomers_assigned_to_fkey(id, full_name, email)
      `)
      .not("assigned_to", "is", null);

    if (staffId) {
      newcomersQuery = newcomersQuery.eq("assigned_to", staffId);
    }

    if (status) {
      newcomersQuery = newcomersQuery.eq("followup_status", status);
    }

    if (startDate) {
      newcomersQuery = newcomersQuery.gte("assigned_at", startDate);
    }

    if (endDate) {
      newcomersQuery = newcomersQuery.lte("assigned_at", endDate);
    }

    const { data: newcomers, error } = await newcomersQuery;

    if (error) {
      console.error("Error fetching follow-up statistics:", error);
      return NextResponse.json(
        { error: "Failed to fetch follow-up statistics" },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalAssigned = newcomers?.length || 0;
    const statusBreakdown: Record<string, number> = {};
    const staffBreakdown: Record<string, { count: number; completed: number }> = {};
    let overdueCount = 0;
    let totalResponseTime = 0;
    let respondedCount = 0;
    const now = new Date();

    (newcomers || []).forEach((newcomer) => {
      // Status breakdown
      const followupStatus = newcomer.followup_status || "not_started";
      statusBreakdown[followupStatus] = (statusBreakdown[followupStatus] || 0) + 1;

      // Staff breakdown
      if (newcomer.assigned_to && newcomer.staff) {
        const staffId = newcomer.assigned_to;
        if (!staffBreakdown[staffId]) {
          staffBreakdown[staffId] = {
            count: 0,
            completed: 0,
            staffName: newcomer.staff.full_name || newcomer.staff.email || "Unknown",
          };
        }
        staffBreakdown[staffId].count++;
        if (followupStatus === "contacted" || followupStatus === "completed") {
          staffBreakdown[staffId].completed++;
        }
      }

      // Overdue count (assigned more than 48 hours ago and not contacted/completed)
      if (followupStatus !== "contacted" && followupStatus !== "completed") {
        const assignedAt = newcomer.assigned_at
          ? new Date(newcomer.assigned_at)
          : new Date(newcomer.created_at);
        const hoursSinceAssignment = (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceAssignment > 48) {
          overdueCount++;
        }
      }

      // Response time (time from assignment to first contact)
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

    const averageResponseTime = respondedCount > 0 ? totalResponseTime / respondedCount : 0;
    const completionRate = totalAssigned > 0
      ? ((statusBreakdown["contacted"] || 0) + (statusBreakdown["completed"] || 0)) / totalAssigned * 100
      : 0;

    // Convert staff breakdown to array
    const staffBreakdownArray = Object.entries(staffBreakdown).map(([id, data]) => ({
      staff_id: id,
      staff_name: (data as { count: number; completed: number; staffName: string }).staffName,
      assigned_count: data.count,
      completed_count: data.completed,
      completion_rate: data.count > 0 ? (data.completed / data.count) * 100 : 0,
    }));

    return NextResponse.json({
      totalAssigned,
      statusBreakdown,
      staffBreakdown: staffBreakdownArray,
      overdueCount,
      averageResponseTimeHours: averageResponseTime,
      averageResponseTimeDays: averageResponseTime / 24,
      completionRate,
      newcomers: newcomers || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/reports/followups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

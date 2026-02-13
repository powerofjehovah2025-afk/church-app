import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const userId = user.id;

    // Default to current month if no dates provided
    const now = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    // Get duties (service assignments)
    const { data: duties, error: dutiesError } = await admin
      .from("service_assignments")
      .select(`
        id,
        status,
        service:services(id, date, name, time),
        duty_type:duty_types(id, name)
      `)
      .eq("member_id", userId)
      .gte("service.date", startStr)
      .lte("service.date", endStr);

    if (dutiesError) {
      console.error("Error fetching duties:", dutiesError);
    }

    // Get tasks with due dates
    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id, title, status, priority, due_date, created_at")
      .eq("assigned_to", userId)
      .not("due_date", "is", null)
      .gte("due_date", startStr)
      .lte("due_date", endStr);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    }

    // Format calendar events
    const events: Array<{
      id: string;
      type: "duty" | "task";
      title: string;
      date: string;
      time?: string;
      status: string;
      priority?: string;
    }> = [];

    // Add duties
    (duties || []).forEach((duty: {
      id: string;
      status: string;
      service: { id: string; date: string; name: string; time: string | null } | null;
      duty_type: { id: string; name: string } | null;
    }) => {
      if (duty.service?.date) {
        events.push({
          id: duty.id,
          type: "duty",
          title: `${duty.duty_type?.name || "Duty"} - ${duty.service.name || "Service"}`,
          date: duty.service.date,
          time: duty.service.time || undefined,
          status: duty.status || "pending",
        });
      }
    });

    // Add tasks
    (tasks || []).forEach((task) => {
      if (task.due_date) {
        events.push({
          id: task.id,
          type: "task",
          title: task.title,
          date: task.due_date,
          status: task.status,
          priority: task.priority,
        });
      }
    });

    // Sort by date
    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      return 0;
    });

    return NextResponse.json({
      events,
      startDate: startStr,
      endDate: endStr,
    });
  } catch (error) {
    console.error("Error in GET /api/member/calendar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


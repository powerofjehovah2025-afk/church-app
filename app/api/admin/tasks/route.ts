import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get("assigned_to");
    const status = searchParams.get("status");

    let query = admin.from("tasks").select(`
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
      assigned_by_profile:profiles!tasks_assigned_by_fkey(id, full_name, email)
    `);

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo);
    }

    if (status) {
      query = query.eq("status", status);
    }

    query = query.order("created_at", { ascending: false });

    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: tasks || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await request.json();

    const {
      title,
      description,
      assigned_to,
      assigned_by,
      priority,
      due_date,
      notes,
    } = body;

    if (!title || !assigned_to || !assigned_by) {
      return NextResponse.json(
        { error: "Title, assigned_to, and assigned_by are required" },
        { status: 400 }
      );
    }

    const { data: task, error } = await admin
      .from("tasks")
      .insert({
        title,
        description: description || null,
        assigned_to,
        assigned_by,
        priority: priority || "medium",
        due_date: due_date || null,
        notes: notes || null,
        status: "pending",
      })
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email),
        assigned_by_profile:profiles!tasks_assigned_by_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 }
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


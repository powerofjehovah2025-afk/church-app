import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const admin = createAdminClient();

    // Get member profile with skills and availability
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("id", memberId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get assigned tasks
    const { data: tasks, error: tasksError } = await admin
      .from("tasks")
      .select("id, title, status, priority, due_date, created_at")
      .eq("assigned_to", memberId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    }

    // Get assigned duties (service assignments)
    const { data: duties, error: dutiesError } = await admin
      .from("service_assignments")
      .select(`
        id,
        status,
        service:services(id, date, name, time),
        duty_type:duty_types(id, name)
      `)
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (dutiesError) {
      console.error("Error fetching duties:", dutiesError);
    }

    // Get messages (both sent and received)
    const { data: messages, error: messagesError } = await admin
      .from("messages")
      .select(`
        id,
        subject,
        body,
        is_read,
        created_at,
        sender:profiles!messages_sender_id_fkey(id, full_name, email),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
      `)
      .or(`sender_id.eq.${memberId},recipient_id.eq.${memberId}`)
      .order("created_at", { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
    }

    // Get assigned newcomers
    const { data: newcomers, error: newcomersError } = await admin
      .from("newcomers")
      .select("id, full_name, email, phone, status, followup_status, created_at")
      .eq("assigned_to", memberId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (newcomersError) {
      console.error("Error fetching newcomers:", newcomersError);
    }

    return NextResponse.json({
      profile,
      tasks: tasks || [],
      duties: duties || [],
      messages: messages || [],
      newcomers: newcomers || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/members/[memberId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


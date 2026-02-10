import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staff_id");
    const isSent = searchParams.get("is_sent");
    const reminderType = searchParams.get("reminder_type");

    let query = admin
      .from("followup_reminders")
      .select(`
        *,
        newcomer:newcomers(id, full_name, email, phone, followup_status),
        staff:profiles!followup_reminders_staff_id_fkey(id, full_name, email)
      `);

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }

    if (isSent !== null) {
      query = query.eq("is_sent", isSent === "true");
    }

    if (reminderType) {
      query = query.eq("reminder_type", reminderType);
    }

    // Filter to show reminders that are due today or overdue
    query = query.lte("reminder_date", new Date().toISOString().split("T")[0]);

    query = query.order("reminder_date", { ascending: true });

    const { data: reminders, error } = await query;

    if (error) {
      console.error("Error fetching reminders:", error);
      return NextResponse.json(
        { error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reminders: reminders || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/followups/reminders:", error);
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

    const { newcomer_id, staff_id, reminder_type, reminder_date } = body;

    if (!newcomer_id || !staff_id || !reminder_type || !reminder_date) {
      return NextResponse.json(
        { error: "newcomer_id, staff_id, reminder_type, and reminder_date are required" },
        { status: 400 }
      );
    }

    const { data: reminder, error } = await admin
      .from("followup_reminders")
      .insert({
        newcomer_id,
        staff_id,
        reminder_type,
        reminder_date,
        is_sent: false,
      })
      .select(`
        *,
        newcomer:newcomers(id, full_name, email, phone),
        staff:profiles!followup_reminders_staff_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating reminder:", error);
      return NextResponse.json(
        { error: "Failed to create reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/followups/reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const body = await request.json();

    const { reminder_id, is_sent } = body;

    if (!reminder_id || is_sent === undefined) {
      return NextResponse.json(
        { error: "reminder_id and is_sent are required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      is_sent,
    };

    if (is_sent) {
      updateData.sent_at = new Date().toISOString();
    } else {
      updateData.sent_at = null;
    }

    const { data: reminder, error } = await admin
      .from("followup_reminders")
      .update(updateData)
      .eq("id", reminder_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating reminder:", error);
      return NextResponse.json(
        { error: "Failed to update reminder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reminder });
  } catch (error) {
    console.error("Error in PUT /api/admin/followups/reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

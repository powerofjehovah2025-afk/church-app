import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const admin = createAdminClient();
    
    // Get current user
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status || !["confirmed", "declined", "maybe"].includes(status)) {
      return NextResponse.json(
        { error: "Valid status (confirmed, declined, maybe) is required" },
        { status: 400 }
      );
    }

    // Check if event exists and is active
    const { data: event, error: eventError } = await admin
      .from("events")
      .select("id, max_attendees, requires_rsvp")
      .eq("id", eventId)
      .eq("is_active", true)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found or inactive" },
        { status: 404 }
      );
    }

    // Check max attendees if status is confirmed
    if (status === "confirmed" && event.max_attendees) {
      const { data: confirmedRsvps } = await admin
        .from("event_rsvps")
        .select("id", { count: "exact" })
        .eq("event_id", eventId)
        .eq("status", "confirmed");

      const confirmedCount = confirmedRsvps?.length || 0;
      if (confirmedCount >= event.max_attendees) {
        return NextResponse.json(
          { error: "Event is at full capacity" },
          { status: 400 }
        );
      }
    }

    // Upsert RSVP
    const { data: rsvp, error: rsvpError } = await admin
      .from("event_rsvps")
      .upsert(
        {
          event_id: eventId,
          member_id: user.id,
          status,
          notes: notes || null,
        },
        {
          onConflict: "event_id,member_id",
        }
      )
      .select()
      .single();

    if (rsvpError) {
      console.error("Error creating/updating RSVP:", rsvpError);
      return NextResponse.json(
        { error: "Failed to RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ rsvp }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/member/events/[eventId]/rsvp:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const admin = createAdminClient();
    
    // Get current user
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { error } = await admin
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("member_id", user.id);

    if (error) {
      console.error("Error deleting RSVP:", error);
      return NextResponse.json(
        { error: "Failed to cancel RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/member/events/[eventId]/rsvp:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


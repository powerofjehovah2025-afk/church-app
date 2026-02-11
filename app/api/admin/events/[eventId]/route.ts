import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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

    const { data: event, error } = await admin
      .from("events")
      .select(`
        *,
        created_by_profile:profiles!events_created_by_fkey(id, full_name, email),
        rsvps:event_rsvps(
          id,
          status,
          notes,
          rsvp_at,
          updated_at,
          member:profiles!event_rsvps_member_id_fkey(id, full_name, email, phone)
        )
      `)
      .eq("id", eventId)
      .single();

    if (error) {
      console.error("Error fetching event:", error);
      return NextResponse.json(
        { error: "Failed to fetch event" },
        { status: 500 }
      );
    }

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error in GET /api/admin/events/[eventId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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

    const body = await request.json();
    const {
      title,
      description,
      event_date,
      start_time,
      end_time,
      location,
      max_attendees,
      is_active,
      requires_rsvp,
    } = body;

    const updateData: {
      title?: string;
      description?: string | null;
      event_date?: string;
      start_time?: string | null;
      end_time?: string | null;
      location?: string | null;
      max_attendees?: number | null;
      is_active?: boolean;
      requires_rsvp?: boolean;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (location !== undefined) updateData.location = location;
    if (max_attendees !== undefined) updateData.max_attendees = max_attendees;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (requires_rsvp !== undefined) updateData.requires_rsvp = requires_rsvp;

    const { data: event, error } = await admin
      .from("events")
      .update(updateData)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      console.error("Error updating event:", error);
      return NextResponse.json(
        { error: "Failed to update event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error in PUT /api/admin/events/[eventId]:", error);
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

    const { error } = await admin
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json(
        { error: "Failed to delete event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/events/[eventId]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


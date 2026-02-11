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
    const isActive = searchParams.get("is_active");

    let query = admin
      .from("events")
      .select(`
        *,
        created_by_profile:profiles!events_created_by_fkey(id, full_name, email),
        rsvp_count:event_rsvps(count)
      `)
      .order("event_date", { ascending: false })
      .order("start_time", { ascending: true });

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!title || !event_date) {
      return NextResponse.json(
        { error: "Title and event_date are required" },
        { status: 400 }
      );
    }

    const { data: event, error } = await admin
      .from("events")
      .insert({
        title,
        description: description || null,
        event_date,
        start_time: start_time || null,
        end_time: end_time || null,
        location: location || null,
        max_attendees: max_attendees || null,
        is_active: is_active !== undefined ? is_active : true,
        requires_rsvp: requires_rsvp !== undefined ? requires_rsvp : false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json(
        { error: "Failed to create event" },
        { status: 500 }
      );
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


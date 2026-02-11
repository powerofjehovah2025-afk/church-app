import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const admin = createAdminClient();
    
    // Get current user
    const { data: { user } } = await admin.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const upcoming = searchParams.get("upcoming");

    let query = admin
      .from("events")
      .select(`
        *,
        rsvps:event_rsvps!inner(
          id,
          status,
          notes,
          rsvp_at,
          member:profiles!event_rsvps_member_id_fkey(id, full_name, email)
        )
      `)
      .eq("is_active", true)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    // Filter by date range
    if (startDate) {
      query = query.gte("event_date", startDate);
    }
    if (endDate) {
      query = query.lte("event_date", endDate);
    }
    if (upcoming === "true") {
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("event_date", today);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching events:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    // Get user's RSVPs separately to avoid filtering issues
    const { data: userRsvps } = await admin
      .from("event_rsvps")
      .select("event_id, status, notes, rsvp_at")
      .eq("member_id", user.id);

    const rsvpMap = new Map(
      (userRsvps || []).map((rsvp) => [rsvp.event_id, rsvp])
    );

    // Attach user's RSVP status to each event
    const eventsWithRsvp = (events || []).map((event) => ({
      ...event,
      user_rsvp: rsvpMap.get(event.id) || null,
    }));

    return NextResponse.json({ events: eventsWithRsvp });
  } catch (error) {
    console.error("Error in GET /api/member/events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


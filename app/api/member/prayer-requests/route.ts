import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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
    const { data: requests, error } = await admin
      .from("prayer_requests")
      .select(`
        *,
        assigned_to_profile:profiles!prayer_requests_assigned_to_fkey(id, full_name, email)
      `)
      .eq("member_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prayer requests:", error);
      return NextResponse.json(
        { error: "Failed to fetch prayer requests" },
        { status: 500 }
      );
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (error) {
    console.error("Error in GET /api/member/prayer-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const body = await request.json();
    const { title, request: requestText, priority, is_anonymous } = body;

    if (!title || !requestText) {
      return NextResponse.json(
        { error: "Title and request are required" },
        { status: 400 }
      );
    }

    const { data: prayerRequest, error } = await admin
      .from("prayer_requests")
      .insert({
        member_id: user.id,
        title,
        request: requestText,
        priority: priority || "normal",
        is_anonymous: is_anonymous || false,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating prayer request:", error);
      return NextResponse.json(
        { error: "Failed to create prayer request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: prayerRequest }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/member/prayer-requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


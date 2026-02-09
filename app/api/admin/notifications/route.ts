import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const isRead = searchParams.get("is_read");
    const type = searchParams.get("type");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    let query = admin
      .from("notifications")
      .select("*")
      .eq("user_id", userId);

    if (isRead !== null) {
      query = query.eq("is_read", isRead === "true");
    }

    if (type) {
      query = query.eq("type", type);
    }

    query = query.order("created_at", { ascending: false });

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/notifications:", error);
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

    const { user_id, type, title, message, link } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: "user_id, type, title, and message are required" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await admin
      .from("notifications")
      .insert({
        user_id,
        type,
        title,
        message,
        link: link || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      return NextResponse.json(
        { error: "Failed to create notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


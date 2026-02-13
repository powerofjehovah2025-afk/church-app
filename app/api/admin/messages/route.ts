import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get("recipient_id");
    const senderId = searchParams.get("sender_id");
    const isRead = searchParams.get("is_read");

    let query = admin.from("messages").select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, email),
      recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
    `);

    if (recipientId) {
      query = query.eq("recipient_id", recipientId);
    }

    if (senderId) {
      query = query.eq("sender_id", senderId);
    }

    if (isRead !== null) {
      query = query.eq("is_read", isRead === "true");
    }

    query = query.order("created_at", { ascending: false });

    const { data: messages, error } = await query;

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/messages:", error);
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

    const { sender_id, recipient_id, subject, body: messageBody } = body;

    if (!sender_id || !recipient_id || !subject || !messageBody) {
      return NextResponse.json(
        { error: "sender_id, recipient_id, subject, and body are required" },
        { status: 400 }
      );
    }

    const { data: message, error } = await admin
      .from("messages")
      .insert({
        sender_id,
        recipient_id,
        subject,
        body: messageBody,
        is_read: false,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
      `)
      .single();

    if (error) {
      console.error("Error creating message:", error);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    // Create notification for recipient
    await admin.from("notifications").insert({
      user_id: recipient_id,
      type: "message",
      title: `New message from ${message.sender?.full_name || message.sender?.email || "Admin"}`,
      message: subject,
      link: "/dashboard?tab=messages",
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


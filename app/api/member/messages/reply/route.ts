import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { message_id, body: replyBody } = body as { message_id?: string; body?: string };

    if (!message_id || typeof replyBody !== "string" || !replyBody.trim()) {
      return NextResponse.json(
        { error: "message_id and body are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: originalMessage, error: fetchError } = await admin
      .from("messages")
      .select("id, sender_id, recipient_id, subject")
      .eq("id", message_id)
      .single();

    if (fetchError || !originalMessage) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (originalMessage.recipient_id !== user.id) {
      return NextResponse.json(
        { error: "You can only reply to messages sent to you" },
        { status: 403 }
      );
    }

    const subject = originalMessage.subject?.startsWith("Re:")
      ? originalMessage.subject
      : `Re: ${originalMessage.subject ?? "Message"}`;

    const { data: newMessage, error: insertError } = await admin
      .from("messages")
      .insert({
        sender_id: user.id,
        recipient_id: originalMessage.sender_id,
        subject,
        body: replyBody.trim(),
        is_read: false,
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, email),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, email)
      `)
      .single();

    if (insertError) {
      console.error("Error creating reply:", insertError);
      return NextResponse.json(
        { error: "Failed to send reply" },
        { status: 500 }
      );
    }

    await admin.from("notifications").insert({
      user_id: originalMessage.sender_id,
      type: "message",
      title: "New reply to your message",
      message: subject,
      link: "/dashboard?tab=messages",
    }).then(({ error: notifyErr }) => {
      if (notifyErr) console.error("Error creating reply notification:", notifyErr);
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error("POST /api/member/messages/reply:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
